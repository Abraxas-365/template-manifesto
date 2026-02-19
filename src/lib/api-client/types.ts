// ─── Utility Types ───────────────────────────────────────────────────────────

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

type IsNever<T> = [T] extends [never] ? true : false;

type HasKey<T, K extends string> =
  T extends Record<K, unknown>
    ? IsNever<T[K]> extends true
      ? false
      : true
    : false;

// ─── HTTP Primitives ─────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ParseMode = "json" | "text" | "blob" | "arrayBuffer" | "raw";

// ─── Endpoint Definition ─────────────────────────────────────────────────────

export interface EndpointOptions {
  readonly idempotent?: boolean;
  readonly parseAs?: ParseMode;
  readonly cache?: { readonly etag?: boolean };
  readonly tags?: readonly string[];
}

/**
 * Base endpoint definition shape. Used as constraint for generics.
 */
export interface AnyEndpointDef {
  readonly method: HttpMethod;
  readonly path: string;
  readonly request?: {
    readonly path?: Record<string, unknown>;
    readonly query?: Record<string, unknown>;
    readonly headers?: Record<string, string>;
    readonly body?: unknown;
  };
  readonly response: {
    readonly ok: unknown;
    readonly error?: unknown;
  };
  readonly options?: EndpointOptions;
}

// ─── Type-level Phantom Helper ───────────────────────────────────────────────

/**
 * Zero-cost type marker for endpoint definitions.
 * Usage: `request: { path: t<{ userId: string }>() }`
 */
export function t<T>(): T {
  return undefined as T;
}

/**
 * Identity function that preserves the literal type of an endpoint definition.
 */
export function endpoint<const E extends AnyEndpointDef>(def: E): E {
  return def;
}

// ─── Schema Types ────────────────────────────────────────────────────────────

export type DomainSchema = Record<string, AnyEndpointDef>;
export type ApiSchema = Record<string, DomainSchema>;

// ─── Param Inference ─────────────────────────────────────────────────────────

/** Common params available on every service method call. */
export interface CommonParams {
  signal?: AbortSignal;
  timeoutMs?: number;
  meta?: Record<string, unknown>;
}

/** Raw response wrapper when parseAs='raw' or requested explicitly. */
export interface RawResponse<T = unknown> {
  status: number;
  headers: Headers;
  data: T;
}

/**
 * Infer the params type for a service method from its endpoint definition.
 * Only includes path/query/body/headers if the endpoint defines them.
 */
export type InferParams<E extends AnyEndpointDef> = Simplify<
  (E["request"] extends { path: infer P extends Record<string, unknown> }
    ? { path: P }
    : {}) &
    (E["request"] extends { query: infer Q extends Record<string, unknown> }
      ? { query: Q }
      : {}) &
    (E["request"] extends { body: infer B } ? { body: B } : {}) &
    (E["request"] extends {
      headers: infer H extends Record<string, string>;
    }
      ? { headers: H }
      : {}) &
    CommonParams
>;

/** Infer the success response type. */
export type InferOkResponse<E extends AnyEndpointDef> = E["response"] extends {
  ok: infer T;
}
  ? T
  : unknown;

/** Infer the error body type (if declared). */
export type InferErrorBody<E extends AnyEndpointDef> = E["response"] extends {
  error: infer T;
}
  ? T
  : unknown;

/** Check if endpoint has any required request fields (path/body). */
export type HasRequiredParams<E extends AnyEndpointDef> =
  E["request"] extends undefined
    ? false
    : E["request"] extends object
      ? HasKey<E["request"], "path"> extends true
        ? true
        : HasKey<E["request"], "body"> extends true
          ? true
          : false
      : false;

// ─── Service Method Signature ────────────────────────────────────────────────

export interface MethodHelpers<E extends AnyEndpointDef> {
  /** The original endpoint definition. */
  $def: E;
  /** Generate a stable, deterministic query key for this endpoint + params. */
  $key: (params?: InferParams<E>) => readonly [string, unknown];
  /** Return `{ queryKey, queryFn }` for TanStack Query's `useQuery`. */
  $queryOptions: (
    params?: InferParams<E>,
    options?: { enabled?: boolean },
  ) => {
    queryKey: readonly [string, unknown];
    queryFn: (ctx: { signal: AbortSignal }) => Promise<InferOkResponse<E>>;
    enabled?: boolean;
  };
  /** Return a `mutationFn` for TanStack Query's `useMutation`. */
  $mutationFn: () => (params: InferParams<E>) => Promise<InferOkResponse<E>>;
}

/**
 * The final callable service method type.
 * Params arg is optional when the endpoint has no required path/body fields.
 */
export type ServiceMethod<E extends AnyEndpointDef> =
  HasRequiredParams<E> extends true
    ? ((params: InferParams<E>) => Promise<InferOkResponse<E>>) &
        MethodHelpers<E>
    : ((params?: InferParams<E>) => Promise<InferOkResponse<E>>) &
        MethodHelpers<E>;

/** Map a full API schema into a typed services object. */
export type ApiServices<S extends ApiSchema> = {
  [D in keyof S]: {
    [M in keyof S[D]]: ServiceMethod<S[D][M]>;
  };
};

// ─── Middleware ───────────────────────────────────────────────────────────────

export interface RequestContext {
  method: HttpMethod;
  url: string;
  headers: Record<string, string>;
  body?: BodyInit | null;
  signal?: AbortSignal;
  meta: Record<string, unknown>;
  /** The original endpoint definition, if dispatched through a service. */
  endpointDef?: AnyEndpointDef;
}

export interface ResponseContext {
  request: RequestContext;
  status: number;
  headers: Headers;
  body: unknown;
}

export interface Middleware {
  name?: string;
  onRequest?: (ctx: RequestContext) => RequestContext | Promise<RequestContext>;
  onResponse?: (
    ctx: ResponseContext,
  ) => ResponseContext | Promise<ResponseContext>;
  onError?: (
    ctx: RequestContext,
    error: Error,
  ) =>
    | { ctx: RequestContext; error: Error }
    | Promise<{ ctx: RequestContext; error: Error }>;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthProvider {
  getAuthHeaders(): Record<string, string> | Promise<Record<string, string>>;
  onAuthError?: (
    error: Error,
    ctx: RequestContext,
  ) => Promise<"retry" | "fail">;
}

// ─── Retry ───────────────────────────────────────────────────────────────────

export interface RetryPolicy {
  maxRetries: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  /** Return true to retry, false to fail immediately. */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

// ─── Observability ───────────────────────────────────────────────────────────

export type EventType =
  | "request_start"
  | "response_ok"
  | "response_error"
  | "retry"
  | "abort"
  | "timeout";

export interface ObservabilityEvent {
  type: EventType;
  ctx: RequestContext;
  durationMs?: number;
  error?: Error;
  attempt?: number;
}

// ─── Client Config ───────────────────────────────────────────────────────────

export interface ClientConfig {
  baseUrl: string;
  defaultHeaders?: Record<string, string>;
  credentials?: RequestCredentials;
  mode?: RequestMode;
  timeoutMs?: number;
  middlewares?: Middleware[];
  auth?: AuthProvider;
  retry?: RetryPolicy | false;
  dedupe?: { enabled: boolean; only?: HttpMethod[] };
  concurrency?: { max: number };
  onEvent?: (event: ObservabilityEvent) => void;
  debug?: boolean;
}
