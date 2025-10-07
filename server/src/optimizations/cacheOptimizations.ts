import { LRUCache } from 'lru-cache';

// Enhanced caching system with multiple cache layers
export class MultiLayerCache {
  private memoryCache: LRUCache<string, any>;
  private redisCache: Map<string, any>; // In-memory Redis simulation
  private cacheStats: Map<string, { hits: number; misses: number; sets: number }>;

  constructor() {
    this.memoryCache = new LRUCache({
      max: 1000, // Maximum number of items
      ttl: 30000, // 30 seconds default TTL
      updateAgeOnGet: true,
      updateAgeOnHas: true
    });

    this.redisCache = new Map();
    this.cacheStats = new Map();
  }

  // Get value from cache with fallback strategy
  async get<T>(key: string, fallback?: () => Promise<T>, ttl?: number): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Try memory cache first
      let value = this.memoryCache.get(key);
      
      if (value) {
        this.recordCacheHit('memory', key);
        return value;
      }

      // Try Redis cache
      value = this.redisCache.get(key);
      if (value) {
        this.recordCacheHit('redis', key);
        // Promote to memory cache
        this.memoryCache.set(key, value, { ttl: ttl || 30000 });
        return value;
      }

      // Cache miss - try fallback
      if (fallback) {
        this.recordCacheMiss(key);
        const result = await fallback();
        if (result !== null) {
          this.set(key, result, ttl);
        }
        return result;
      }

      this.recordCacheMiss(key);
      return null;
    } finally {
      const duration = performance.now() - startTime;
      if (duration > 10) {
        console.log(`[CACHE] Slow cache operation: ${key} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  // Set value in cache
  set(key: string, value: any, ttl?: number): void {
    this.memoryCache.set(key, value, { ttl: ttl || 30000 });
    this.redisCache.set(key, value);
    this.recordCacheSet(key);
  }

  // Delete from cache
  delete(key: string): void {
    this.memoryCache.delete(key);
    this.redisCache.delete(key);
  }

  // Clear all caches
  clear(): void {
    this.memoryCache.clear();
    this.redisCache.clear();
    this.cacheStats.clear();
  }

  // Record cache statistics
  private recordCacheHit(type: string, key: string): void {
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, sets: 0 };
    stats.hits++;
    this.cacheStats.set(key, stats);
  }

  private recordCacheMiss(key: string): void {
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, sets: 0 };
    stats.misses++;
    this.cacheStats.set(key, stats);
  }

  private recordCacheSet(key: string): void {
    const stats = this.cacheStats.get(key) || { hits: 0, misses: 0, sets: 0 };
    stats.sets++;
    this.cacheStats.set(key, stats);
  }

  // Get cache statistics
  getStats() {
    const totalHits = Array.from(this.cacheStats.values()).reduce((sum, stats) => sum + stats.hits, 0);
    const totalMisses = Array.from(this.cacheStats.values()).reduce((sum, stats) => sum + stats.misses, 0);
    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;

    return {
      memoryCacheSize: this.memoryCache.size,
      redisCacheSize: this.redisCache.size,
      totalHits,
      totalMisses,
      hitRate: hitRate.toFixed(2) + '%',
      topKeys: Array.from(this.cacheStats.entries())
        .sort((a, b) => (b[1].hits + b[1].misses) - (a[1].hits + a[1].misses))
        .slice(0, 10)
        .map(([key, stats]) => ({ key, ...stats }))
    };
  }
}

// Specialized caches for different data types
export class UserDataCache {
  private cache: MultiLayerCache;
  private readonly TTL = 30000; // 30 seconds

  constructor() {
    this.cache = new MultiLayerCache();
  }

  async getUserData(telegramId: string, fallback: () => Promise<any>) {
    const key = `user_data_${telegramId}`;
    return this.cache.get(key, fallback, this.TTL);
  }

  setUserData(telegramId: string, data: any) {
    const key = `user_data_${telegramId}`;
    this.cache.set(key, data, this.TTL);
  }

  invalidateUserData(telegramId: string) {
    const key = `user_data_${telegramId}`;
    this.cache.delete(key);
  }

  getStats() {
    return this.cache.getStats();
  }

  clear() {
    this.cache.clear();
  }
}

export class SlotsDataCache {
  private cache: MultiLayerCache;
  private readonly TTL = 15000; // 15 seconds

  constructor() {
    this.cache = new MultiLayerCache();
  }

  async getSlotsData(telegramId: string, fallback: () => Promise<any>) {
    const key = `slots_data_${telegramId}`;
    return this.cache.get(key, fallback, this.TTL);
  }

  setSlotsData(telegramId: string, data: any) {
    const key = `slots_data_${telegramId}`;
    this.cache.set(key, data, this.TTL);
  }

  invalidateSlotsData(telegramId: string) {
    const key = `slots_data_${telegramId}`;
    this.cache.delete(key);
  }

  getStats() {
    return this.cache.getStats();
  }

  clear() {
    this.cache.clear();
  }
}

export class MarketDataCache {
  private cache: MultiLayerCache;
  private readonly TTL = 60000; // 1 minute

  constructor() {
    this.cache = new MultiLayerCache();
  }

  async getMarketData(fallback: () => Promise<any>) {
    const key = 'market_data';
    return this.cache.get(key, fallback, this.TTL);
  }

  setMarketData(data: any) {
    const key = 'market_data';
    this.cache.set(key, data, this.TTL);
  }

  invalidateMarketData() {
    const key = 'market_data';
    this.cache.delete(key);
  }

  getStats() {
    return this.cache.getStats();
  }

  clear() {
    this.cache.clear();
  }
}

// Cache warming strategies
export class CacheWarmer {
  private userDataCache: UserDataCache;
  private slotsDataCache: SlotsDataCache;
  private marketDataCache: MarketDataCache;

  constructor() {
    this.userDataCache = new UserDataCache();
    this.slotsDataCache = new SlotsDataCache();
    this.marketDataCache = new MarketDataCache();
  }

  // Warm up caches for active users
  async warmUpActiveUsers(activeUserIds: string[]) {
    console.log(`[CACHE] Warming up caches for ${activeUserIds.length} active users`);
    
    const startTime = performance.now();
    
    // Warm up user data cache
    const userDataPromises = activeUserIds.map(async (telegramId) => {
      try {
        // This would trigger the fallback and cache the result
        await this.userDataCache.getUserData(telegramId, async () => {
          // Simulate user data fetch
          return { telegramId, cached: true, timestamp: Date.now() };
        });
      } catch (error) {
        console.error(`[CACHE] Failed to warm up user data for ${telegramId}:`, error);
      }
    });

    await Promise.allSettled(userDataPromises);
    
    const totalTime = performance.now() - startTime;
    console.log(`[CACHE] Cache warming completed in ${totalTime.toFixed(2)}ms`);
  }

  // Warm up market data cache
  async warmUpMarketData() {
    console.log('[CACHE] Warming up market data cache');
    
    try {
      await this.marketDataCache.getMarketData(async () => {
        // Simulate market data fetch
        return {
          totalUsers: 1250,
          totalVolume: 50000,
          cached: true,
          timestamp: Date.now()
        };
      });
    } catch (error) {
      console.error('[CACHE] Failed to warm up market data:', error);
    }
  }
}

// Global cache instances
export const userDataCache = new UserDataCache();
export const slotsDataCache = new SlotsDataCache();
export const marketDataCache = new MarketDataCache();
export const cacheWarmer = new CacheWarmer();
