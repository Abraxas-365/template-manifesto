const BRACE_PARAM = /\{([^}]+)\}/g;
const COLON_PARAM = /:([a-zA-Z_]\w*)/g;

/**
 * Replace `{param}` and `:param` placeholders in a path template.
 * Values are URI-encoded.
 */
export function resolvePath(
  template: string,
  params?: Record<string, unknown>,
): string {
  if (!params) return template;

  let result = template.replace(BRACE_PARAM, (_, key: string) => {
    const val = params[key];
    if (val == null) throw new Error(`Missing path parameter: ${key}`);
    return encodeURIComponent(String(val));
  });

  result = result.replace(COLON_PARAM, (_, key: string) => {
    const val = params[key];
    if (val == null) throw new Error(`Missing path parameter: ${key}`);
    return encodeURIComponent(String(val));
  });

  return result;
}

// ─── Query String Serialization ──────────────────────────────────────────────

/**
 * Serialize a flat/shallow object into a query string.
 * - Keys are sorted for determinism.
 * - `undefined` values are omitted.
 * - `null` is serialized as empty string.
 * - Arrays produce repeated keys: `a=1&a=2`.
 */
export function serializeQuery(
  params: Record<string, unknown> | undefined,
): string {
  if (!params) return "";

  const entries: [string, string][] = [];
  const keys = Object.keys(params).sort();

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i] as string;
    const val = params[key];
    if (val === undefined) continue;

    if (Array.isArray(val)) {
      for (let j = 0; j < val.length; j++) {
        const item = val[j];
        if (item !== undefined) {
          entries.push([key, item == null ? "" : String(item)]);
        }
      }
    } else {
      entries.push([key, val == null ? "" : String(val)]);
    }
  }

  if (entries.length === 0) return "";

  // Build manually to avoid URLSearchParams overhead for simple cases
  let qs = "";
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]!;
    if (i > 0) qs += "&";
    qs += encodeURIComponent(entry[0]) + "=" + encodeURIComponent(entry[1]);
  }
  return qs;
}

// ─── URL Joining ─────────────────────────────────────────────────────────────

/**
 * Join a base URL with a path and optional query string.
 * Handles trailing/leading slashes correctly.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  query?: Record<string, unknown>,
): string {
  // Normalize: strip trailing slash from base, ensure leading slash on path
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const p = path.startsWith("/") ? path : "/" + path;
  const qs = serializeQuery(query);

  if (qs) return base + p + "?" + qs;
  return base + p;
}
