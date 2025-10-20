import { performance } from 'perf_hooks';
import prisma from '../prisma.js';

interface BatchUpdateItem {
  id: string;
  data: unknown;
}

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
}

export class DatabaseOptimizationService {
  private static queryMetrics: QueryMetrics[] = [];
  private static readonly MAX_METRICS = 1000;

  /**
   * Optimized user data fetch with single query and transaction
   */
  static async getUserDataOptimized(telegramId: string) {
    const startTime = performance.now();

    try {
      // Single transaction to get user data and update lastSeenAt
      const result = await prisma.$transaction(async (tx) => {
        // Get user data with all related information in one query
        const user = await tx.user.findUnique({
          where: { telegramId },
          select: {
            id: true,
            telegramId: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            referralCode: true,
            referredById: true,
            totalInvested: true,
            totalEarnings: true,
            rank: true,
            lastSeenAt: true,
            lastDepositAt: true,
            lastWithdrawalAt: true,
            lastSlotPurchaseAt: true,
            captchaValidated: true,
            lastReferralZeroPenaltyAppliedAt: true,
            isSuspicious: true,
            lastSuspiciousPenaltyAppliedAt: true,
            lastInvestmentGrowthBonusClaimedAt: true,
            isOnline: true,
            permissions: true,
            managedBy: true,
            lastActivityAt: true,
            isActive: true,
            isFrozen: true,
            frozenAt: true,
            frozenReason: true,
            activityScore: true,
            totalWithdrawn: true,
            firstWithdrawalAt: true,
            hasMadeDeposit: true,
            lastLotteryTicketAt: true,
            wallets: {
              select: {
                id: true,
                currency: true,
                balance: true
              }
            },
            miningSlots: {
              select: {
                id: true,
                principal: true,
                startAt: true,
                expiresAt: true,
                isActive: true,
                type: true,
                accruedEarnings: true,
                effectiveWeeklyRate: true,
                lastAccruedAt: true
              }
            },
            referrals: {
              select: {
                id: true,
                firstName: true,
                username: true,
                totalInvested: true,
                hasMadeDeposit: true
              }
            },
            activityLogs: {
              select: {
                id: true,
                type: true,
                amount: true,
                description: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 10
            },
            _count: {
              select: {
                referrals: true,
                miningSlots: true,
                activityLogs: true
              }
            }
          }
        });

        if (!user) {
          return null;
        }

        // Update lastSeenAt in the same transaction
        await tx.user.update({
          where: { telegramId },
          data: { lastSeenAt: new Date() }
        });

        return user;
      });

      const duration = performance.now() - startTime;
      this.recordQueryMetrics('getUserDataOptimized', duration);

      return result;
    } catch (error) {
      console.error('[DB_OPTIMIZATION] getUserDataOptimized failed:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple mining slots
   */
  static async batchUpdateMiningSlots(updates: BatchUpdateItem[]) {
    const startTime = performance.now();

    try {
      await prisma.$transaction(async (tx) => {
        // Use updateMany for each unique set of data
        const groupedUpdates = this.groupUpdatesByData(updates);

        for (const [dataKey, ids] of groupedUpdates.entries()) {
          const data = JSON.parse(dataKey);
          await tx.miningSlot.updateMany({
            where: { id: { in: ids } },
            data: data
          });
        }
      });

      const duration = performance.now() - startTime;
      this.recordQueryMetrics('batchUpdateMiningSlots', duration);

      console.log(`[DB_OPTIMIZATION] Batch updated ${updates.length} mining slots in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('[DB_OPTIMIZATION] batchUpdateMiningSlots failed:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple wallets
   */
  static async batchUpdateWallets(updates: BatchUpdateItem[]) {
    const startTime = performance.now();

    try {
      await prisma.$transaction(async (tx) => {
        const groupedUpdates = this.groupUpdatesByData(updates);

        for (const [dataKey, ids] of groupedUpdates.entries()) {
          const data = JSON.parse(dataKey);
          await tx.wallet.updateMany({
            where: { id: { in: ids } },
            data: data
          });
        }
      });

      const duration = performance.now() - startTime;
      this.recordQueryMetrics('batchUpdateWallets', duration);

      console.log(`[DB_OPTIMIZATION] Batch updated ${updates.length} wallets in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('[DB_OPTIMIZATION] batchUpdateWallets failed:', error);
      throw error;
    }
  }

  /**
   * Batch create multiple activity logs
   */
  static async batchCreateActivityLogs(logs: { userId: string; type: any; amount: number; description: string }[]) {
    const startTime = performance.now();

    try {
      await prisma.activityLog.createMany({
        data: logs,
        skipDuplicates: true
      });

      const duration = performance.now() - startTime;
      this.recordQueryMetrics('batchCreateActivityLogs', duration);

      console.log(`[DB_OPTIMIZATION] Batch created ${logs.length} activity logs in ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.error('[DB_OPTIMIZATION] batchCreateActivityLogs failed:', error);
      throw error;
    }
  }

  /**
   * Optimized earnings calculation with batch processing
   */
  static async calculateEarningsOptimized(slotIds: string[]) {
    const startTime = performance.now();

    try {
      // Single query to get all slots
      const slots = await prisma.miningSlot.findMany({
        where: { id: { in: slotIds } },
        select: {
          id: true,
          principal: true,
          effectiveWeeklyRate: true,
          startAt: true,
          expiresAt: true,
          lastAccruedAt: true,
          accruedEarnings: true,
          isActive: true
        }
      });

      const currentTime = new Date();
      const updates: BatchUpdateItem[] = [];

      for (const slot of slots) {
        if (!slot.isActive) continue;

        const timeElapsed = currentTime.getTime() - slot.lastAccruedAt.getTime();
        const slotDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
        const progress = Math.min(timeElapsed / slotDuration, 1);

        const expectedEarnings = slot.principal * slot.effectiveWeeklyRate;
        const newAccruedEarnings = expectedEarnings * progress;

        if (newAccruedEarnings > slot.accruedEarnings) {
          updates.push({
            id: slot.id,
            data: {
              accruedEarnings: newAccruedEarnings,
              lastAccruedAt: currentTime
            }
          });
        }
      }

      // Batch update all slots
      if (updates.length > 0) {
        await this.batchUpdateMiningSlots(updates);
      }

      const duration = performance.now() - startTime;
      this.recordQueryMetrics('calculateEarningsOptimized', duration);

      return {
        slotsProcessed: slots.length,
        slotsUpdated: updates.length,
        duration: duration
      };
    } catch (error) {
      console.error('[DB_OPTIMIZATION] calculateEarningsOptimized failed:', error);
      throw error;
    }
  }

  /**
   * Optimized user statistics with single query
   */
  static async getUserStatsOptimized(telegramId: string) {
    const startTime = performance.now();

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          referralCode: true,
          referredById: true,
          totalInvested: true,
          totalEarnings: true,
          lastDepositAt: true,
          lastWithdrawalAt: true,
          lastSlotPurchaseAt: true,
          lastInvestmentGrowthBonusClaimedAt: true,
          lastReferralZeroPenaltyAppliedAt: true,
          isSuspicious: true,
          lastSuspiciousPenaltyAppliedAt: true,
          rank: true,
          miningSlots: {
            where: { isActive: true },
            select: {
              id: true,
              principal: true,
              accruedEarnings: true
            }
          },
          _count: {
            select: {
              referrals: true,
              completedTasks: true,
              miningSlots: true,
              activityLogs: true
            }
          }
        }
      });

      if (!user) {
        return null;
      }

      // Get activity logs in a separate optimized query
      const activityLogs = await prisma.activityLog.findMany({
        where: { userId: user.id },
        select: {
          amount: true,
          type: true
        }
      });

      // Calculate statistics
      const totalEarnings = activityLogs
        .filter(log => (log.amount || 0) > 0)
        .reduce((sum, log) => sum + (log.amount || 0), 0);

      const totalSpending = activityLogs
        .filter(log => (log.amount || 0) < 0)
        .reduce((sum, log) => sum + Math.abs(log.amount || 0), 0);

      const activeReferralsCount = await prisma.user.count({
        where: {
          referredById: user.id,
          OR: [
            { miningSlots: { some: { isActive: true } } },
            { referrals: { some: {} } }
          ]
        }
      });

      const duration = performance.now() - startTime;
      this.recordQueryMetrics('getUserStatsOptimized', duration);

      return {
        ...user,
        totalEarnings,
        totalSpending,
        activeReferralsCount,
        boostersPurchased: 0 // Booster functionality removed
      };
    } catch (error) {
      console.error('[DB_OPTIMIZATION] getUserStatsOptimized failed:', error);
      throw error;
    }
  }

  /**
   * Optimized admin dashboard stats with parallel queries
   */
  static async getDashboardStatsOptimized() {
    const startTime = performance.now();

    try {
      // Execute multiple queries in parallel
      const [
        totalUsers,
        activeUsers,
        frozenUsers,
        totalInvested,
        totalEarnings,
        totalWithdrawals,
        totalSlots,
        activeSlots,
        totalReferrals,
        weeklyActivity,
        newUsersThisWeek
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true, isFrozen: false } }),
        prisma.user.count({ where: { isFrozen: true } }),
        prisma.user.aggregate({ _sum: { totalInvested: true } }),
        prisma.user.aggregate({ _sum: { totalEarnings: true } }),
        prisma.withdrawal.aggregate({ _sum: { amount: true }, _count: true }),
        prisma.miningSlot.count(),
        prisma.miningSlot.count({ where: { isActive: true } }),
        prisma.user.count({ where: { referredById: { not: null } } }),
        prisma.activityLog.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        }),
        prisma.user.count({
          where: {
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        })
      ]);

      const duration = performance.now() - startTime;
      this.recordQueryMetrics('getDashboardStatsOptimized', duration);

      return {
        users: {
          total: totalUsers,
          active: activeUsers,
          frozen: frozenUsers,
          newThisWeek: newUsersThisWeek
        },
        finances: {
          totalInvested: totalInvested._sum.totalInvested || 0,
          totalEarnings: totalEarnings._sum.totalEarnings || 0,
          totalWithdrawals: totalWithdrawals._sum.amount || 0,
          withdrawalCount: totalWithdrawals._count || 0
        },
        slots: {
          total: totalSlots,
          active: activeSlots,
          inactive: totalSlots - activeSlots
        },
        referrals: {
          total: totalReferrals
        },
        activity: {
          weeklyLogs: weeklyActivity
        }
      };
    } catch (error) {
      console.error('[DB_OPTIMIZATION] getDashboardStatsOptimized failed:', error);
      throw error;
    }
  }

  /**
   * Group updates by their data to minimize updateMany calls
   */
  private static groupUpdatesByData(updates: BatchUpdateItem[]): Map<string, string[]> {
    const grouped = new Map<string, string[]>();

    for (const update of updates) {
      const dataKey = JSON.stringify(update.data);
      if (!grouped.has(dataKey)) {
        grouped.set(dataKey, []);
      }
      grouped.get(dataKey)!.push(update.id);
    }

    return grouped;
  }

  /**
   * Record query performance metrics
   */
  private static recordQueryMetrics(query: string, duration: number): void {
    this.queryMetrics.push({
      query,
      duration,
      timestamp: new Date()
    });

    // Keep only the last MAX_METRICS entries
    if (this.queryMetrics.length > this.MAX_METRICS) {
      this.queryMetrics = this.queryMetrics.slice(-this.MAX_METRICS);
    }
  }

  /**
   * Get query performance statistics
   */
  static getQueryStats() {
    const stats = new Map<string, { count: number; totalDuration: number; avgDuration: number }>();

    for (const metric of this.queryMetrics) {
      const existing = stats.get(metric.query) || { count: 0, totalDuration: 0, avgDuration: 0 };
      existing.count++;
      existing.totalDuration += metric.duration;
      existing.avgDuration = existing.totalDuration / existing.count;
      stats.set(metric.query, existing);
    }

    return Object.fromEntries(stats);
  }

  /**
   * Clear query metrics
   */
  static clearQueryStats(): void {
    this.queryMetrics = [];
  }
}
