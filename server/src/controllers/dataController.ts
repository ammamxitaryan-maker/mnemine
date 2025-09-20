import { Request, Response } from 'express';
import prisma from '../prisma';
import { ACTIVE_REFERRAL_MIN_SLOTS, ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS, BRONZE_INVESTOR_THRESHOLD, GOLD_MAGNATE_THRESHOLD, PLATINUM_GOD_THRESHOLD } from '../constants';
import { ActivityLogType } from '@prisma/client';
import { isUserEligible, isUserSuspicious } from '../utils/helpers';
import { userSelect, userSelectWithoutMiningSlots } from '../utils/dbSelects'; // Import userSelect

// GET /api/user/:telegramId/data
export const getUserData = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  // console.log(`[DATA] Received /data request for user ${telegramId}.`); // Removed log

  if (!telegramId) {
    console.error('[DATA] Request failed: Telegram ID is required.');
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  try {
    // console.log(`[DATA] Querying database for user ${telegramId}...`); // Removed log
    const user = await prisma.user.findUnique({ 
      where: { telegramId }, 
      select: {
        ...userSelect,
        _count: {
          select: { referrals: true }
        }
      }, // Use the reusable userSelect
    });

    if (!user) {
      console.error(`[DATA] User not found for telegramId: ${telegramId}.`);
      return res.status(404).json({ error: 'User not found' });
    }
    // console.log(`[DATA] User found. ID: ${user.id}. Wallets: ${user.wallets.length}, Active Slots: ${user.miningSlots.length}.`); // Removed log

    // Update lastSeenAt on data fetch
    await prisma.user.update({
      where: { telegramId },
      data: { lastSeenAt: new Date() },
    });

    const now = new Date();
    let totalEarnings = 0;
    
    // console.log('[DATA] Calculating accrued earnings...'); // Removed log
    user.miningSlots.forEach(slot => {
      const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
      if (timeElapsedMs > 0) {
        const earnings = slot.principal * slot.effectiveWeeklyRate * (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));
        totalEarnings += earnings;
      }
    });
    // console.log(`[DATA] Calculated accrued earnings: ${totalEarnings}.`); // Removed log

    const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
    const currentBalance = cfmWallet?.balance || 0;
    // console.log(`[DATA] Current balance from wallet: ${currentBalance}.`); // Removed log
    
    const totalMiningPower = user.miningSlots.reduce((sum, slot) => sum + slot.effectiveWeeklyRate, 0);
    // console.log(`[DATA] Total mining power: ${totalMiningPower}.`); // Removed log

    const responseData = { 
      balance: currentBalance, 
      miningPower: totalMiningPower,
      accruedEarnings: totalEarnings,
      totalInvested: user.totalInvested,
      referralCount: user._count.referrals, // Added referral count
      rank: user.rank, // Added user rank
    };

    // console.log('[DATA] Sending successful response:', responseData); // Removed log
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
      
    const boostersPurchased = transactions.filter(t => t.type === ActivityLogType.BOOSTER_PURCHASE).length;

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