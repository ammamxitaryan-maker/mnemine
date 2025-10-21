import { Router } from 'express';
import { StatsAnalyticsService } from '../services/statsAnalyticsService.js';
import { StatsCacheService } from '../services/statsCacheService.js';
import { UnifiedStatsService } from '../services/unifiedStatsService.js';
import { LogContext } from '../types/logging.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/stats/enhanced - Enhanced user statistics
 */
router.get('/enhanced', async (req, res) => {
  try {
    const { includeAnalytics = 'false', days = '30' } = req.query;

    // Get basic stats with caching
    const stats = await StatsCacheService.getOrSet(
      'enhanced-stats',
      () => UnifiedStatsService.getUserStats(),
      5 * 60 * 1000, // 5 minutes cache
      { source: 'api', tags: ['enhanced-stats', 'public'] }
    );

    let response: any = {
      success: true,
      data: stats,
      cache: {
        hit: StatsCacheService.getCacheStatus().hasCache,
        age: StatsCacheService.getCacheStatus().age
      }
    };

    // Include analytics if requested
    if (includeAnalytics === 'true') {
      const analytics = await StatsCacheService.getOrSet(
        `analytics-${days}`,
        () => StatsAnalyticsService.getAnalytics(parseInt(days as string)),
        15 * 60 * 1000, // 15 minutes cache
        { source: 'api', tags: ['analytics', 'detailed'] }
      );

      const healthScore = await StatsAnalyticsService.getHealthScore();

      response.analytics = analytics;
      response.healthScore = healthScore;
    }

    res.json(response);
  } catch (error) {
    logger.error(LogContext.SERVER, 'Error fetching enhanced stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced statistics'
    });
  }
});

/**
 * GET /api/stats/trends - Get trend analysis
 */
router.get('/trends', async (req, res) => {
  try {
    const { metric = 'users', period = '30' } = req.query;

    const analytics = await StatsAnalyticsService.getAnalytics(parseInt(period as string));

    let trendData: any = {};

    switch (metric) {
      case 'users':
        trendData = {
          daily: StatsAnalyticsService.analyzeTrend(analytics.userGrowth.daily),
          weekly: StatsAnalyticsService.analyzeTrend(analytics.userGrowth.weekly),
          monthly: StatsAnalyticsService.analyzeTrend(analytics.userGrowth.monthly)
        };
        break;
      case 'engagement':
        trendData = {
          daily: StatsAnalyticsService.analyzeTrend(analytics.engagement.dailyActiveUsers),
          weekly: StatsAnalyticsService.analyzeTrend(analytics.engagement.weeklyActiveUsers),
          monthly: StatsAnalyticsService.analyzeTrend(analytics.engagement.monthlyActiveUsers)
        };
        break;
      case 'financial':
        trendData = {
          invested: StatsAnalyticsService.analyzeTrend(analytics.financial.totalInvested),
          earnings: StatsAnalyticsService.analyzeTrend(analytics.financial.totalEarnings),
          conversion: StatsAnalyticsService.analyzeTrend(analytics.financial.conversionRate)
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid metric. Use: users, engagement, or financial'
        });
    }

    res.json({
      success: true,
      data: trendData,
      period: `${period} days`
    });
  } catch (error) {
    logger.error(LogContext.SERVER, 'Error fetching trend analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trend analysis'
    });
  }
});

/**
 * GET /api/stats/predictions - Get predictions
 */
router.get('/predictions', async (req, res) => {
  try {
    const analytics = await StatsAnalyticsService.getAnalytics(30);

    res.json({
      success: true,
      data: analytics.predictions,
      confidence: analytics.predictions.confidence,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    logger.error(LogContext.SERVER, 'Error fetching predictions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predictions'
    });
  }
});

/**
 * GET /api/stats/health - Get application health score
 */
router.get('/health', async (req, res) => {
  try {
    const healthScore = await StatsAnalyticsService.getHealthScore();
    const cacheStats = StatsCacheService.getStats();

    res.json({
      success: true,
      data: {
        healthScore,
        cache: {
          hitRate: cacheStats.hitRate,
          size: cacheStats.size,
          averageAge: cacheStats.averageAge
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error(LogContext.SERVER, 'Error fetching health score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health score'
    });
  }
});

/**
 * POST /api/stats/cache/clear - Clear cache (admin only)
 */
router.post('/cache/clear', async (req, res) => {
  try {
    const { pattern } = req.body;

    if (pattern) {
      const invalidated = StatsCacheService.invalidate(pattern);
      res.json({
        success: true,
        message: `Invalidated ${invalidated} cache entries`,
        pattern
      });
    } else {
      StatsCacheService.clear();
      res.json({
        success: true,
        message: 'All cache cleared'
      });
    }
  } catch (error) {
    logger.error(LogContext.SERVER, 'Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cache'
    });
  }
});

/**
 * GET /api/stats/cache/status - Get cache status
 */
router.get('/cache/status', async (req, res) => {
  try {
    const stats = StatsCacheService.getStats();
    const status = StatsCacheService.getCacheStatus();

    res.json({
      success: true,
      data: {
        ...stats,
        ...status,
        entries: Array.from(StatsCacheService['cache'].keys()).map(key => ({
          key,
          details: StatsCacheService.getEntryDetails(key)
        }))
      }
    });
  } catch (error) {
    logger.error(LogContext.SERVER, 'Error fetching cache status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cache status'
    });
  }
});

export default router;
