import type {
  ApiSchema,
  ApiServices,
  AnyEndpointDef,
  CommonParams,
} from "./types.js";
import type { Transport } from "./transport";
import { resolvePath, buildUrl } from "./url";
import { buildQueryKey } from "./query-keys";

// ─── Tag Registry ────────────────────────────────────────────────────────────

export interface TagRegistry {
  /** Map from tag → set of `domain.method` keys */
  tagToKeys: Map<string, Set<string>>;
}

// ─── Service Generation ──────────────────────────────────────────────────────

/**
 * Generate typed service objects from a schema definition.
 * Each endpoint becomes a callable function with attached helpers ($def, $key, $queryOptions, $mutationFn).
 *
 * All generated objects are plain objects (no Proxy).
 */
export function generateServices<S extends ApiSchema>(
  schema: S,
  transport: Transport,
  baseUrl: string,
): { services: ApiServices<S>; tagRegistry: TagRegistry } {
  const tagRegistry: TagRegistry = { tagToKeys: new Map() };
  const services: Record<string, Record<string, unknown>> = {};

  const domains = Object.keys(schema);
  for (let d = 0; d < domains.length; d++) {
    const domainName = domains[d] as string;
    const domainSchema = schema[domainName]!;
    const domainObj: Record<string, unknown> = {};

    const methods = Object.keys(domainSchema);
    for (let m = 0; m < methods.length; m++) {
      const methodName = methods[m] as string;
      const def = domainSchema[methodName] as AnyEndpointDef;

      // Register tags
      if (def.options?.tags) {
        const fullKey = `${domainName}.${methodName}`;
        for (const tag of def.options.tags) {
          let set = tagRegistry.tagToKeys.get(tag);
          if (!set) {
            set = new Set();
            tagRegistry.tagToKeys.set(tag, set);
          }
          set.add(fullKey);
        }
      }

      // Create the callable service method
      domainObj[methodName] = createServiceMethod(
        def,
        domainName,
        methodName,
        transport,
        baseUrl,
      );
    }

    services[domainName] = domainObj;
  }

  return { services: services as ApiServices<S>, tagRegistry };
}

// ─── Method Factory ──────────────────────────────────────────────────────────

function createServiceMethod(
  def: AnyEndpointDef,
  domain: string,
  method: string,
  transport: Transport,
  baseUrl: string,
): Function {
  // The callable function
  const fn = (params?: Record<string, unknown>) => {
    const p = (params ?? {}) as {
      path?: Record<string, unknown>;
      query?: Record<string, unknown>;
      headers?: Record<string, string>;
      body?: unknown;
    } & CommonParams;

    // Resolve path params and build URL
    const resolvedPath = resolvePath(def.path, p.path);
    const url = buildUrl(baseUrl, resolvedPath, p.query);

    return transport.execute({
      method: def.method,
      url,
      headers: p.headers,
      body: p.body,
      signal: p.signal,
      timeoutMs: p.timeoutMs,
      parseAs: def.options?.parseAs,
      meta: p.meta,
      endpointDef: def,
    });
  };

  // Attach helpers as properties on the function
  (fn as any).$def = def;

  (fn as any).$key = (params?: Record<string, unknown>) => {
    return buildQueryKey(domain, method, params);
  };

  (fn as any).$queryOptions = (
    params?: Record<string, unknown>,
    options?: { enabled?: boolean },
  ) => {
    const key = buildQueryKey(domain, method, params);
    return {
      queryKey: key,
      queryFn: (ctx: { signal: AbortSignal }) => {
        const merged = params
          ? { ...params, signal: ctx.signal }
          : { signal: ctx.signal };
        return fn(merged);
      },
      ...(options?.enabled !== undefined ? { enabled: options.enabled } : {}),
    };
  };

  (fn as any).$mutationFn = () => {
    return (params: Record<string, unknown>) => fn(params);
  };

  return fn;
}
