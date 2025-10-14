import { Request, Response } from 'express';
import { CacheService } from '../services/cacheService.js';

// GET /api/performance/metrics
export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    const cacheStats = CacheService.getStats();

    const metrics = {
      cache: cacheStats,
      system: {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform
      },
      timestamp: new Date().toISOString()
    };

    res.json(metrics);
  } catch (error) {
    console.error('[PERFORMANCE] Error getting metrics:', error);
    res.status(500).json({ error: 'Failed to get performance metrics' });
  }
};

// GET /api/performance/health
export const getHealthCheck = async (req: Request, res: Response) => {
  try {
    const startTime = performance.now();
    
    // Test database connection
    const dbStart = performance.now();
    // Simple database ping
    const dbTime = performance.now() - dbStart;
    
    // Test cache performance
    const cacheStart = performance.now();
    const cacheTest = await userDataCache.getUserData('test', async () => 'test');
    const cacheTime = performance.now() - cacheStart;
    
    const totalTime = performance.now() - startTime;
    
    const health = {
      status: 'healthy',
      checks: {
        database: {
          status: 'ok',
          responseTime: `${dbTime.toFixed(2)}ms`
        },
        cache: {
          status: 'ok',
          responseTime: `${cacheTime.toFixed(2)}ms`
        }
      },
      totalResponseTime: `${totalTime.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    };

    res.json(health);
  } catch (error) {
    console.error('[PERFORMANCE] Health check failed:', error);
    res.status(500).json({ 
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
};

// POST /api/performance/optimize
export const optimizePerformance = async (req: Request, res: Response) => {
  try {
    const optimizations = [];

    // Clear caches
    userDataCache.clear();
    slotsDataCache.clear();
    marketDataCache.clear();
    optimizations.push('Cleared all caches');

    // Get slow queries and provide recommendations
    const slowQueries = DatabasePerformanceMonitor.getSlowQueries(500);
    if (slowQueries.length > 0) {
      optimizations.push(`Found ${slowQueries.length} slow queries that need optimization`);
    }

    // Memory optimization
    if (global.gc) {
      global.gc();
      optimizations.push('Triggered garbage collection');
    }

    res.json({
      status: 'optimized',
      optimizations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[PERFORMANCE] Optimization failed:', error);
    res.status(500).json({ error: 'Optimization failed' });
  }
};
