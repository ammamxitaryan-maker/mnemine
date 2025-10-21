import { LRUCache } from 'lru-cache';
import { LogContext } from '../types/logging.js';
import { logger } from '../utils/logger.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
  metadata: {
    source: string;
    version: string;
    tags: string[];
  };
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  averageAge: number;
}

export class StatsCacheService {
  private static cache: LRUCache<string, CacheEntry<any>>;
  private static stats: CacheStats = {
    hits: 0,
    misses: 0,
    size: 0,
    hitRate: 0,
    averageAge: 0
  };

  static {
    this.cache = new LRUCache<string, CacheEntry<any>>({
      max: 1000,
      ttl: 5 * 60 * 1000, // 5 minutes default TTL
      updateAgeOnGet: true,
      allowStale: false,
      dispose: (value, key) => {
        logger.debug(LogContext.SERVER, `Cache entry disposed: ${key}`);
      }
    });
  }

  /**
   * Get data from cache
   */
  static get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (entry) {
      entry.hits++;
      this.stats.hits++;
      this.updateStats();

      logger.debug(LogContext.SERVER, `Cache hit: ${key}`, {
        hits: entry.hits,
        age: Date.now() - entry.timestamp
      });

      return entry.data;
    }

    this.stats.misses++;
    this.updateStats();

    logger.debug(LogContext.SERVER, `Cache miss: ${key}`);
    return null;
  }

  /**
   * Set data in cache
   */
  static set<T>(
    key: string,
    data: T,
    ttl?: number,
    metadata?: Partial<CacheEntry<T>['metadata']>
  ): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      hits: 0,
      metadata: {
        source: 'api',
        version: '1.0',
        tags: [],
        ...metadata
      }
    };

    this.cache.set(key, entry, { ttl });
    this.updateStats();

    logger.debug(LogContext.SERVER, `Cache set: ${key}`, {
      ttl: ttl || 'default',
      metadata: entry.metadata
    });
  }

  /**
   * Get or set pattern
   */
  static async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
    metadata?: Partial<CacheEntry<T>['metadata']>
  ): Promise<T> {
    const cached = this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    try {
      const data = await fetcher();
      this.set(key, data, ttl, metadata);
      return data;
    } catch (error) {
      logger.error(LogContext.SERVER, `Error fetching data for cache key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache entries by pattern
   */
  static invalidate(pattern: string): number {
    let invalidated = 0;

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        invalidated++;
      }
    }

    this.updateStats();

    logger.info(LogContext.SERVER, `Invalidated ${invalidated} cache entries matching pattern: ${pattern}`);
    return invalidated;
  }

  /**
   * Clear all cache
   */
  static clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      size: 0,
      hitRate: 0,
      averageAge: 0
    };

    logger.info(LogContext.SERVER, 'Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Get cache entry details
   */
  static getEntryDetails(key: string): CacheEntry<any> | null {
    return this.cache.get(key) || null;
  }

  /**
   * Update internal statistics
   */
  private static updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) * 100;

    // Calculate average age
    let totalAge = 0;
    let count = 0;

    for (const [_, entry] of this.cache.entries()) {
      totalAge += Date.now() - entry.timestamp;
      count++;
    }

    this.stats.averageAge = count > 0 ? totalAge / count : 0;
  }

  /**
   * Warm up cache with frequently accessed data
   */
  static async warmUp(): Promise<void> {
    logger.info(LogContext.SERVER, 'Starting cache warm-up...');

    try {
      // Pre-load common statistics
      const { UnifiedStatsService } = await import('./unifiedStatsService.js');

      await Promise.all([
        this.getOrSet(
          'user-stats',
          () => UnifiedStatsService.getUserStats(),
          5 * 60 * 1000, // 5 minutes
          { source: 'warm-up', tags: ['user-stats', 'frequent'] }
        ),
        this.getOrSet(
          'market-stats',
          () => Promise.resolve({ price: 0.001, volume: 1000000 }),
          1 * 60 * 1000, // 1 minute
          { source: 'warm-up', tags: ['market-stats', 'frequent'] }
        )
      ]);

      logger.info(LogContext.SERVER, 'Cache warm-up completed');
    } catch (error) {
      logger.error(LogContext.SERVER, 'Cache warm-up failed:', error);
    }
  }
}
