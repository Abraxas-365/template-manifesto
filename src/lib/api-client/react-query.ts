import type { TagRegistry } from "./services";
import type { ApiError } from "./errors";

// ─── Tag-based Invalidation ──────────────────────────────────────────────────

/**
 * TanStack Query client interface (minimal shape needed for invalidation).
 * This avoids a hard dependency on @tanstack/react-query.
 */
interface QueryClient {
  invalidateQueries(options: { queryKey: readonly unknown[] }): Promise<void>;
}

/**
 * Invalidate all queries matching the given tags.
 *
 * ```ts
 * await invalidateTags(queryClient, tagRegistry, ["users", "profiles"])
 * ```
 */
export async function invalidateTags(
  queryClient: QueryClient,
  tagRegistry: TagRegistry,
  tags: string[],
): Promise<void> {
  const keysToInvalidate = new Set<string>();

  for (const tag of tags) {
    const keys = tagRegistry.tagToKeys.get(tag);
    if (keys) {
      for (const key of keys) {
        keysToInvalidate.add(key);
      }
    }
  }

  const promises: Promise<void>[] = [];
  for (const key of keysToInvalidate) {
    promises.push(queryClient.invalidateQueries({ queryKey: [key] }));
  }

  await Promise.all(promises);
}

// ─── Retry Helpers ───────────────────────────────────────────────────────────

/**
 * Default retry function for TanStack Query.
 * Retries network/timeout/5xx errors up to `maxRetries` times.
 *
 * ```ts
 * useQuery({
 *   ...api.users.getUser.$queryOptions({ path: { id: "1" } }),
 *   retry: createRetryFn(3),
 * })
 * ```
 */
export function createRetryFn(maxRetries = 3) {
  return (failureCount: number, error: Error): boolean => {
    if (failureCount >= maxRetries) return false;
    if (
      "isRetryable" in error &&
      typeof (error as ApiError).isRetryable === "boolean"
    ) {
      return (error as ApiError).isRetryable;
    }
    return false;
  };
}

/**
 * Retry delay that respects Retry-After headers from HttpError.
 *
 * ```ts
 * useQuery({
 *   ...api.users.getUser.$queryOptions({ path: { id: "1" } }),
 *   retry: createRetryFn(3),
 *   retryDelay: createRetryDelayFn(),
 * })
 * ```
 */
export function createRetryDelayFn(baseMs = 1000, maxMs = 30_000) {
  return (attempt: number, error: Error): number => {
    // Check for Retry-After
    if ("retryAfterSeconds" in error) {
      const retryAfter = (error as any).retryAfterSeconds;
      if (typeof retryAfter === "number" && retryAfter > 0) {
        return Math.min(retryAfter * 1000, maxMs);
      }
    }
    // Exponential backoff with jitter
    const delay = Math.min(baseMs * Math.pow(2, attempt), maxMs);
    return delay * (0.75 + Math.random() * 0.5);
  };
}
