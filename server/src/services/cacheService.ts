/**
 * Unified Cache Service - Comprehensive caching solution for improved performance
 * 
 * This module consolidates all caching functionality into a single, efficient service
 * while preserving all existing functionality.
 */

import { LRUCache } from 'lru-cache';
import { performance } from 'perf_hooks';

// Cache configuration interface
interface CacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
  updateAgeOnGet: boolean;
  allowStale: boolean;
  maxAge: number;
}

// Cache entry interface
interface CacheEntry<T> {
  value: T;
  timestamp: number;
  hits: number;
  lastAccessed: number;
  metadata?: Record<string, any>;
}

// Cache statistics interface
interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  size: number;
  hitRate: number;
  averageAccessTime: number;
}

// Query optimization configuration
interface QueryOptimizationConfig {
  enableQueryCaching: boolean;
  enableBatchProcessing: boolean;
  enableConnectionPooling: boolean;
  enableQueryLogging: boolean;
  maxBatchSize: number;
  cacheTimeout: number;
}

// Default configurations
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
  updateAgeOnGet: true,
  allowStale: false,
  maxAge: 10 * 60 * 1000, // 10 minutes
};

const DEFAULT_QUERY_CONFIG: QueryOptimizationConfig = {
  enableQueryCaching: true,
  enableBatchProcessing: true,
  enableConnectionPooling: true,
  enableQueryLogging: true,
  maxBatchSize: 100,
  cacheTimeout: 300000, // 5 minutes
};

/**
 * Advanced LRU Cache with statistics and metadata
 */
export class AdvancedLRUCache<T = any> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private config: CacheConfig;
  private stats: CacheStats;
  private accessTimes: number[] = [];

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0,
      averageAccessTime: 0,
    };

    this.cache = new LRUCache<string, CacheEntry<T>>({
      max: this.config.maxSize,
      ttl: this.config.ttl,
      updateAgeOnGet: this.config.updateAgeOnGet,
      allowStale: this.config.allowStale,
      maxAge: this.config.maxAge,
    });

    // Set up event listeners for statistics
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.cache.on('set', () => {
      this.stats.sets++;
      this.stats.size = this.cache.size;
    });

    this.cache.on('delete', () => {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    });
  }

  /**
   * Get value from cache
   */
  get(key: string): T | undefined {
    const startTime = performance.now();
    
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.hits++;
      entry.lastAccessed = Date.now();
      this.stats.hits++;
      
      const accessTime = performance.now() - startTime;
      this.accessTimes.push(accessTime);
      this.updateAverageAccessTime();
      
      return entry.value;
    }
    
    this.stats.misses++;
    this.updateHitRate();
    
    return undefined;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, metadata?: Record<string, any>): void {
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now(),
      metadata,
    };

    this.cache.set(key, entry);
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      size: 0,
      hitRate: 0,
      averageAccessTime: 0,
    };
    this.accessTimes = [];
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
  }

  private updateAverageAccessTime(): void {
    if (this.accessTimes.length > 100) {
      this.accessTimes = this.accessTimes.slice(-50); // Keep only last 50 measurements
    }
    
    const sum = this.accessTimes.reduce((acc, time) => acc + time, 0);
    this.stats.averageAccessTime = sum / this.accessTimes.length;
  }
}

/**
 * Multi-layer cache system with memory and Redis simulation
 */
export class MultiLayerCache {
  private memoryCache: AdvancedLRUCache<any>;
  private redisCache: Map<string, any>; // In-memory Redis simulation
  private cacheStats: Map<string, { hits: number; misses: number; sets: number }>;

  constructor() {
    this.memoryCache = new AdvancedLRUCache({
      maxSize: 1000,
      ttl: 30000, // 30 seconds default TTL
    });

    this.redisCache = new Map();
    this.cacheStats = new Map();
  }

  /**
   * Get value from cache with fallback strategy
   */
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
        this.memoryCache.set(key, value);
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

  /**
   * Set value in cache
   */
  set(key: string, value: any, ttl?: number): void {
    this.memoryCache.set(key, value);
    this.redisCache.set(key, value);
    this.recordCacheSet(key);
  }

  /**
   * Delete from cache
   */
  delete(key: string): void {
    this.memoryCache.delete(key);
    this.redisCache.delete(key);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.memoryCache.clear();
    this.redisCache.clear();
    this.cacheStats.clear();
  }

  /**
   * Record cache statistics
   */
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

  /**
   * Get cache statistics
   */
  getStats() {
    const totalHits = Array.from(this.cacheStats.values()).reduce((sum, stats) => sum + stats.hits, 0);
    const totalMisses = Array.from(this.cacheStats.values()).reduce((sum, stats) => sum + stats.misses, 0);
    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0;

    return {
      memoryCacheSize: this.memoryCache.size(),
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

/**
 * Specialized caches for different data types
 */
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

/**
 * Cache warming strategies
 */
export class CacheWarmer {
  private userDataCache: UserDataCache;
  private slotsDataCache: SlotsDataCache;
  private marketDataCache: MarketDataCache;

  constructor() {
    this.userDataCache = new UserDataCache();
    this.slotsDataCache = new SlotsDataCache();
    this.marketDataCache = new MarketDataCache();
  }

  /**
   * Warm up caches for active users
   */
  async warmUpActiveUsers(activeUserIds: string[]) {
    console.log(`[CACHE] Warming up caches for ${activeUserIds.length} active users`);
    
    const startTime = performance.now();
    
    // Warm up user data cache
    const userDataPromises = activeUserIds.map(async (telegramId) => {
      try {
        await this.userDataCache.getUserData(telegramId, async () => {
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

  /**
   * Warm up market data cache
   */
  async warmUpMarketData() {
    console.log('[CACHE] Warming up market data cache');
    
    try {
      await this.marketDataCache.getMarketData(async () => {
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

/**
 * Database query optimization service
 */
export class DatabaseOptimizer {
  private queryCache: AdvancedLRUCache<any>;
  private config: QueryOptimizationConfig;
  private queryMetrics: Array<{ query: string; duration: number; timestamp: number }> = [];

  constructor(config: Partial<QueryOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_QUERY_CONFIG, ...config };
    this.queryCache = new AdvancedLRUCache({
      maxSize: 500,
      ttl: this.config.cacheTimeout,
    });
  }

  /**
   * Execute optimized query with caching
   */
  async executeQuery<T>(
    queryKey: string,
    queryFn: () => Promise<T>,
    useCache: boolean = true
  ): Promise<T> {
    const startTime = performance.now();

    try {
      // Try cache first if enabled
      if (useCache && this.config.enableQueryCaching) {
        const cached = this.queryCache.get(queryKey);
        if (cached) {
          return cached;
        }
      }

      // Execute query
      const result = await queryFn();

      // Cache result if enabled
      if (useCache && this.config.enableQueryCaching) {
        this.queryCache.set(queryKey, result);
      }

      // Record metrics
      const duration = performance.now() - startTime;
      this.recordQueryMetrics(queryKey, duration);

      return result;
    } catch (error) {
      console.error(`[DB_OPTIMIZER] Query failed: ${queryKey}`, error);
      throw error;
    }
  }

  /**
   * Batch process multiple queries
   */
  async batchProcess<T>(
    queries: Array<{ key: string; queryFn: () => Promise<T> }>
  ): Promise<T[]> {
    if (!this.config.enableBatchProcessing) {
      // Process sequentially if batch processing is disabled
      const results: T[] = [];
      for (const { queryFn } of queries) {
        results.push(await queryFn());
      }
      return results;
    }

    // Process in batches
    const results: T[] = [];
    const batchSize = this.config.maxBatchSize;

    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchPromises = batch.map(({ key, queryFn }) => 
        this.executeQuery(key, queryFn)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : null
      ).filter(Boolean) as T[]);
    }

    return results;
  }

  /**
   * Record query performance metrics
   */
  private recordQueryMetrics(query: string, duration: number): void {
    if (this.config.enableQueryLogging) {
      this.queryMetrics.push({
        query,
        duration,
        timestamp: Date.now()
      });

      // Keep only last 1000 metrics
      if (this.queryMetrics.length > 1000) {
        this.queryMetrics = this.queryMetrics.slice(-500);
      }

      // Log slow queries
      if (duration > 100) {
        console.log(`[DB_OPTIMIZER] Slow query detected: ${query} took ${duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats() {
    const totalQueries = this.queryMetrics.length;
    const avgDuration = totalQueries > 0 
      ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;

    const slowQueries = this.queryMetrics.filter(m => m.duration > 100).length;

    return {
      totalQueries,
      averageDuration: avgDuration.toFixed(2) + 'ms',
      slowQueries,
      cacheStats: this.queryCache.getStats(),
    };
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }
}

// Global cache instances
export const userDataCache = new UserDataCache();
export const slotsDataCache = new SlotsDataCache();
export const marketDataCache = new MarketDataCache();
export const cacheWarmer = new CacheWarmer();
export const databaseOptimizer = new DatabaseOptimizer();

// Export unified cache service
export const CacheService = {
  userData: userDataCache,
  slotsData: slotsDataCache,
  marketData: marketDataCache,
  warmer: cacheWarmer,
  database: databaseOptimizer,
  
  // Utility methods
  clearAll: () => {
    userDataCache.clear();
    slotsDataCache.clear();
    marketDataCache.clear();
    databaseOptimizer.clearCache();
  },
  
  getStats: () => ({
    userData: userDataCache.getStats(),
    slotsData: slotsDataCache.getStats(),
    marketData: marketDataCache.getStats(),
    database: databaseOptimizer.getQueryStats(),
  }),
};
