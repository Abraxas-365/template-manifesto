/**
 * Simple FIFO concurrency limiter.
 * Limits the number of concurrent in-flight requests globally.
 */

interface QueueEntry {
  resolve: () => void;
  reject: (reason: unknown) => void;
  signal?: AbortSignal;
}

export class ConcurrencyLimiter {
  private readonly max: number;
  private active = 0;
  private readonly queue: QueueEntry[] = [];

  constructor(max: number) {
    this.max = max;
  }

  /**
   * Acquire a slot. Resolves immediately if under limit, otherwise queues FIFO.
   * If the signal is aborted while waiting, the entry is removed from the queue.
   */
  async acquire(signal?: AbortSignal): Promise<void> {
    if (this.active < this.max) {
      this.active++;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      const entry: QueueEntry = { resolve, reject, signal };
      this.queue.push(entry);

      if (signal) {
        const onAbort = () => {
          const idx = this.queue.indexOf(entry);
          if (idx !== -1) {
            this.queue.splice(idx, 1);
            reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
          }
        };

        if (signal.aborted) {
          onAbort();
          return;
        }

        signal.addEventListener("abort", onAbort, { once: true });
      }
    });
  }

  /**
   * Release a slot and dequeue the next waiting request.
   */
  release(): void {
    this.active--;

    while (this.queue.length > 0) {
      const next = this.queue.shift()!;
      // Skip entries whose signals have been aborted while queued
      if (next.signal?.aborted) continue;
      this.active++;
      next.resolve();
      return;
    }
  }
}
