/**
 * In-flight deduplication for GET (or configurable) requests.
 * Identical requests that are still pending share the same Promise.
 */

import type { HttpMethod } from "./types";

export interface DedupeConfig {
  enabled: boolean;
  only?: HttpMethod[];
}

interface InflightEntry {
  promise: Promise<Response>;
  refCount: number;
}

export class DedupeTracker {
  private readonly inflight = new Map<string, InflightEntry>();
  private readonly allowedMethods: Set<HttpMethod>;

  constructor(config: DedupeConfig) {
    this.allowedMethods = new Set(config.only ?? ["GET"]);
  }

  shouldDedupe(method: HttpMethod): boolean {
    return this.allowedMethods.has(method);
  }

  /**
   * Build a canonical key for deduplication.
   * Includes method + url (which already has sorted query params).
   */
  buildKey(method: HttpMethod, url: string): string {
    return method + "\0" + url;
  }

  /**
   * Get an existing in-flight promise, or register a new one.
   * Returns the shared promise, or null if there's no existing entry (caller should execute).
   */
  track(key: string, executor: () => Promise<Response>): Promise<Response> {
    const existing = this.inflight.get(key);
    if (existing) {
      existing.refCount++;
      return existing.promise;
    }

    const promise = executor().finally(() => {
      this.inflight.delete(key);
    });

    this.inflight.set(key, { promise, refCount: 1 });
    return promise;
  }

  /**
   * Remove a key from tracking (e.g., on abort).
   */
  evict(key: string): void {
    this.inflight.delete(key);
  }
}
