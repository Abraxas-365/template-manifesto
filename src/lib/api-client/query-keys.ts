/**
 * Deterministic query key serialization.
 *
 * Keys are tuple-shaped: `[domainMethod, serializedParams]`
 * where serializedParams has sorted keys, explicit null/undefined handling,
 * and stable array ordering.
 */

// ─── Stable Serialization ────────────────────────────────────────────────────

/**
 * Create a deterministic, serializable representation of params.
 * - Object keys are sorted recursively.
 * - `undefined` values are stripped.
 * - `null` is preserved as `null`.
 * - Arrays maintain order.
 */
export function stableSerialize(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map(stableSerialize);
  }

  if (typeof value === "object" && !(value instanceof Date)) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    const result: Record<string, unknown> = {};
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i] as string;
      const v = obj[k];
      if (v !== undefined) {
        result[k] = stableSerialize(v);
      }
    }
    return result;
  }

  return value;
}

// ─── Query Key Builder ───────────────────────────────────────────────────────

/**
 * Build a stable, deterministic query key for TanStack Query.
 *
 * @param domain - Domain name (e.g., "users")
 * @param method - Method name (e.g., "getUser")
 * @param params - Request params (path, query, body, etc.)
 * @returns Tuple `[string, object | undefined]`
 */
export function buildQueryKey(
  domain: string,
  method: string,
  params?: Record<string, unknown>,
): readonly [string, unknown] {
  const key = `${domain}.${method}`;

  if (!params) return [key, undefined] as const;

  // Only include request-relevant params (not signal, timeoutMs, meta)
  const {
    signal: _,
    timeoutMs: __,
    meta: ___,
    ...requestParams
  } = params as any;

  // Check if there are any params left
  const hasParams = Object.keys(requestParams).length > 0;
  if (!hasParams) return [key, undefined] as const;

  return [key, stableSerialize(requestParams)] as const;
}

/**
 * Build a domain-level key prefix for invalidation.
 */
export function buildDomainKey(domain: string): readonly [string] {
  return [domain] as const;
}
