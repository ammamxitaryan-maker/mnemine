import { useCallback, useEffect, useState } from 'react';

// Cache management utilities
export const useCacheManager = () => {
  // Clear all cached data
  const clearAllCache = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('mnemine_'));
    keys.forEach(key => localStorage.removeItem(key));
    console.log('All cache cleared');
  }, []);

  // Clear expired cache entries
  const clearExpiredCache = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('mnemine_'));
    const now = Date.now();
    const CACHE_EXPIRY = 10 * 60 * 1000; // 10 minutes

    keys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const item = JSON.parse(cached);
          if (now - item.timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
            console.log(`Expired cache cleared: ${key}`);
          }
        }
      } catch (error) {
        // Remove corrupted cache entries
        localStorage.removeItem(key);
        console.warn(`Corrupted cache removed: ${key}`);
      }
    });
  }, []);

  // Get cache statistics
  const getCacheStats = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('mnemine_'));
    const stats = {
      totalEntries: keys.length,
      totalSize: 0,
      entries: [] as Array<{ key: string; size: number; age: number }>
    };

    const now = Date.now();
    keys.forEach(key => {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const item = JSON.parse(cached);
          const size = new Blob([cached]).size;
          const age = now - item.timestamp;
          
          stats.totalSize += size;
          stats.entries.push({ key, size, age });
        }
      } catch (error) {
        // Skip corrupted entries
      }
    });

    return stats;
  }, []);

  // Auto-cleanup expired cache on mount
  useEffect(() => {
    clearExpiredCache();
    
    // Set up periodic cleanup every 5 minutes
    const cleanupInterval = setInterval(clearExpiredCache, 5 * 60 * 1000);
    
    return () => clearInterval(cleanupInterval);
  }, [clearExpiredCache]);

  return {
    clearAllCache,
    clearExpiredCache,
    getCacheStats,
  };
};

// Hook for cache performance monitoring
export const useCachePerformance = () => {
  const [cacheHits, setCacheHits] = useState(0);
  const [cacheMisses, setCacheMisses] = useState(0);
  const [lastCacheTime, setLastCacheTime] = useState<number | null>(null);

  const recordCacheHit = useCallback(() => {
    setCacheHits(prev => prev + 1);
    setLastCacheTime(Date.now());
  }, []);

  const recordCacheMiss = useCallback(() => {
    setCacheMisses(prev => prev + 1);
  }, []);

  const getCacheHitRate = useCallback(() => {
    const total = cacheHits + cacheMisses;
    return total > 0 ? (cacheHits / total) * 100 : 0;
  }, [cacheHits, cacheMisses]);

  const resetStats = useCallback(() => {
    setCacheHits(0);
    setCacheMisses(0);
    setLastCacheTime(null);
  }, []);

  return {
    cacheHits,
    cacheMisses,
    lastCacheTime,
    cacheHitRate: getCacheHitRate(),
    recordCacheHit,
    recordCacheMiss,
    resetStats,
  };
};
