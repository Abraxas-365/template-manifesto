import type { ApiSchema, ApiServices, ClientConfig, HttpMethod } from "./types";
import { Transport, type TransportRequest } from "./transport";
import { generateServices, type TagRegistry } from "./services";
import { resolvePath, buildUrl } from "./url";

// ─── Client Interface ────────────────────────────────────────────────────────

export interface ApiClient {
  /**
   * Generate typed domain services from a schema definition.
   * Returns the services object with `api.[domain].[method](params)` shape.
   */
  services<S extends ApiSchema>(
    schema: S,
  ): ApiServices<S> & {
    /** Tag registry for tag-based invalidation. */
    $tagRegistry: TagRegistry;
  };

  /**
   * Make a raw request through the client pipeline (middleware, auth, retry, etc.)
   * without going through a generated service method.
   */
  request<T = unknown>(
    method: HttpMethod,
    path: string,
    options?: {
      pathParams?: Record<string, unknown>;
      query?: Record<string, unknown>;
      headers?: Record<string, string>;
      body?: unknown;
      signal?: AbortSignal;
      timeoutMs?: number;
      parseAs?: "json" | "text" | "blob" | "arrayBuffer" | "raw";
      meta?: Record<string, unknown>;
    },
  ): Promise<T>;
}

// ─── Factory ─────────────────────────────────────────────────────────────────

/**
 * Create a single API client instance.
 *
 * ```ts
 * const client = createApiClient({
 *   baseUrl: "https://api.example.com",
 *   timeoutMs: 15_000,
 *   auth: tokenAuth(() => localStorage.getItem("token")),
 * });
 *
 * export const api = client.services(schema);
 * ```
 */
export function createApiClient(config: ClientConfig): ApiClient {
  // Merge default headers
  const resolvedConfig: ClientConfig = {
    ...config,
    defaultHeaders: config.defaultHeaders ?? {},
  };

  const transport = new Transport(resolvedConfig);

  return {
    services<S extends ApiSchema>(schema: S) {
      const { services, tagRegistry } = generateServices<S>(
        schema,
        transport,
        resolvedConfig.baseUrl,
      );

      // Attach tag registry
      (services as any).$tagRegistry = tagRegistry;

      return services as ApiServices<S> & { $tagRegistry: TagRegistry };
    },

    request<T = unknown>(
      method: HttpMethod,
      path: string,
      options?: {
        pathParams?: Record<string, unknown>;
        query?: Record<string, unknown>;
        headers?: Record<string, string>;
        body?: unknown;
        signal?: AbortSignal;
        timeoutMs?: number;
        parseAs?: "json" | "text" | "blob" | "arrayBuffer" | "raw";
        meta?: Record<string, unknown>;
      },
    ): Promise<T> {
      const resolvedPath = resolvePath(path, options?.pathParams);
      const url = buildUrl(
        resolvedConfig.baseUrl,
        resolvedPath,
        options?.query,
      );

      const req: TransportRequest = {
        method,
        url,
        headers: {
          ...resolvedConfig.defaultHeaders,
          ...options?.headers,
        },
        body: options?.body,
        signal: options?.signal,
        timeoutMs: options?.timeoutMs,
        parseAs: options?.parseAs,
        meta: options?.meta,
      };

      return transport.execute<T>(req);
    },
  };
}
