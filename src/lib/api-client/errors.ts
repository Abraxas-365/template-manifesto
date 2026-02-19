import type { HttpMethod } from "./types";

// ─── Error Kind ──────────────────────────────────────────────────────────────

export type ErrorKind = "network" | "timeout" | "abort" | "http" | "parse";

// ─── Base ────────────────────────────────────────────────────────────────────

export abstract class ApiError extends Error {
  abstract readonly kind: ErrorKind;
  abstract readonly isRetryable: boolean;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

// ─── Network Error ───────────────────────────────────────────────────────────

export class NetworkError extends ApiError {
  readonly kind = "network" as const;
  readonly isRetryable = true;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

// ─── Timeout Error ───────────────────────────────────────────────────────────

export class TimeoutError extends ApiError {
  readonly kind = "timeout" as const;
  readonly isRetryable = true;
  readonly timeoutMs: number;

  constructor(timeoutMs: number, options?: ErrorOptions) {
    super(`Request timed out after ${timeoutMs}ms`, options);
    this.timeoutMs = timeoutMs;
  }
}

// ─── Abort Error ─────────────────────────────────────────────────────────────

export class AbortError extends ApiError {
  readonly kind = "abort" as const;
  readonly isRetryable = false;

  constructor(message = "Request was aborted", options?: ErrorOptions) {
    super(message, options);
  }
}

// ─── HTTP Error ──────────────────────────────────────────────────────────────

const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

export class HttpError<TErrorBody = unknown> extends ApiError {
  readonly kind = "http" as const;
  readonly isRetryable: boolean;

  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly url: string;
  readonly method: HttpMethod;
  readonly errorBody: TErrorBody | undefined;

  /** Value of `Retry-After` header in seconds, if present and parseable. */
  readonly retryAfterSeconds: number | undefined;

  constructor(init: {
    status: number;
    statusText: string;
    headers: Headers;
    url: string;
    method: HttpMethod;
    errorBody?: TErrorBody;
  }) {
    super(
      `HTTP ${init.status} ${init.statusText} – ${init.method} ${init.url}`,
    );
    this.status = init.status;
    this.statusText = init.statusText;
    this.headers = init.headers;
    this.url = init.url;
    this.method = init.method;
    this.errorBody = init.errorBody;
    this.isRetryable = RETRYABLE_STATUS.has(init.status);
    this.retryAfterSeconds = parseRetryAfter(init.headers.get("retry-after"));
  }
}

// ─── Parse Error ─────────────────────────────────────────────────────────────

export class ParseError extends ApiError {
  readonly kind = "parse" as const;
  readonly isRetryable = false;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseRetryAfter(value: string | null): number | undefined {
  if (value == null) return undefined;
  const seconds = Number(value);
  if (!Number.isNaN(seconds) && seconds >= 0) return seconds;
  // Try HTTP-date
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    const delta = (date - Date.now()) / 1000;
    return delta > 0 ? Math.ceil(delta) : 0;
  }
  return undefined;
}

/**
 * Classify a raw error into the appropriate ApiError subclass.
 */
export function classifyError(
  err: unknown,
  url: string,
  method: HttpMethod,
): ApiError {
  if (err instanceof ApiError) return err;

  if (err instanceof DOMException && err.name === "AbortError") {
    return new AbortError(err.message, { cause: err });
  }

  if (err instanceof TypeError) {
    // fetch throws TypeError for network failures
    return new NetworkError(err.message, { cause: err });
  }

  const message = err instanceof Error ? err.message : String(err);
  return new NetworkError(`${method} ${url}: ${message}`, {
    cause: err instanceof Error ? err : undefined,
  });
}
