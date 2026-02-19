// ─── Core ────────────────────────────────────────────────────────────────────
export { createApiClient } from "./client";
export type { ApiClient } from "./client";

// ─── Schema Helpers ──────────────────────────────────────────────────────────
export { endpoint, t } from "./types";

// ─── Auth ────────────────────────────────────────────────────────────────────
export { tokenAuth } from "./auth";
export type { TokenAuthOptions } from "./auth";

// ─── Errors ──────────────────────────────────────────────────────────────────
export {
  ApiError,
  NetworkError,
  TimeoutError,
  AbortError,
  HttpError,
  ParseError,
} from "./errors.js";
export type { ErrorKind } from "./errors";

// ─── React Query Helpers ─────────────────────────────────────────────────────
export {
  invalidateTags,
  createRetryFn,
  createRetryDelayFn,
} from "./react-query";

// ─── Query Keys ──────────────────────────────────────────────────────────────
export { buildQueryKey, buildDomainKey, stableSerialize } from "./query-keys";

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  HttpMethod,
  ParseMode,
  AnyEndpointDef,
  EndpointOptions,
  ApiSchema,
  DomainSchema,
  ApiServices,
  ServiceMethod,
  MethodHelpers,
  InferParams,
  InferOkResponse,
  InferErrorBody,
  CommonParams,
  RawResponse,
  ClientConfig,
  Middleware,
  RequestContext,
  ResponseContext,
  AuthProvider,
  RetryPolicy,
  EventType,
  ObservabilityEvent,
} from "./types";

export type { TagRegistry } from "./services";
