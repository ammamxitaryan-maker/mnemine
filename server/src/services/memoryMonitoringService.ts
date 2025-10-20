// import { performance } from 'perf_hooks'; // Unused import removed
import { LRUCache } from 'lru-cache';

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
  arrayBuffers: number;
  timestamp: Date;
}

interface CacheMemoryInfo {
  cacheName: string;
  size: number;
  maxSize: number;
  memoryUsage: number;
  hitRate: number;
  lastCleanup: Date;
}

interface MemoryThresholds {
  warning: number; // MB
  critical: number; // MB
  maxHeap: number; // MB
}

export class MemoryMonitoringService {
  private static instance: MemoryMonitoringService;
  private memoryHistory: MemoryStats[] = [];
  private cacheInstances: Map<string, { cache: LRUCache<any, any>; name: string }> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private readonly MAX_HISTORY = 1000;
  private readonly CLEANUP_INTERVAL = 60000; // 1 minute
  private readonly MONITORING_INTERVAL = 30000; // 30 seconds

  private thresholds: MemoryThresholds = {
    warning: 512, // 512 MB
    critical: 1024, // 1 GB
    maxHeap: 2048, // 2 GB
  };

  private constructor() {
    this.startMonitoring();
    this.startAutomaticCleanup();
  }

  public static getInstance(): MemoryMonitoringService {
    if (!MemoryMonitoringService.instance) {
      MemoryMonitoringService.instance = new MemoryMonitoringService();
    }
    return MemoryMonitoringService.instance;
  }

  /**
   * Register a cache instance for monitoring
   */
  public registerCache(name: string, cache: LRUCache<any, any>): void {
    this.cacheInstances.set(name, { cache, name });
    console.log(`[MEMORY] Registered cache: ${name}`);
  }

  /**
   * Unregister a cache instance
   */
  public unregisterCache(name: string): void {
    this.cacheInstances.delete(name);
    console.log(`[MEMORY] Unregistered cache: ${name}`);
  }

  /**
   * Get current memory statistics
   */
  public getMemoryStats(): MemoryStats {
    const memUsage = process.memoryUsage();
    const stats: MemoryStats = {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100, // MB
      external: Math.round(memUsage.external / 1024 / 1024 * 100) / 100, // MB
      rss: Math.round(memUsage.rss / 1024 / 1024 * 100) / 100, // MB
      arrayBuffers: Math.round(memUsage.arrayBuffers / 1024 / 1024 * 100) / 100, // MB
      timestamp: new Date(),
    };

    this.memoryHistory.push(stats);
    if (this.memoryHistory.length > this.MAX_HISTORY) {
      this.memoryHistory = this.memoryHistory.slice(-this.MAX_HISTORY);
    }

    return stats;
  }

  /**
   * Get cache memory information
   */
  public getCacheMemoryInfo(): CacheMemoryInfo[] {
    const cacheInfo: CacheMemoryInfo[] = [];

    for (const [name, { cache }] of this.cacheInstances) {
      const stats = (cache as any).stats || { hits: 0, misses: 0 };
      const hitRate = stats.hits + stats.misses > 0 ? stats.hits / (stats.hits + stats.misses) : 0;
      
      cacheInfo.push({
        cacheName: name,
        size: cache.size,
        maxSize: cache.max || 0,
        memoryUsage: this.estimateCacheMemoryUsage(cache),
        hitRate: Math.round(hitRate * 10000) / 100, // Percentage
        lastCleanup: new Date(), // This would be tracked per cache
      });
    }

    return cacheInfo;
  }

  /**
   * Estimate memory usage of a cache
   */
  private estimateCacheMemoryUsage(cache: LRUCache<any, any>): number {
    // Rough estimation: each entry ~1KB + key size
    const avgEntrySize = 1024; // bytes
    const keySize = 50; // bytes average
    const totalSize = (avgEntrySize + keySize) * cache.size;
    return Math.round(totalSize / 1024 / 1024 * 100) / 100; // MB
  }

  /**
   * Check if memory usage is above thresholds
   */
  public checkMemoryThresholds(): { level: 'normal' | 'warning' | 'critical'; stats: MemoryStats } {
    const stats = this.getMemoryStats();
    
    if (stats.heapUsed >= this.thresholds.critical) {
      return { level: 'critical', stats };
    } else if (stats.heapUsed >= this.thresholds.warning) {
      return { level: 'warning', stats };
    }
    
    return { level: 'normal', stats };
  }

  /**
   * Perform aggressive memory cleanup
   */
  public performMemoryCleanup(): { cleaned: number; freed: number } {
    const beforeStats = this.getMemoryStats();
    let cleanedCaches = 0;
    let totalFreed = 0;

    console.log(`[MEMORY] Starting memory cleanup. Current heap: ${beforeStats.heapUsed}MB`);

    // Clean up caches based on hit rate and age
    for (const [name, { cache }] of this.cacheInstances) {
      const stats = (cache as any).stats || { hits: 0, misses: 0 };
      const hitRate = stats.hits + stats.misses > 0 ? stats.hits / (stats.hits + stats.misses) : 0;
      
      // Clean caches with low hit rate or large size
      if (hitRate < 0.3 || cache.size > (cache.max || 1000) * 0.8) {
        const beforeSize = cache.size;
        cache.clear();
        const afterSize = cache.size;
        const freed = beforeSize - afterSize;
        
        if (freed > 0) {
          cleanedCaches++;
          totalFreed += freed;
          console.log(`[MEMORY] Cleaned cache ${name}: freed ${freed} entries`);
        }
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log(`[MEMORY] Forced garbage collection`);
    }

    const afterStats = this.getMemoryStats();
    const memoryFreed = beforeStats.heapUsed - afterStats.heapUsed;

    console.log(`[MEMORY] Cleanup completed. Cleaned ${cleanedCaches} caches, freed ${totalFreed} entries, ${memoryFreed}MB memory`);

    return { cleaned: cleanedCaches, freed: memoryFreed };
  }

  /**
   * Perform selective cache cleanup based on memory pressure
   */
  public performSelectiveCleanup(): void {
    const memoryCheck = this.checkMemoryThresholds();
    
    if (memoryCheck.level === 'normal') {
      return;
    }

    console.log(`[MEMORY] Memory pressure detected: ${memoryCheck.level} (${memoryCheck.stats.heapUsed}MB)`);

    // Clean up caches based on memory pressure level
    const cleanupRatio = memoryCheck.level === 'critical' ? 0.5 : 0.3;

    for (const [name, { cache }] of this.cacheInstances) {
      const targetSize = Math.floor(cache.size * (1 - cleanupRatio));
      
      if (cache.size > targetSize) {
        // Remove oldest entries
        const entriesToRemove = cache.size - targetSize;
        const keys = Array.from(cache.keys()).slice(0, entriesToRemove);
        
        for (const key of keys) {
          cache.delete(key);
        }
        
        console.log(`[MEMORY] Selective cleanup for ${name}: removed ${entriesToRemove} entries`);
      }
    }
  }

  /**
   * Start automatic memory monitoring
   */
  private startMonitoring(): void {
    this.monitoringInterval = setInterval(() => {
      const memoryCheck = this.checkMemoryThresholds();
      
      if (memoryCheck.level !== 'normal') {
        console.warn(`[MEMORY] ${memoryCheck.level.toUpperCase()} memory usage: ${memoryCheck.stats.heapUsed}MB`);
        
        // Perform selective cleanup on warning, aggressive cleanup on critical
        if (memoryCheck.level === 'critical') {
          this.performMemoryCleanup();
        } else {
          this.performSelectiveCleanup();
        }
      }
    }, this.MONITORING_INTERVAL);

    console.log(`[MEMORY] Started memory monitoring (interval: ${this.MONITORING_INTERVAL}ms)`);
  }

  /**
   * Start automatic cleanup
   */
  private startAutomaticCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performSelectiveCleanup();
    }, this.CLEANUP_INTERVAL);

    console.log(`[MEMORY] Started automatic cleanup (interval: ${this.CLEANUP_INTERVAL}ms)`);
  }

  /**
   * Stop monitoring and cleanup
   */
  public stop(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    console.log(`[MEMORY] Stopped memory monitoring and cleanup`);
  }

  /**
   * Get memory history for analysis
   */
  public getMemoryHistory(): MemoryStats[] {
    return [...this.memoryHistory];
  }

  /**
   * Get memory trends
   */
  public getMemoryTrends(): { trend: 'increasing' | 'decreasing' | 'stable'; change: number } {
    if (this.memoryHistory.length < 2) {
      return { trend: 'stable', change: 0 };
    }

    const recent = this.memoryHistory.slice(-10);
    const older = this.memoryHistory.slice(-20, -10);
    
    const recentAvg = recent.reduce((sum, stat) => sum + stat.heapUsed, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, stat) => sum + stat.heapUsed, 0) / older.length : recentAvg;
    
    const change = recentAvg - olderAvg;
    const changePercent = (change / olderAvg) * 100;

    if (changePercent > 5) {
      return { trend: 'increasing', change: changePercent };
    } else if (changePercent < -5) {
      return { trend: 'decreasing', change: changePercent };
    }
    
    return { trend: 'stable', change: changePercent };
  }

  /**
   * Update memory thresholds
   */
  public updateThresholds(thresholds: Partial<MemoryThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };
    console.log(`[MEMORY] Updated thresholds:`, this.thresholds);
  }

  /**
   * Get comprehensive memory report
   */
  public getMemoryReport(): {
    current: MemoryStats;
    thresholds: MemoryThresholds;
    caches: CacheMemoryInfo[];
    trends: { trend: 'increasing' | 'decreasing' | 'stable'; change: number };
    history: MemoryStats[];
  } {
    return {
      current: this.getMemoryStats(),
      thresholds: this.thresholds,
      caches: this.getCacheMemoryInfo(),
      trends: this.getMemoryTrends(),
      history: this.getMemoryHistory(),
    };
  }
}
