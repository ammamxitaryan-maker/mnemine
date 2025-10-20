import { Request, Response } from 'express';
import { MemoryMonitoringService } from '../services/memoryMonitoringService.js';

export class MemoryMonitoringController {
  // GET /api/admin/memory-status - Get current memory status
  static async getMemoryStatus(req: Request, res: Response) {
    try {
      const memoryMonitor = MemoryMonitoringService.getInstance();
      const memoryReport = memoryMonitor.getMemoryReport();

      res.status(200).json({
        success: true,
        data: memoryReport
      });
    } catch (error) {
      console.error('Error fetching memory status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch memory status'
      });
    }
  }

  // POST /api/admin/memory-cleanup - Perform manual memory cleanup
  static async performMemoryCleanup(req: Request, res: Response) {
    try {
      const memoryMonitor = MemoryMonitoringService.getInstance();
      const cleanupResult = memoryMonitor.performMemoryCleanup();

      res.status(200).json({
        success: true,
        message: 'Memory cleanup completed',
        data: cleanupResult
      });
    } catch (error) {
      console.error('Error performing memory cleanup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform memory cleanup'
      });
    }
  }

  // POST /api/admin/memory-thresholds - Update memory thresholds
  static async updateMemoryThresholds(req: Request, res: Response) {
    try {
      const { warning, critical, maxHeap } = req.body;

      if (warning && critical && maxHeap) {
        const memoryMonitor = MemoryMonitoringService.getInstance();
        memoryMonitor.updateThresholds({ warning, critical, maxHeap });

        res.status(200).json({
          success: true,
          message: 'Memory thresholds updated successfully',
          data: { warning, critical, maxHeap }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Warning, critical, and maxHeap values are required'
        });
      }
    } catch (error) {
      console.error('Error updating memory thresholds:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update memory thresholds'
      });
    }
  }

  // GET /api/admin/memory-history - Get memory usage history
  static async getMemoryHistory(req: Request, res: Response) {
    try {
      const { limit = 100 } = req.query;
      const memoryMonitor = MemoryMonitoringService.getInstance();
      const history = memoryMonitor.getMemoryHistory();

      const limitedHistory = history.slice(-parseInt(limit as string));

      res.status(200).json({
        success: true,
        data: {
          history: limitedHistory,
          totalRecords: history.length,
          requestedLimit: parseInt(limit as string)
        }
      });
    } catch (error) {
      console.error('Error fetching memory history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch memory history'
      });
    }
  }

  // GET /api/admin/memory-trends - Get memory usage trends
  static async getMemoryTrends(req: Request, res: Response) {
    try {
      const memoryMonitor = MemoryMonitoringService.getInstance();
      const trends = memoryMonitor.getMemoryTrends();
      const currentStats = memoryMonitor.getMemoryStats();

      res.status(200).json({
        success: true,
        data: {
          current: currentStats,
          trends: trends,
          recommendations: MemoryMonitoringController.generateRecommendations(trends, currentStats)
        }
      });
    } catch (error) {
      console.error('Error fetching memory trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch memory trends'
      });
    }
  }

  // GET /api/admin/cache-memory-info - Get cache memory information
  static async getCacheMemoryInfo(req: Request, res: Response) {
    try {
      const memoryMonitor = MemoryMonitoringService.getInstance();
      const cacheInfo = memoryMonitor.getCacheMemoryInfo();

      res.status(200).json({
        success: true,
        data: {
          caches: cacheInfo,
          totalCacheMemory: cacheInfo.reduce((sum, cache) => sum + cache.memoryUsage, 0),
          recommendations: MemoryMonitoringController.generateCacheRecommendations(cacheInfo)
        }
      });
    } catch (error) {
      console.error('Error fetching cache memory info:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch cache memory information'
      });
    }
  }

  // POST /api/admin/force-gc - Force garbage collection
  static async forceGarbageCollection(req: Request, res: Response) {
    try {
      const beforeStats = process.memoryUsage();

      if (global.gc) {
        global.gc();
        const afterStats = process.memoryUsage();
        const memoryFreed = (beforeStats.heapUsed - afterStats.heapUsed) / 1024 / 1024;

        res.status(200).json({
          success: true,
          message: 'Garbage collection completed',
          data: {
            memoryFreed: Math.round(memoryFreed * 100) / 100, // MB
            before: {
              heapUsed: Math.round(beforeStats.heapUsed / 1024 / 1024 * 100) / 100,
              heapTotal: Math.round(beforeStats.heapTotal / 1024 / 1024 * 100) / 100
            },
            after: {
              heapUsed: Math.round(afterStats.heapUsed / 1024 / 1024 * 100) / 100,
              heapTotal: Math.round(afterStats.heapTotal / 1024 / 1024 * 100) / 100
            }
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'Garbage collection is not available. Start Node.js with --expose-gc flag.'
        });
      }
    } catch (error) {
      console.error('Error forcing garbage collection:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to force garbage collection'
      });
    }
  }

  // Helper method to generate recommendations based on trends
  private static generateRecommendations(trends: { trend: string; change: number }, currentStats: { heapUsed: number; heapTotal: number }): string[] {
    const recommendations: string[] = [];

    if (trends.trend === 'increasing' && trends.change > 10) {
      recommendations.push('Memory usage is increasing rapidly. Consider reducing cache sizes.');
      recommendations.push('Monitor for memory leaks in long-running processes.');
    }

    if (currentStats.heapUsed > 1024) {
      recommendations.push('High memory usage detected. Consider performing memory cleanup.');
      recommendations.push('Review cache configurations and reduce TTL values.');
    }

    if (trends.trend === 'stable' && currentStats.heapUsed < 256) {
      recommendations.push('Memory usage is stable and low. System is running efficiently.');
    }

    return recommendations;
  }

  // Helper method to generate cache recommendations
  private static generateCacheRecommendations(cacheInfo: { cacheName: string; size: number; memoryUsage: number; hitRate: number }[]): string[] {
    const recommendations: string[] = [];

    const totalCacheMemory = cacheInfo.reduce((sum, cache) => sum + cache.memoryUsage, 0);

    if (totalCacheMemory > 100) {
      recommendations.push('Total cache memory usage is high. Consider reducing cache sizes.');
    }

    const lowHitRateCaches = cacheInfo.filter(cache => cache.hitRate < 50);
    if (lowHitRateCaches.length > 0) {
      recommendations.push(`Caches with low hit rates detected: ${lowHitRateCaches.map(c => c.cacheName).join(', ')}`);
      recommendations.push('Consider adjusting cache TTL or reducing cache sizes for low-hit-rate caches.');
    }

    const largeCaches = cacheInfo.filter(cache => cache.memoryUsage > 50);
    if (largeCaches.length > 0) {
      recommendations.push(`Large caches detected: ${largeCaches.map(c => c.cacheName).join(', ')}`);
      recommendations.push('Consider implementing cache eviction policies for large caches.');
    }

    return recommendations;
  }
}
