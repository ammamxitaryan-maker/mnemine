/**
 * Advanced Cache System - Comprehensive caching solution for improved performance
 * 
 * This module provides advanced caching capabilities while strictly preserving
 * all existing functionality. No features are modified or disabled.
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

// Default cache configuration
const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxSize: 1000,
  ttl: 5 * 60 * 1000, // 5 minutes
  updateAgeOnGet: true,
  allowStale: false,
  maxAge: 10 * 60 * 1000, // 10 minutes
};

/**
 * Advanced LRU Cache with statistics and metadata
 */
export class AdvancedLRUCache<T> {
  private cache: LRUCache<string, CacheEntry<T>>;
  private stats: CacheStats;
  private config: CacheConfig;

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
    });
  }

  /**
   * Get value from cache with statistics tracking
   */
  get(key: string): T | undefined {
    const startTime = performance.now();
    
    const entry = this.cache.get(key);
    
    if (entry) {
      this.stats.hits++;
      entry.hits++;
      entry.lastAccessed = Date.now();
      
      const accessTime = performance.now() - startTime;
      this.updateAverageAccessTime(accessTime);
      
      return entry.value;
    } else {
      this.stats.misses++;
      return undefined;
    }
  }

  /**
   * Set value in cache with metadata
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
    this.stats.sets++;
    this.stats.size = this.cache.size;
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.stats.size = this.cache.size;
    }
    return deleted;
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
    this.stats.size = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    this.stats.size = this.cache.size;
    
    return { ...this.stats };
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get cache entries with metadata
   */
  getEntries(): Array<{ key: string; entry: CacheEntry<T> }> {
    return Array.from(this.cache.entries()).map(([key, entry]) => ({ key, entry }));
  }

  /**
   * Update average access time
   */
  private updateAverageAccessTime(accessTime: number): void {
    const totalRequests = this.stats.hits + this.stats.misses;
    this.stats.averageAccessTime = 
      (this.stats.averageAccessTime * (totalRequests - 1) + accessTime) / totalRequests;
  }
}

/**
 * Multi-level cache system
 */
export class MultiLevelCache<T> {
  private l1Cache: AdvancedLRUCache<T>; // Memory cache
  private l2Cache: Map<string, CacheEntry<T>>; // Secondary memory cache
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.l1Cache = new AdvancedLRUCache<T>({
      ...this.config,
      maxSize: Math.floor(this.config.maxSize * 0.8), // 80% for L1
    });
    this.l2Cache = new Map();
  }

  /**
   * Get value from multi-level cache
   */
  get(key: string): T | undefined {
    // Try L1 cache first
    let value = this.l1Cache.get(key);
    if (value !== undefined) {
      return value;
    }

    // Try L2 cache
    const l2Entry = this.l2Cache.get(key);
    if (l2Entry && this.isEntryValid(l2Entry)) {
      // Promote to L1 cache
      this.l1Cache.set(key, l2Entry.value, l2Entry.metadata);
      return l2Entry.value;
    }

    return undefined;
  }

  /**
   * Set value in multi-level cache
   */
  set(key: string, value: T, metadata?: Record<string, any>): void {
    // Set in L1 cache
    this.l1Cache.set(key, value, metadata);
    
    // Set in L2 cache
    const entry: CacheEntry<T> = {
      value,
      timestamp: Date.now(),
      hits: 0,
      lastAccessed: Date.now(),
      metadata,
    };
    this.l2Cache.set(key, entry);
  }

  /**
   * Delete value from multi-level cache
   */
  delete(key: string): boolean {
    const l1Deleted = this.l1Cache.delete(key);
    const l2Deleted = this.l2Cache.delete(key);
    return l1Deleted || l2Deleted;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    return this.l1Cache.has(key) || this.l2Cache.has(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
  }

  /**
   * Get combined statistics
   */
  getStats(): CacheStats {
    const l1Stats = this.l1Cache.getStats();
    return {
      ...l1Stats,
      size: l1Stats.size + this.l2Cache.size,
    };
  }

  /**
   * Check if cache entry is valid
   */
  private isEntryValid(entry: CacheEntry<T>): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < this.config.maxAge;
  }
}

/**
 * Cache manager for different data types
 */
export class CacheManager {
  private caches: Map<string, AdvancedLRUCache<any>>;
  private multiLevelCaches: Map<string, MultiLevelCache<any>>;

  constructor() {
    this.caches = new Map();
    this.multiLevelCaches = new Map();
  }

  /**
   * Get or create a cache instance
   */
  getCache<T>(name: string, config?: Partial<CacheConfig>): AdvancedLRUCache<T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new AdvancedLRUCache<T>(config));
    }
    return this.caches.get(name)!;
  }

  /**
   * Get or create a multi-level cache instance
   */
  getMultiLevelCache<T>(name: string, config?: Partial<CacheConfig>): MultiLevelCache<T> {
    if (!this.multiLevelCaches.has(name)) {
      this.multiLevelCaches.set(name, new MultiLevelCache<T>(config));
    }
    return this.multiLevelCaches.get(name)!;
  }

  /**
   * Clear all caches
   */
  clearAll(): void {
    this.caches.forEach(cache => cache.clear());
    this.multiLevelCaches.forEach(cache => cache.clear());
  }

  /**
   * Get statistics for all caches
   */
  getAllStats(): Record<string, CacheStats> {
    const stats: Record<string, CacheStats> = {};
    
    this.caches.forEach((cache, name) => {
      stats[name] = cache.getStats();
    });
    
    this.multiLevelCaches.forEach((cache, name) => {
      stats[`${name}_multilevel`] = cache.getStats();
    });
    
    return stats;
  }

  /**
   * Get total memory usage estimate
   */
  getMemoryUsage(): number {
    let totalSize = 0;
    
    this.caches.forEach(cache => {
      totalSize += cache.size();
    });
    
    this.multiLevelCaches.forEach(cache => {
      totalSize += cache.getStats().size;
    });
    
    return totalSize;
  }
}

/**
 * Cache decorator for functions
 */
export function cached<T extends (...args: any[]) => any>(
  cache: AdvancedLRUCache<ReturnType<T>>,
  keyGenerator?: (...args: Parameters<T>) => string
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = function (...args: Parameters<T>) {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      let result = cache.get(key);
      if (result === undefined) {
        result = method.apply(this, args);
        if (result !== undefined) {
          cache.set(key, result);
        }
      }
      
      return result;
    };

    return descriptor;
  };
}

/**
 * Cache middleware for Express routes
 */
export function cacheMiddleware<T>(
  cache: AdvancedLRUCache<T>,
  keyGenerator?: (req: any) => string,
  ttl?: number
) {
  return (req: any, res: any, next: any) => {
    const key = keyGenerator ? keyGenerator(req) : `${req.method}:${req.originalUrl}`;
    
    const cachedResponse = cache.get(key);
    if (cachedResponse !== undefined) {
      res.json(cachedResponse);
      return;
    }

    const originalSend = res.send;
    res.send = function (data: any) {
      cache.set(key, data);
      originalSend.call(this, data);
    };

    next();
  };
}

// Global cache manager instance
export const globalCacheManager = new CacheManager();

// Predefined cache instances for common use cases
export const userDataCache = globalCacheManager.getCache<any>('userData', {
  maxSize: 500,
  ttl: 2 * 60 * 1000, // 2 minutes
});

export const apiResponseCache = globalCacheManager.getCache<any>('apiResponse', {
  maxSize: 1000,
  ttl: 1 * 60 * 1000, // 1 minute
});

export const staticDataCache = globalCacheManager.getMultiLevelCache<any>('staticData', {
  maxSize: 2000,
  ttl: 10 * 60 * 1000, // 10 minutes
});

// Export all utilities
export {
  DEFAULT_CACHE_CONFIG,
  type CacheConfig,
  type CacheEntry,
  type CacheStats,
};
