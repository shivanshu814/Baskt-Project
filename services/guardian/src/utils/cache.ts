export class GuardianCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  constructor(options: { ttl: number; maxSize: number }) {
    this.ttl = options.ttl;
    this.maxSize = options.maxSize;
  }

  get<T>(key: string): T | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      this.misses++;
      return undefined;
    }

    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    this.hits++;
    return item.data as T;
  }

  set<T>(key: string, data: T): void {
    // Evict oldest items if at max size
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
    };
  }
}
