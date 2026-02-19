import type {
  ClientConfig,
  HttpMethod,
  ParseMode,
  RequestContext,
  ResponseContext,
  RetryPolicy,
  ObservabilityEvent,
} from "./types";
import {
  ApiError,
  HttpError,
  TimeoutError,
  AbortError,
  ParseError,
  classifyError,
} from "./errors";
import {
  runRequestMiddlewares,
  runResponseMiddlewares,
  runErrorMiddlewares,
} from "./middleware.js";
import { createAuthMiddleware } from "./auth";
import { DedupeTracker, type DedupeConfig } from "./dedupe";
import { ConcurrencyLimiter } from "./concurrency";

// ─── Internal Types ──────────────────────────────────────────────────────────

export interface TransportRequest {
  method: HttpMethod;
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
  parseAs?: ParseMode;
  meta?: Record<string, unknown>;
  endpointDef?: import("./types.js").AnyEndpointDef;
}

// ─── Transport ───────────────────────────────────────────────────────────────

export class Transport {
  private readonly config: ClientConfig;
  private readonly middlewares: import("./types.js").Middleware[];
  private readonly dedupe: DedupeTracker | null;
  private readonly limiter: ConcurrencyLimiter | null;

  constructor(config: ClientConfig) {
    this.config = config;

    // Build middleware stack: auth first, then user middlewares
    this.middlewares = [];
    if (config.auth) {
      this.middlewares.push(createAuthMiddleware(config.auth));
    }
    if (config.middlewares) {
      this.middlewares.push(...config.middlewares);
    }

    // Optional features
    this.dedupe = config.dedupe?.enabled
      ? new DedupeTracker(config.dedupe as DedupeConfig)
      : null;

    this.limiter = config.concurrency
      ? new ConcurrencyLimiter(config.concurrency.max)
      : null;
  }

  /**
   * Execute a request through the full pipeline:
   * middleware → dedupe → concurrency → fetch → parse → middleware
   */
  async execute<T = unknown>(req: TransportRequest): Promise<T> {
    const parseAs = req.parseAs ?? "json";
    const retryPolicy = this.config.retry || null;
    const maxAttempts = retryPolicy ? retryPolicy.maxRetries + 1 : 1;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        if (attempt > 0) {
          this.emit({ type: "retry", ctx: buildRequestCtx(req), attempt });
          if (retryPolicy) {
            await this.retryDelay(retryPolicy, attempt, lastError);
          }
        }

        const result = await this.executeSingle<T>(req, parseAs);
        return result;
      } catch (err) {
        const apiErr =
          err instanceof ApiError
            ? err
            : classifyError(err, req.url, req.method);
        lastError = apiErr;

        // Don't retry aborts
        if (apiErr instanceof AbortError) throw apiErr;

        // Check if retryable
        if (
          attempt < maxAttempts - 1 &&
          apiErr.isRetryable &&
          (!retryPolicy?.shouldRetry ||
            retryPolicy.shouldRetry(apiErr, attempt))
        ) {
          continue;
        }

        throw apiErr;
      }
    }

    throw lastError!;
  }

  private async executeSingle<T>(
    req: TransportRequest,
    parseAs: ParseMode,
  ): Promise<T> {
    // Build request context
    let ctx: RequestContext = buildRequestCtx(req);

    // Run request middlewares
    if (this.middlewares.length > 0) {
      ctx = await runRequestMiddlewares(this.middlewares, ctx);
    }

    this.emit({ type: "request_start", ctx });
    const startTime = performance.now();

    // Timeout handling
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let timeoutController: AbortController | undefined;
    const effectiveTimeout = req.timeoutMs ?? this.config.timeoutMs;

    let signal = ctx.signal;
    if (effectiveTimeout) {
      timeoutController = new AbortController();
      timeoutId = setTimeout(
        () => timeoutController!.abort(),
        effectiveTimeout,
      );

      // Compose signals: user signal + timeout signal
      if (signal) {
        const composed = composeAbortSignals(signal, timeoutController.signal);
        signal = composed;
      } else {
        signal = timeoutController.signal;
      }
    }

    try {
      // Concurrency limiting
      if (this.limiter) {
        await this.limiter.acquire(signal);
      }

      // Build fetch init (shallow merge, minimal allocations)
      const init: RequestInit = {
        method: ctx.method,
        headers: ctx.headers,
        body: ctx.body,
        signal,
        credentials: this.config.credentials,
        mode: this.config.mode,
      };

      // In-flight dedupe
      let response: Response;
      if (this.dedupe && this.dedupe.shouldDedupe(ctx.method as HttpMethod)) {
        const key = this.dedupe.buildKey(ctx.method as HttpMethod, ctx.url);
        response = await this.dedupe.track(key, () => fetch(ctx.url, init));
      } else {
        response = await fetch(ctx.url, init);
      }

      const durationMs = performance.now() - startTime;

      // Non-2xx → HttpError
      if (!response.ok) {
        const errorBody = await safeParseErrorBody(response);
        const httpErr = new HttpError({
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          url: ctx.url,
          method: ctx.method as HttpMethod,
          errorBody,
        });

        this.emit({ type: "response_error", ctx, durationMs, error: httpErr });

        // Run error middlewares (for auth retry etc.)
        if (this.middlewares.length > 0) {
          const result = await runErrorMiddlewares(
            this.middlewares,
            ctx,
            httpErr,
          );
          // If auth middleware flagged retry
          if (result.ctx.meta?.__authRetry) {
            // Re-execute with fresh auth headers
            const retryReq = { ...req, meta: { ...req.meta } };
            return this.executeSingle<T>(retryReq, parseAs);
          }
          throw result.error;
        }

        throw httpErr;
      }

      // Parse response body
      const body = await parseResponseBody(response, parseAs);

      // Build response context
      const resCtx: ResponseContext = {
        request: ctx,
        status: response.status,
        headers: response.headers,
        body,
      };

      // Run response middlewares
      let finalCtx = resCtx;
      if (this.middlewares.length > 0) {
        finalCtx = await runResponseMiddlewares(this.middlewares, resCtx);
      }

      this.emit({ type: "response_ok", ctx, durationMs });
      return finalCtx.body as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;

      // Classify the raw error
      const apiErr = classifyRawFetchError(
        err,
        ctx.url,
        ctx.method as HttpMethod,
        effectiveTimeout,
      );

      const durationMs = performance.now() - startTime;
      if (apiErr instanceof TimeoutError) {
        this.emit({ type: "timeout", ctx, durationMs, error: apiErr });
      } else if (apiErr instanceof AbortError) {
        this.emit({ type: "abort", ctx, durationMs, error: apiErr });
      } else {
        this.emit({ type: "response_error", ctx, durationMs, error: apiErr });
      }

      // Run error middlewares
      if (this.middlewares.length > 0) {
        const result = await runErrorMiddlewares(this.middlewares, ctx, apiErr);
        throw result.error;
      }

      throw apiErr;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      if (this.limiter) this.limiter.release();
    }
  }

  private async retryDelay(
    policy: RetryPolicy,
    attempt: number,
    lastError: Error | null,
  ): Promise<void> {
    let delayMs =
      (policy.baseDelayMs ?? 1000) *
      Math.pow(policy.backoffMultiplier ?? 2, attempt - 1);
    if (policy.maxDelayMs) delayMs = Math.min(delayMs, policy.maxDelayMs);

    // Respect Retry-After header
    if (lastError instanceof HttpError && lastError.retryAfterSeconds != null) {
      delayMs = Math.max(delayMs, lastError.retryAfterSeconds * 1000);
    }

    // Add jitter (±25%)
    delayMs *= 0.75 + Math.random() * 0.5;

    return new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  private emit(
    event: Partial<ObservabilityEvent> &
      Pick<ObservabilityEvent, "type" | "ctx">,
  ): void {
    if (this.config.onEvent) {
      this.config.onEvent(event as ObservabilityEvent);
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildRequestCtx(req: TransportRequest): RequestContext {
  // Encode body + set Content-Type
  let body: BodyInit | null | undefined;
  const headers: Record<string, string> = { ...req.headers };

  if (req.body !== undefined && req.body !== null) {
    if (
      req.body instanceof FormData ||
      req.body instanceof URLSearchParams ||
      req.body instanceof Blob ||
      req.body instanceof ArrayBuffer ||
      typeof req.body === "string"
    ) {
      body = req.body;
      // Don't set Content-Type for FormData (browser does it with boundary)
    } else {
      // Plain object/array → JSON
      body = JSON.stringify(req.body);
      if (!headers["content-type"] && !headers["Content-Type"]) {
        headers["content-type"] = "application/json";
      }
    }
  }

  return {
    method: req.method,
    url: req.url,
    headers,
    body,
    signal: req.signal,
    meta: req.meta ?? {},
    endpointDef: req.endpointDef,
  };
}

function classifyRawFetchError(
  err: unknown,
  url: string,
  method: HttpMethod,
  timeoutMs?: number,
): ApiError {
  // Distinguish timeout abort from user abort
  if (err instanceof DOMException && err.name === "AbortError") {
    // If we had a timeout and the error looks like a timeout abort
    if (timeoutMs) {
      return new TimeoutError(timeoutMs, { cause: err });
    }
    return new AbortError(err.message, { cause: err });
  }
  return classifyError(err, url, method);
}

async function safeParseErrorBody(response: Response): Promise<unknown> {
  try {
    const ct = response.headers.get("content-type") ?? "";
    if (ct.includes("application/json") || ct.includes("+json")) {
      return await response.json();
    }
    return await response.text();
  } catch {
    return undefined;
  }
}

async function parseResponseBody(
  response: Response,
  parseAs: ParseMode,
): Promise<unknown> {
  // 204 No Content
  if (response.status === 204) return undefined;

  try {
    switch (parseAs) {
      case "json": {
        const ct = response.headers.get("content-type") ?? "";
        if (ct.includes("application/json") || ct.includes("+json")) {
          return await response.json();
        }
        // If endpoint explicitly requested JSON, try anyway
        return await response.json();
      }
      case "text":
        return await response.text();
      case "blob":
        return await response.blob();
      case "arrayBuffer":
        return await response.arrayBuffer();
      case "raw":
        return response;
      default:
        return await response.json();
    }
  } catch (err) {
    throw new ParseError(
      `Failed to parse response as ${parseAs}: ${err instanceof Error ? err.message : String(err)}`,
      { cause: err instanceof Error ? err : undefined },
    );
  }
}

/**
 * Compose two AbortSignals into one. If either aborts, the composed signal aborts.
 */
function composeAbortSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  // Use AbortSignal.any if available (modern browsers)
  if ("any" in AbortSignal && typeof (AbortSignal as any).any === "function") {
    return (AbortSignal as any).any([a, b]);
  }

  // Fallback: manual composition
  const controller = new AbortController();

  const onAbort = () => {
    controller.abort(a.aborted ? a.reason : b.reason);
  };

  if (a.aborted || b.aborted) {
    onAbort();
    return controller.signal;
  }

  a.addEventListener("abort", onAbort, { once: true });
  b.addEventListener("abort", onAbort, { once: true });

  return controller.signal;
}
