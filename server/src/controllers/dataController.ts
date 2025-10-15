import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { ACTIVE_REFERRAL_MIN_SLOTS, ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS, BRONZE_INVESTOR_THRESHOLD, GOLD_MAGNATE_THRESHOLD, PLATINUM_GOD_THRESHOLD } from '../constants.js';
import { ActivityLogType } from '@prisma/client';
import { isUserEligible, isUserSuspicious } from '../utils/helpers.js';
import { userSelect, userSelectWithoutMiningSlots, userSelectMinimal } from '../utils/dbSelects.js';
import { CacheService } from '../services/cacheService.js';
import { DatabaseOptimizationService } from '../services/databaseOptimizationService.js';
import { ensureUserWalletsByTelegramId } from '../utils/walletUtils.js';
import { DatabasePerformanceMonitor } from '../optimizations/databaseOptimizations.js';

// GET /api/user/:telegramId/data
export const getUserData = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  // console.log(`[DATA] Received /data request for user ${telegramId}.`); // Removed log

  if (!telegramId) {
    console.error('[DATA] Request failed: Telegram ID is required.');
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  try {
    const startTime = performance.now();
    
    // Ensure user has all required wallets before processing
    await ensureUserWalletsByTelegramId(telegramId);
    
    // Use optimized cache system with database optimization
    const cachedData = await CacheService.userData.getUserData(telegramId, async () => {
      // Use optimized database service
      const user = await DatabaseOptimizationService.getUserDataOptimized(telegramId);
      
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate earnings
      const totalEarnings = user.miningSlots.reduce((sum, slot) => sum + slot.accruedEarnings, 0);

      const USDWallet = user.wallets.find(w => w.currency === 'USD');
      const MNEWallet = user.wallets.find(w => w.currency === 'MNE');
      const currentBalance = USDWallet?.balance || 0;
      const mneBalance = MNEWallet?.balance || 0;
      
      const totalMiningPower = user.miningSlots.reduce((sum, slot) => sum + slot.effectiveWeeklyRate, 0);

      return { 
        balance: currentBalance, 
        mneBalance: mneBalance,
        miningPower: totalMiningPower,
        accruedEarnings: totalEarnings,
        totalInvested: user.totalInvested,
        referralCount: user._count.referrals,
        rank: user.rank,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatarUrl: user.avatarUrl,
        telegramId: user.telegramId,
        referralCode: user.referralCode,
        referredById: user.referredById,
        lastSeenAt: user.lastSeenAt,
        lastDepositAt: user.lastDepositAt,
        lastWithdrawalAt: user.lastWithdrawalAt,
        lastSlotPurchaseAt: user.lastSlotPurchaseAt,
        captchaValidated: user.captchaValidated,
        lastReferralZeroPenaltyAppliedAt: user.lastReferralZeroPenaltyAppliedAt,
        isSuspicious: user.isSuspicious,
        lastSuspiciousPenaltyAppliedAt: user.lastSuspiciousPenaltyAppliedAt,
        lastInvestmentGrowthBonusClaimedAt: user.lastInvestmentGrowthBonusClaimedAt,
        isOnline: user.isOnline,
        permissions: user.permissions,
        managedBy: user.managedBy,
        activityLogs: user.activityLogs,
        referralsCount: user.referrals.length,
        wallets: user.wallets,
        isEligibleForFirstWithdrawal: isUserEligible(user.id),
        isUserSuspicious: isUserSuspicious(user.id),
        lastActivityAt: user.lastActivityAt,
        isActive: user.isActive,
        isFrozen: user.isFrozen,
        frozenAt: user.frozenAt,
        frozenReason: user.frozenReason,
        activityScore: user.activityScore,
        totalWithdrawn: user.totalWithdrawn,
        firstWithdrawalAt: user.firstWithdrawalAt,
        hasMadeDeposit: user.hasMadeDeposit,
        lastLotteryTicketAt: user.lastLotteryTicketAt,
      };
    });

    if (!cachedData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Record performance metrics
    const totalTime = performance.now() - startTime;
    DatabasePerformanceMonitor.recordQuery('getUserData', totalTime);
    
    console.log(`[PERFORMANCE] User data fetch for ${telegramId}: ${totalTime.toFixed(2)}ms`);
    
    res.status(200).json(cachedData);

  } catch (error) {
    console.error(`[DATA] CRITICAL: Error fetching data for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/stats
export const getUserStats = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    // Use optimized database service
    const user = await DatabaseOptimizationService.getUserStatsOptimized(telegramId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isEligible = await isUserEligible(user.id);
    const isSuspicious = await isUserSuspicious(user.id);

    // Use the pre-calculated values from getUserStatsOptimized
    const totalEarnings = user.totalEarnings || 0;
    const totalSpending = user.totalSpending || 0;
    const activeReferralsCount = user.activeReferralsCount || 0;
    const boostersPurchased = user.boostersPurchased || 0;

    let rank: string | null = null;
    if (user.totalInvested >= PLATINUM_GOD_THRESHOLD) {
      rank = 'Platinum God';
    } else if (user.totalInvested >= GOLD_MAGNATE_THRESHOLD) {
      rank = 'Gold Magnate';
    } else if (user.totalInvested >= BRONZE_INVESTOR_THRESHOLD) {
      rank = 'Bronze Investor';
    }

    const totalSystemWithdrawals = await prisma.activityLog.count({
      where: { type: ActivityLogType.WITHDRAWAL },
    });

    const stats = {
      totalEarnings,
      totalSpending: Math.abs(totalSpending),
      referralCount: user._count.referrals,
      activeReferralCount: activeReferralsCount,
      tasksCompleted: user._count.completedTasks,
      slotsOwned: user._count.miningSlots,
      boostersPurchased,
      totalInvested: user.totalInvested,
      isEligible: isEligible,
      isSuspicious: isSuspicious,
      rank: rank,
      totalSystemWithdrawals,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error(`Error fetching stats for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/activity
export const getUserActivity = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const transactions = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.status(200).json(transactions);
  } catch (error) {
    console.error(`Error fetching activity for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
