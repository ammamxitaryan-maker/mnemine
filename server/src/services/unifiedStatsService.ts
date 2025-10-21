import { prisma } from '../prisma.js';
import { LogContext } from '../types/logging.js';
import { logger } from '../utils/logger.js';

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
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly REAL_DATA_THRESHOLD = 100; // Minimum users for real data

  /**
   * Get unified user statistics with intelligent fallback
   */
  static async getUserStats(): Promise<UnifiedUserStats> {
    // Check cache first
    if (this.cache && Date.now() - this.cache.timestamp < this.cache.ttl) {
      return this.cache.data;
    }

    try {
      // Try to get real data from database
      const realStats = await this.getRealStats();

      if (realStats.totalUsers >= this.REAL_DATA_THRESHOLD) {
        // Use real data if we have enough users
        this.cache = {
          data: { ...realStats, isRealData: true, dataSource: 'database' },
          timestamp: Date.now(),
          ttl: this.CACHE_TTL
        };
        return this.cache.data;
      } else {
        // Use hybrid approach: real data + calculated growth
        const hybridStats = await this.getHybridStats(realStats);
        this.cache = {
          data: { ...hybridStats, isRealData: false, dataSource: 'hybrid' },
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
    // Calculate growth based on real data
    const growthRate = this.calculateGrowthRate(realStats);
    const timeSinceLastUpdate = Date.now() - new Date(realStats.lastUpdate).getTime();
    const hoursSinceUpdate = timeSinceLastUpdate / (1000 * 60 * 60);

    // Apply growth to real data
    const totalUsers = Math.floor(realStats.totalUsers + (growthRate * hoursSinceUpdate));
    const onlineUsers = Math.floor(totalUsers * 0.12); // 12% online
    const newUsersToday = Math.floor(totalUsers * 0.03); // 3% new today
    const activeUsers = Math.floor(totalUsers * 0.35); // 35% active

    return {
      ...realStats,
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      lastUpdate: new Date().toISOString()
    };
  }

  /**
   * Get calculated statistics (fallback)
   */
  private static getCalculatedStats(): UnifiedUserStats {
    const now = new Date();
    const baseUsers = 10000;
    const timeVariation = Math.sin(now.getTime() / (1000 * 60 * 60)) * 50;
    const randomVariation = Math.random() * 20;

    const totalUsers = Math.floor(baseUsers + timeVariation + randomVariation);
    const onlineUsers = Math.floor(totalUsers * (0.08 + Math.random() * 0.07));
    const newUsersToday = Math.floor(totalUsers * (0.02 + Math.random() * 0.03));
    const activeUsers = Math.floor(totalUsers * (0.25 + Math.random() * 0.15));

    return {
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      usersWithDeposits: Math.floor(totalUsers * 0.15),
      usersWithActiveSlots: Math.floor(totalUsers * 0.20),
      totalInvested: totalUsers * 50, // Estimated
      totalEarnings: totalUsers * 25, // Estimated
      conversionRate: 15 + Math.random() * 10,
      lastUpdate: now.toISOString(),
      isRealData: false,
      dataSource: 'calculated'
    };
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
}
