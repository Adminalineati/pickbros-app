import { Injectable } from '@nestjs/common';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

@Injectable()
export class OddsCacheService {
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly inflight = new Map<string, Promise<unknown>>();

  get<T>(key: string): T | undefined {
    const cached = this.store.get(key) as CacheEntry<T> | undefined;
    if (!cached || cached.expiresAt <= Date.now()) {
      return undefined;
    }
    return cached.value;
  }

  set<T>(key: string, value: T, ttlSeconds: number) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async getOrSet<T>(
    key: string,
    ttlSeconds: number | ((value: T) => number),
    loader: () => Promise<T>,
  ): Promise<{ value: T; cacheHit: boolean }> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return { value: cached, cacheHit: true };
    }

    const pending = this.inflight.get(key) as Promise<T> | undefined;
    if (pending) {
      return { value: await pending, cacheHit: true };
    }

    const load = loader()
      .then((value) => {
        const ttl =
          typeof ttlSeconds === 'function' ? ttlSeconds(value) : ttlSeconds;
        this.set(key, value, ttl);
        return value;
      })
      .finally(() => {
        this.inflight.delete(key);
      });

    this.inflight.set(key, load);
    return { value: await load, cacheHit: false };
  }
}
