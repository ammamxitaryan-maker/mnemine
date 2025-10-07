import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { ACTIVE_REFERRAL_MIN_SLOTS, ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS, BRONZE_INVESTOR_THRESHOLD, GOLD_MAGNATE_THRESHOLD, PLATINUM_GOD_THRESHOLD } from '../constants.js';
import { ActivityLogType } from '@prisma/client';
import { isUserEligible, isUserSuspicious } from '../utils/helpers.js';
import { userSelect, userSelectWithoutMiningSlots, userSelectMinimal } from '../utils/dbSelects.js'; // Import userSelect

// Simple in-memory cache for user data to improve performance
const userDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds cache TTL

// GET /api/user/:telegramId/data
export const getUserData = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  // console.log(`[DATA] Received /data request for user ${telegramId}.`); // Removed log

  if (!telegramId) {
    console.error('[DATA] Request failed: Telegram ID is required.');
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  try {
    // Check cache first
    const cacheKey = `userData_${telegramId}`;
    const cached = userDataCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Return cached data if still valid
      return res.status(200).json(cached.data);
    }

    const user = await prisma.user.findUnique({ 
      where: { telegramId }, 
      select: {
        ...userSelectMinimal,
        _count: {
          select: { referrals: true }
        }
      }, // Use minimal userSelect for better performance
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update lastSeenAt on data fetch
    await prisma.user.update({
      where: { telegramId },
      data: { lastSeenAt: new Date() },
    });

    // Use continuous earnings processor for accurate 24/7 earnings
    const { continuousEarningsProcessor } = await import('../utils/continuousEarningsProcessor.js');
    const totalEarnings = await continuousEarningsProcessor.getUserEarnings(telegramId);

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    const currentBalance = USDWallet?.balance || 0;
    
    const totalMiningPower = user.miningSlots.reduce((sum, slot) => sum + slot.effectiveWeeklyRate, 0);

    const responseData = { 
      balance: currentBalance, 
      miningPower: totalMiningPower,
      accruedEarnings: totalEarnings,
      totalInvested: user.totalInvested,
      referralCount: user._count.referrals, // Added referral count
      rank: user.rank, // Added user rank
    };

    // Cache the response data
    userDataCache.set(cacheKey, { data: responseData, timestamp: now });
    
    res.status(200).json(responseData);

  } catch (error) {
    console.error(`[DATA] CRITICAL: Error fetching data for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/stats
export const getUserStats = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
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
        lastDepositAt: true,
        lastWithdrawalAt: true,
        lastSlotPurchaseAt: true,
        _count: {
          select: { referrals: true, completedTasks: true, miningSlots: true },
        },
        miningSlots: { where: { isActive: true } },
        lastInvestmentGrowthBonusClaimedAt: true,
        lastReferralZeroPenaltyAppliedAt: true,
        isSuspicious: true,
        lastSuspiciousPenaltyAppliedAt: true,
        rank: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = await prisma.activityLog.findMany({
      where: { userId: user.id },
    });

    const totalEarnings = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSpending = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const boostersPurchased = 0; // Booster functionality removed

    const activeReferralsCount = await prisma.user.count({
      where: {
        referredById: user.id,
        OR: [
          { miningSlots: { some: { isActive: true } } },
          { referrals: { some: {} } }
        ]
      }
    });

    const isEligible = await isUserEligible(user.id);
    const isSuspicious = await isUserSuspicious(user.id);

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
