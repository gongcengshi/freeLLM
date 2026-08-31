interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

interface CacheOptions {
  ttlMs?: number;
  maxSize?: number;
}

export class RequestCache<T = any> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private ttlMs: number;
  private maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.ttlMs = options.ttlMs || 60000; // 1 minute default
    this.maxSize = options.maxSize || 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  set(key: string, data: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs || this.ttlMs),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  get size(): number {
    return this.cache.size;
  }
}

// Global response cache for chat completions
export const chatCompletionCache = new RequestCache({
  ttlMs: 30000, // 30 seconds
  maxSize: 500,
});

// Global cache for model listings
export const modelCache = new RequestCache({
  ttlMs: 300000, // 5 minutes
  maxSize: 100,
});

// Cache for health checks
export const healthCache = new RequestCache({
  ttlMs: 60000, // 1 minute
  maxSize: 50,
});
