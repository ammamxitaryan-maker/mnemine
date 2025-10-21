import prisma from '../prisma.js';
import { LogContext } from '../utils/logger.js';
import { logger } from '../utils/logger.js';

interface AnalyticsData {
  userGrowth: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
  engagement: {
    dailyActiveUsers: number[];
    weeklyActiveUsers: number[];
    monthlyActiveUsers: number[];
  };
  financial: {
    totalInvested: number[];
    totalEarnings: number[];
    conversionRate: number[];
  };
  retention: {
    day1: number;
    day7: number;
    day30: number;
  };
  predictions: {
    nextWeekUsers: number;
    nextMonthUsers: number;
    confidence: number;
  };
}

interface TrendAnalysis {
  direction: 'up' | 'down' | 'stable';
  magnitude: number;
  confidence: number;
  period: string;
}

export class StatsAnalyticsService {
  private static readonly RETENTION_PERIODS = [1, 7, 30];
  private static readonly PREDICTION_DAYS = 30;

  /**
   * Get comprehensive analytics data
   */
  static async getAnalytics(days: number = 30): Promise<AnalyticsData> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const [
      userGrowth,
      engagement,
      financial,
      retention,
      predictions
    ] = await Promise.all([
      this.getUserGrowthData(startDate, endDate),
      this.getEngagementData(startDate, endDate),
      this.getFinancialData(startDate, endDate),
      this.getRetentionData(),
      this.getPredictions()
    ]);

    return {
      userGrowth,
      engagement,
      financial,
      retention,
      predictions
    };
  }

  /**
   * Get user growth trends
   */
  private static async getUserGrowthData(startDate: Date, endDate: Date) {
    const dailyGrowth: number[] = [];
    const weeklyGrowth: number[] = [];
    const monthlyGrowth: number[] = [];

    // Daily growth
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      });

      dailyGrowth.unshift(count);
    }

    // Weekly growth
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(endDate.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: weekStart,
            lt: weekEnd
          }
        }
      });

      weeklyGrowth.unshift(count);
    }

    // Monthly growth
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(endDate.getTime() - (i + 1) * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(endDate.getTime() - i * 30 * 24 * 60 * 60 * 1000);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      });

      monthlyGrowth.unshift(count);
    }

    return {
      daily: dailyGrowth,
      weekly: weeklyGrowth,
      monthly: monthlyGrowth
    };
  }

  /**
   * Get engagement metrics
   */
  private static async getEngagementData(startDate: Date, endDate: Date) {
    const dailyActiveUsers: number[] = [];
    const weeklyActiveUsers: number[] = [];
    const monthlyActiveUsers: number[] = [];

    // Daily active users
    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const count = await prisma.user.count({
        where: {
          lastActivityAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      });

      dailyActiveUsers.unshift(count);
    }

    // Weekly active users
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(endDate.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const count = await prisma.user.count({
        where: {
          lastActivityAt: {
            gte: weekStart,
            lt: weekEnd
          }
        }
      });

      weeklyActiveUsers.unshift(count);
    }

    // Monthly active users
    for (let i = 0; i < 3; i++) {
      const monthStart = new Date(endDate.getTime() - (i + 1) * 30 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(endDate.getTime() - i * 30 * 24 * 60 * 60 * 1000);

      const count = await prisma.user.count({
        where: {
          lastActivityAt: {
            gte: monthStart,
            lt: monthEnd
          }
        }
      });

      monthlyActiveUsers.unshift(count);
    }

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers
    };
  }

  /**
   * Get financial metrics
   */
  private static async getFinancialData(startDate: Date, endDate: Date) {
    const totalInvested: number[] = [];
    const totalEarnings: number[] = [];
    const conversionRate: number[] = [];

    // Weekly financial data
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(endDate.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(endDate.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const [invested, earnings, totalUsers, usersWithDeposits] = await Promise.all([
        prisma.activityLog.aggregate({
          where: {
            type: 'DEPOSIT',
            createdAt: { gte: weekStart, lt: weekEnd }
          },
          _sum: { amount: true }
        }),
        prisma.activityLog.aggregate({
          where: {
            type: 'CLAIM',
            createdAt: { gte: weekStart, lt: weekEnd }
          },
          _sum: { amount: true }
        }),
        prisma.user.count({
          where: { createdAt: { lt: weekEnd } }
        }),
        prisma.user.count({
          where: {
            hasMadeDeposit: true,
            createdAt: { lt: weekEnd }
          }
        })
      ]);

      totalInvested.unshift(Math.abs(invested._sum.amount || 0));
      totalEarnings.unshift(earnings._sum.amount || 0);
      conversionRate.unshift(totalUsers > 0 ? (usersWithDeposits / totalUsers) * 100 : 0);
    }

    return {
      totalInvested,
      totalEarnings,
      conversionRate
    };
  }

  /**
   * Get retention metrics
   */
  private static async getRetentionData() {
    const retention: { [key: number]: number } = {};

    for (const period of this.RETENTION_PERIODS) {
      const periodStart = new Date(Date.now() - period * 24 * 60 * 60 * 1000);

      const [totalUsers, retainedUsers] = await Promise.all([
        prisma.user.count({
          where: { createdAt: { lt: periodStart } }
        }),
        prisma.user.count({
          where: {
            createdAt: { lt: periodStart },
            lastActivityAt: { gte: periodStart }
          }
        })
      ]);

      retention[period] = totalUsers > 0 ? (retainedUsers / totalUsers) * 100 : 0;
    }

    return {
      day1: retention[1],
      day7: retention[7],
      day30: retention[30]
    };
  }

  /**
   * Get predictions using simple linear regression
   */
  private static async getPredictions() {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get daily user counts for the last 30 days
    const dailyCounts: number[] = [];

    for (let i = 0; i < 30; i++) {
      const dayStart = new Date(endDate.getTime() - i * 24 * 60 * 60 * 1000);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const count = await prisma.user.count({
        where: {
          createdAt: {
            gte: dayStart,
            lt: dayEnd
          }
        }
      });

      dailyCounts.unshift(count);
    }

    // Simple linear regression
    const n = dailyCounts.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = dailyCounts;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    // Predict next week and month
    const nextWeekUsers = Math.max(0, Math.floor(slope * 7 + intercept));
    const nextMonthUsers = Math.max(0, Math.floor(slope * 30 + intercept));

    // Calculate confidence based on R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * x[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    const confidence = Math.max(0, Math.min(100, rSquared * 100));

    return {
      nextWeekUsers,
      nextMonthUsers,
      confidence
    };
  }

  /**
   * Analyze trends in data
   */
  static analyzeTrend(data: number[]): TrendAnalysis {
    if (data.length < 2) {
      return {
        direction: 'stable',
        magnitude: 0,
        confidence: 0,
        period: 'insufficient_data'
      };
    }

    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;
    const magnitude = Math.abs(change);
    const confidence = Math.min(100, Math.max(0, 100 - (magnitude / firstAvg) * 100));

    let direction: 'up' | 'down' | 'stable';
    if (change > firstAvg * 0.1) {
      direction = 'up';
    } else if (change < -firstAvg * 0.1) {
      direction = 'down';
    } else {
      direction = 'stable';
    }

    return {
      direction,
      magnitude,
      confidence,
      period: `${data.length} days`
    };
  }

  /**
   * Get health score for the application
   */
  static async getHealthScore(): Promise<number> {
    try {
      const analytics = await this.getAnalytics(30);

      // Calculate health score based on multiple factors
      const userGrowthTrend = this.analyzeTrend(analytics.userGrowth.daily);
      const engagementTrend = this.analyzeTrend(analytics.engagement.dailyActiveUsers);
      const financialTrend = this.analyzeTrend(analytics.financial.totalInvested);

      // Weighted health score
      const healthScore = (
        (userGrowthTrend.direction === 'up' ? 30 : userGrowthTrend.direction === 'stable' ? 20 : 10) +
        (engagementTrend.direction === 'up' ? 25 : engagementTrend.direction === 'stable' ? 15 : 5) +
        (financialTrend.direction === 'up' ? 25 : financialTrend.direction === 'stable' ? 15 : 5) +
        (analytics.retention.day7 > 20 ? 20 : analytics.retention.day7 > 10 ? 15 : 10)
      );

      return Math.min(100, Math.max(0, healthScore));
    } catch (error) {
      logger.error(LogContext.SERVER, 'Error calculating health score:', error);
      return 50; // Default score if calculation fails
    }
  }
}
