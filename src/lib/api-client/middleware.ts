import type { Middleware, RequestContext, ResponseContext } from "./types";

/**
 * Run the request phase of the middleware pipeline.
 * Middlewares execute in order (first registered → first to run).
 */
export async function runRequestMiddlewares(
  middlewares: readonly Middleware[],
  ctx: RequestContext,
): Promise<RequestContext> {
  let current = ctx;
  for (let i = 0; i < middlewares.length; i++) {
    const mw = middlewares[i]!;
    if (mw.onRequest) {
      current = await mw.onRequest(current);
    }
  }
  return current;
}

/**
 * Run the response phase of the middleware pipeline.
 * Middlewares execute in reverse order (last registered → first to run).
 */
export async function runResponseMiddlewares(
  middlewares: readonly Middleware[],
  ctx: ResponseContext,
): Promise<ResponseContext> {
  let current = ctx;
  for (let i = middlewares.length - 1; i >= 0; i--) {
    const mw = middlewares[i]!;
    if (mw.onResponse) {
      current = await mw.onResponse(current);
    }
  }
  return current;
}

/**
 * Run the error phase of the middleware pipeline.
 * Middlewares execute in reverse order.
 */
export async function runErrorMiddlewares(
  middlewares: readonly Middleware[],
  ctx: RequestContext,
  error: Error,
): Promise<{ ctx: RequestContext; error: Error }> {
  let result = { ctx, error };
  for (let i = middlewares.length - 1; i >= 0; i--) {
    const mw = middlewares[i]!;
    if (mw.onError) {
      result = await mw.onError(result.ctx, result.error);
    }
  }
  return result;
}
