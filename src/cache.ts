type ttlType = Temporal.Duration | Temporal.DurationLike | string | number;

function ttlToNum(ttl: ttlType) {
  if (typeof ttl == "number") return ttl;
  return Temporal.Duration.from(ttl).total({
    unit: "milliseconds",
  });
}

export function cacheFn<T>(fn: () => T, ttl: ttlType): () => T {
  const cache = new CacheVar<T>(ttl);
  return () => {
    const cached = cache.get();
    if (cached) return cached;
    const value = fn();
    cache.set(value, ttl);
    return value;
  };
}

export default class CacheVar<T> {
  value: T | undefined;
  ttl: number;
  expiration = -1;

  constructor(ttl: ttlType, value?: T) {
    this.ttl = ttlToNum(ttl);
    if (value) this.value = value;
  }

  has(): boolean {
    return this.expiration > performance.now();
  }

  get(): T | undefined {
    if (!this.has()) return undefined;
    return this.value;
  }

  getVal(): T | undefined {
    return this.value;
  }

  set(value: T, ttl?: ttlType): this {
    this.value = value;
    this.expiration = performance.now() + ttlToNum(ttl || this.ttl);
    return this;
  }

  delete(): this {
    this.expiration = -1;
    return this;
  }

  clear(): this {
    return this.delete();
  }
}
