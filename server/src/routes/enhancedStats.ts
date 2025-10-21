import { Router } from 'express';
import { StatsAnalyticsService } from '../services/statsAnalyticsService.js';
import { StatsCacheService } from '../services/statsCacheService.js';
import { UnifiedStatsService } from '../services/unifiedStatsService.js';
import { LogContext, logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/stats/fake - Get fake data for real-time updates (every 10 seconds)
 */
router.get('/fake', async (req, res) => {
  try {
    console.log('[FAKE-STATS] Request received for real-time fake data');

    const now = new Date();
    const BASE_TOTAL_USERS = 10000;
    const MINUTE_USER_GROWTH = 0.208; // 12.5/60 = 0.208 users per minute
    const SECOND_USER_GROWTH = MINUTE_USER_GROWTH / 60; // Growth per second

    // Calculate total users with second-level precision for more frequent updates
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const secondsSinceDayStart = (now.getTime() - dayStart.getTime()) / 1000;
    const growthSinceDayStart = secondsSinceDayStart * SECOND_USER_GROWTH;
    const totalUsers = Math.floor(BASE_TOTAL_USERS + growthSinceDayStart);

    // Online users calculation: 4-7% of total users
    const MIN_ONLINE_PERCENTAGE = 0.04; // 4%
    const MAX_ONLINE_PERCENTAGE = 0.07; // 7%
    
    // Calculate base online users as percentage of total users
    const baseOnlinePercentage = MIN_ONLINE_PERCENTAGE + 
      (Math.random() * (MAX_ONLINE_PERCENTAGE - MIN_ONLINE_PERCENTAGE));
    
    let onlineUsers = Math.floor(totalUsers * baseOnlinePercentage);
    
    // Add small random variation (±1%) for more frequent updates
    const randomVariation = (Math.random() - 0.5) * 0.02; // ±1%
    onlineUsers = Math.floor(onlineUsers * (1 + randomVariation));
    
    // Ensure minimum of 1 online user
    onlineUsers = Math.max(1, onlineUsers);

    const newUsersToday = Math.floor(secondsSinceDayStart * SECOND_USER_GROWTH);
    const activeUsers = Math.floor(totalUsers * 0.35);

    const fakeStats = {
      totalUsers,
      onlineUsers,
      newUsersToday: Math.max(0, newUsersToday),
      activeUsers,
      usersWithDeposits: Math.floor(totalUsers * 0.15),
      usersWithActiveSlots: Math.floor(totalUsers * 0.20),
      totalInvested: totalUsers * 50,
      totalEarnings: totalUsers * 25,
      conversionRate: 15 + Math.random() * 10,
      lastUpdate: now.toISOString(),
      isRealData: false,
      dataSource: 'fake-realtime',
      updateInterval: '10s'
    };

    const response = {
      success: true,
      data: fakeStats,
      timestamp: now.toISOString()
    };

    console.log('[FAKE-STATS] Sending real-time fake data:', fakeStats);
    res.json(response);
  } catch (error) {
    console.error('[FAKE-STATS] Error generating fake data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate fake data',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/stats/enhanced - Enhanced user statistics
 */
router.get('/enhanced', async (req, res) => {
  try {
    console.log('[ENHANCED-STATS] Request received');

    // Try to get stats directly from UnifiedStatsService first
    let stats;
    try {
      stats = await UnifiedStatsService.getUserStats();
      console.log('[ENHANCED-STATS] Got stats from UnifiedStatsService:', stats);
    } catch (serviceError) {
      console.error('[ENHANCED-STATS] Error getting stats from service:', serviceError);

      // Fallback to simple calculation
      const now = new Date();
      const BASE_TOTAL_USERS = 10000;
      const MINUTE_USER_GROWTH = 0.208;

      const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const minutesSinceDayStart = (now.getTime() - dayStart.getTime()) / (1000 * 60);
      const growthSinceDayStart = minutesSinceDayStart * MINUTE_USER_GROWTH;
      const totalUsers = Math.floor(BASE_TOTAL_USERS + growthSinceDayStart);

      stats = {
        totalUsers,
        onlineUsers: Math.floor(totalUsers * 0.12),
        newUsersToday: Math.floor(minutesSinceDayStart * MINUTE_USER_GROWTH),
        activeUsers: Math.floor(totalUsers * 0.35),
        usersWithDeposits: Math.floor(totalUsers * 0.15),
        usersWithActiveSlots: Math.floor(totalUsers * 0.20),
        totalInvested: totalUsers * 50,
        totalEarnings: totalUsers * 25,
        conversionRate: 15 + Math.random() * 10,
        lastUpdate: now.toISOString(),
        isRealData: false,
        dataSource: 'fallback'
      };

      console.log('[ENHANCED-STATS] Using fallback calculation:', stats);
    }

    const response = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    };

    console.log('[ENHANCED-STATS] Sending response:', response);
    res.json(response);
  } catch (error) {
    console.error('[ENHANCED-STATS] Critical error:', error);
    logger.error(LogContext.SERVER, 'Error fetching enhanced stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch enhanced statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
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
