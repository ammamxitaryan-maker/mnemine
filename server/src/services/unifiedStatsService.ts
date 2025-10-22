import prisma from '../prisma.js';
import { LogContext, logger } from '../utils/logger.js';

interface UnifiedUserStats {
  totalUsers: number;
  onlineUsers: number;
  newUsersToday: number;
  activeUsers: number;
  usersWithDeposits: number;
  usersWithActiveSlots: number;
  totalInvested: number;
  totalEarnings: number;
  conversionRate: number;
  lastUpdate: string;
  isRealData: boolean;
  dataSource: 'database' | 'calculated' | 'hybrid';
}

interface StatsCache {
  data: UnifiedUserStats;
  timestamp: number;
  ttl: number;
}

export class UnifiedStatsService {
  private static cache: StatsCache | null = null;
  private static readonly CACHE_TTL = 1 * 60 * 1000; // 1 minute for more frequent updates
  private static readonly REAL_DATA_THRESHOLD = 0; // Use real data when available

  // Fake user algorithm constants
  private static readonly BASE_TOTAL_USERS = 10000;
  private static readonly BASE_ONLINE_USERS = 150;
  private static readonly DAILY_USER_GROWTH = 300; // 300 users per day
  private static readonly HOURLY_USER_GROWTH = 12.5; // 300/24 = 12.5 users per hour
  private static readonly MINUTE_USER_GROWTH = 0.208; // 12.5/60 = 0.208 users per minute

  // Online users calculation: 4-7% of total users
  private static readonly MIN_ONLINE_PERCENTAGE = 0.04; // 4%
  private static readonly MAX_ONLINE_PERCENTAGE = 0.07; // 7%

  /**
   * Get unified user statistics - Use real data when available, fallback to calculated
   * Works in both DEVELOPMENT and PRODUCTION modes
   */
  static async getUserStats(): Promise<UnifiedUserStats> {
    // Check cache first
    if (this.cache && Date.now() - this.cache.timestamp < this.cache.ttl) {
      return this.cache.data;
    }

    try {
      // Try to get real data first
      const realStats = await this.getRealStats();

      // Use real data if we have enough users
      if (realStats.totalUsers >= this.REAL_DATA_THRESHOLD) {
        logger.info(LogContext.SERVER, `Using real data - Total users: ${realStats.totalUsers}, Online: ${realStats.onlineUsers}`);
        this.cache = {
          data: realStats,
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        };
        return this.cache.data;
      } else {
        // Fallback to calculated data if not enough real users
        const nodeEnv = process.env.NODE_ENV || 'development';
        logger.info(LogContext.SERVER, `Using calculated fake data (not enough real users: ${realStats.totalUsers}) - Mode: ${nodeEnv}`);
        const calculatedStats = this.getCalculatedStats();
        this.cache = {
          data: { ...calculatedStats, isRealData: false, dataSource: 'calculated' },
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        };
        return this.cache.data;
      }
    } catch (error) {
      logger.error(LogContext.SERVER, 'Error getting user stats:', error);
      // Fallback to calculated data
      const calculatedStats = this.getCalculatedStats();
      this.cache = {
        data: { ...calculatedStats, isRealData: false, dataSource: 'calculated' },
        timestamp: Date.now(),
        ttl: this.CACHE_TTL
      };
      return this.cache.data;
    }
  }

  /**
   * Get real statistics from database
   */
  private static async getRealStats(): Promise<UnifiedUserStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    logger.info(LogContext.SERVER, 'Fetching real statistics from database...');

    // Single optimized query for all user counts
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      usersWithDeposits,
      usersWithActiveSlots,
      financialStats
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          isActive: true,
          isFrozen: false,
          lastActivityAt: { gte: weekAgo }
        }
      }),
      prisma.user.count({
        where: { createdAt: { gte: todayStart } }
      }),
      prisma.user.count({
        where: { hasMadeDeposit: true }
      }),
      prisma.user.count({
        where: {
          miningSlots: {
            some: { isActive: true }
          }
        }
      }),
      prisma.user.aggregate({
        _sum: {
          totalInvested: true,
          totalEarnings: true
        }
      })
    ]);

    // Calculate online users based on recent activity
    const onlineUsers = await prisma.user.count({
      where: {
        lastActivityAt: {
          gte: new Date(now.getTime() - 15 * 60 * 1000) // Last 15 minutes
        }
      }
    });

    const conversionRate = totalUsers > 0 ? (usersWithDeposits / totalUsers) * 100 : 0;

    logger.info(LogContext.SERVER, 'Real statistics fetched:', {
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      usersWithDeposits,
      usersWithActiveSlots,
      totalInvested: financialStats._sum.totalInvested || 0,
      totalEarnings: financialStats._sum.totalEarnings || 0,
      conversionRate
    });

    return {
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      usersWithDeposits,
      usersWithActiveSlots,
      totalInvested: financialStats._sum.totalInvested || 0,
      totalEarnings: financialStats._sum.totalEarnings || 0,
      conversionRate,
      lastUpdate: now.toISOString(),
      isRealData: true,
      dataSource: 'database'
    };
  }

  /**
   * Get hybrid statistics (real data + calculated growth)
   */
  private static async getHybridStats(realStats: UnifiedUserStats): Promise<UnifiedUserStats> {
    const now = new Date();

    // Use the same algorithm as calculated stats but start from real data
    const totalUsers = this.calculateTotalUsers(now);
    const onlineUsers = this.calculateOnlineUsers(now, totalUsers);
    const newUsersToday = this.calculateNewUsersToday(now, totalUsers);
    const activeUsers = Math.floor(totalUsers * 0.35); // 35% active users

    return {
      ...realStats,
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      usersWithDeposits: Math.floor(totalUsers * 0.15),
      usersWithActiveSlots: Math.floor(totalUsers * 0.20),
      lastUpdate: now.toISOString()
    };
  }

  /**
   * Get calculated statistics (fallback) - Enhanced fake user algorithm
   */
  private static getCalculatedStats(): UnifiedUserStats {
    const now = new Date();

    // Calculate total users with consistent growth
    const totalUsers = this.calculateTotalUsers(now);

    // Calculate online users with time-based variation
    const onlineUsers = this.calculateOnlineUsers(now, totalUsers);

    // Calculate other metrics based on total users
    const newUsersToday = this.calculateNewUsersToday(now, totalUsers);
    const activeUsers = Math.floor(totalUsers * 0.35); // 35% active users
    const usersWithDeposits = Math.floor(totalUsers * 0.15); // 15% with deposits
    const usersWithActiveSlots = Math.floor(totalUsers * 0.20); // 20% with active slots

    // Use deterministic calculation for conversion rate consistency
    const timeBasedSeed = Math.floor(now.getTime() / (1000 * 60)); // Change every minute
    const deterministicRandom = ((timeBasedSeed * 9301 + 49297) % 233280) / 233280;

    return {
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      usersWithDeposits,
      usersWithActiveSlots,
      totalInvested: totalUsers * 50, // Estimated
      totalEarnings: totalUsers * 25, // Estimated
      conversionRate: 15 + (deterministicRandom * 10), // Use deterministic value
      lastUpdate: now.toISOString(),
      isRealData: false,
      dataSource: 'calculated'
    };
  }

  /**
   * Calculate total users with persistent growth (server-side, consistent for all users)
   */
  private static calculateTotalUsers(now: Date): number {
    // Use a deterministic seed based on date to ensure consistency across all users
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minutesSinceDayStart = (now.getTime() - dayStart.getTime()) / (1000 * 60);

    // Calculate base users + growth since day start
    const growthSinceDayStart = minutesSinceDayStart * this.MINUTE_USER_GROWTH;
    const totalUsers = Math.floor(this.BASE_TOTAL_USERS + growthSinceDayStart);

    return totalUsers;
  }

  /**
   * Calculate online users as 4-7% of total users (deterministic for consistency)
   */
  private static calculateOnlineUsers(now: Date, totalUsers: number): number {
    // Online users calculation: 4-7% of total users
    // Use deterministic calculation based on time to ensure all users see the same data
    const timeBasedSeed = Math.floor(now.getTime() / (1000 * 60)); // Change every minute
    const deterministicRandom = ((timeBasedSeed * 9301 + 49297) % 233280) / 233280;

    const baseOnlinePercentage = this.MIN_ONLINE_PERCENTAGE +
      (deterministicRandom * (this.MAX_ONLINE_PERCENTAGE - this.MIN_ONLINE_PERCENTAGE));

    let onlineUsers = Math.floor(totalUsers * baseOnlinePercentage);

    // Add small deterministic variation (±1%) for more frequent updates
    const deterministicVariation = ((timeBasedSeed * 9301 + 49297) % 233280) / 233280 - 0.5;
    const variation = deterministicVariation * 0.02; // ±1%
    onlineUsers = Math.floor(onlineUsers * (1 + variation));

    // Ensure minimum of 1 online user
    return Math.max(1, onlineUsers);
  }

  /**
   * Calculate new users today
   */
  private static calculateNewUsersToday(now: Date, totalUsers: number): number {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minutesSinceDayStart = (now.getTime() - dayStart.getTime()) / (1000 * 60);

    // Calculate new users based on growth rate
    const newUsersToday = Math.floor(minutesSinceDayStart * this.MINUTE_USER_GROWTH);

    return Math.max(0, newUsersToday);
  }

  /**
   * Calculate growth rate based on historical data
   */
  private static calculateGrowthRate(stats: UnifiedUserStats): number {
    // Simple growth rate calculation
    // In a real implementation, this would use historical data
    return 2.5; // 2.5 users per hour
  }

  /**
   * Clear cache (for testing or manual refresh)
   */
  static clearCache(): void {
    this.cache = null;
  }

  /**
   * Get cache status
   */
  static getCacheStatus(): { hasCache: boolean; age: number; ttl: number } {
    if (!this.cache) {
      return { hasCache: false, age: 0, ttl: this.CACHE_TTL };
    }

    return {
      hasCache: true,
      age: Date.now() - this.cache.timestamp,
      ttl: this.cache.ttl
    };
  }

  /**
   * Get algorithm status for debugging
   */
  static getAlgorithmStatus(): {
    baseTotalUsers: number;
    baseOnlineUsers: number;
    dailyGrowth: number;
    currentTime: string;
    onlinePercentageRange: string;
    calculatedTotalUsers: number;
    calculatedOnlineUsers: number;
  } {
    const now = new Date();
    const totalUsers = this.calculateTotalUsers(now);
    const onlineUsers = this.calculateOnlineUsers(now, totalUsers);

    return {
      baseTotalUsers: this.BASE_TOTAL_USERS,
      baseOnlineUsers: this.BASE_ONLINE_USERS,
      dailyGrowth: this.DAILY_USER_GROWTH,
      currentTime: now.toISOString(),
      onlinePercentageRange: '4-7%',
      calculatedTotalUsers: totalUsers,
      calculatedOnlineUsers: onlineUsers
    };
  }
}
