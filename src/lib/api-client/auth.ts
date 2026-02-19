import type { AuthProvider, Middleware, RequestContext } from "./types";
import { HttpError } from "./errors";

// ─── Single-Flight Refresh Gate ──────────────────────────────────────────────

interface RefreshGate {
  inflight: Promise<"retry" | "fail"> | null;
}

/**
 * Create an auth middleware from an AuthProvider.
 *
 * - Injects auth headers on every request.
 * - On 401 errors, triggers `onAuthError` with single-flight dedup:
 *   only one refresh runs; concurrent 401s await the same promise.
 */
export function createAuthMiddleware(provider: AuthProvider): Middleware {
  const gate: RefreshGate = { inflight: null };

  return {
    name: "auth",

    async onRequest(ctx: RequestContext): Promise<RequestContext> {
      const authHeaders = await provider.getAuthHeaders();
      // Shallow merge auth headers (don't override explicit headers)
      const merged = { ...authHeaders, ...ctx.headers };
      return { ...ctx, headers: merged };
    },

    async onError(
      ctx: RequestContext,
      error: Error,
    ): Promise<{ ctx: RequestContext; error: Error }> {
      if (
        !(error instanceof HttpError) ||
        error.status !== 401 ||
        !provider.onAuthError
      ) {
        return { ctx, error };
      }

      // Single-flight: if a refresh is already in progress, wait for it
      if (gate.inflight) {
        const decision = await gate.inflight;
        if (decision === "retry") {
          // Signal upstream to retry with refreshed credentials
          return {
            ctx: { ...ctx, meta: { ...ctx.meta, __authRetry: true } },
            error,
          };
        }
        return { ctx, error };
      }

      // Start refresh
      gate.inflight = provider.onAuthError(error, ctx).finally(() => {
        gate.inflight = null;
      });

      const decision = await gate.inflight;
      if (decision === "retry") {
        return {
          ctx: { ...ctx, meta: { ...ctx.meta, __authRetry: true } },
          error,
        };
      }
      return { ctx, error };
    },
  };
}

// ─── tokenAuth Helper ────────────────────────────────────────────────────────

export interface TokenAuthOptions {
  /** Header name (default: "Authorization"). */
  headerName?: string;
  /** Prefix (default: "Bearer "). Set to empty string for no prefix. */
  prefix?: string;
  /** Called on 401. Should refresh the token and return "retry" or "fail". */
  onRefresh?: () => Promise<"retry" | "fail">;
}

/**
 * Convenience factory for bearer-token auth.
 *
 * ```ts
 * auth: tokenAuth(() => localStorage.getItem("token"), {
 *   onRefresh: async () => { await refreshToken(); return "retry"; }
 * })
 * ```
 */
export function tokenAuth(
  getToken: () =>
    | string
    | null
    | undefined
    | Promise<string | null | undefined>,
  options?: TokenAuthOptions,
): AuthProvider {
  const headerName = options?.headerName ?? "Authorization";
  const prefix = options?.prefix ?? "Bearer ";

  return {
    async getAuthHeaders(): Promise<Record<string, string>> {
      const token = await getToken();
      if (!token) return {};
      return { [headerName]: prefix + token };
    },
    onAuthError: options?.onRefresh
      ? async () => options.onRefresh!()
      : undefined,
  };
}
