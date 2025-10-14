import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { DAILY_BONUS_AMOUNT, LEADERBOARD_BONUS_AMOUNT, INVESTMENT_GROWTH_BONUS_AMOUNT, DIVIDEND_BASE_RATE, DIVIDEND_RAND_MIN, DIVIDEND_RAND_MAX, DIVIDEND_COOLDOWN_HOURS } from '../constants.js'; // Added dividend constants
import { ActivityLogType, Wallet } from '@prisma/client';
import { isUserEligible } from '../utils/helpers.js';
import { userSelectWithoutMiningSlots } from '../utils/dbSelects.js'; // Import userSelect

const COOLDOWN_HOURS = 24;
const DAILY_BONUS_DESCRIPTION = 'Claimed daily bonus';

// GET /api/user/:telegramId/bonuses/summary
export const getBonusesSummary = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        totalInvested: true,
        lastInvestmentGrowthBonusClaimedAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let claimableCount = 0;

    // 1. Daily Bonus Check
    const lastDailyClaim = await prisma.activityLog.findFirst({
      where: { userId: user.id, type: ActivityLogType.DAILY_BONUS },
      orderBy: { createdAt: 'desc' },
    });
    if (!lastDailyClaim || (new Date().getTime() - lastDailyClaim.createdAt.getTime() >= COOLDOWN_HOURS * 60 * 60 * 1000)) {
      claimableCount++;
    }

    // 2. Dividends Bonus Check
    if (user.totalInvested > 0) {
        const lastDividendClaim = await prisma.activityLog.findFirst({
            where: { userId: user.id, type: ActivityLogType.DIVIDEND_BONUS },
            orderBy: { createdAt: 'desc' },
        });
        if (!lastDividendClaim || (new Date().getTime() - lastDividendClaim.createdAt.getTime() >= DIVIDEND_COOLDOWN_HOURS * 60 * 60 * 1000)) {
            claimableCount++;
        }
    }

    // 3. Leaderboard Bonus Check
    const topWallets = await prisma.wallet.findMany({
      where: { currency: 'USD' },
      take: 10,
      orderBy: { balance: 'desc' },
      select: { userId: true },
    });
    const isInTop10 = topWallets.some(w => w.userId === user.id);
    if (isInTop10) {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastLeaderboardClaim = await prisma.activityLog.findFirst({
        where: { userId: user.id, type: ActivityLogType.LEADERBOARD_BONUS, createdAt: { gte: twentyFourHoursAgo } },
      });
      if (!lastLeaderboardClaim) {
        claimableCount++;
      }
    }

    // 4. Investment Growth Bonus Check
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const hasRecentInvestment = await prisma.activityLog.count({
      where: { userId: user.id, type: { in: [ActivityLogType.DEPOSIT, ActivityLogType.NEW_SLOT_PURCHASE, ActivityLogType.SLOT_EXTENSION, ActivityLogType.REINVESTMENT] }, createdAt: { gte: sevenDaysAgo } },
    }) > 0;
    if (hasRecentInvestment && (!user.lastInvestmentGrowthBonusClaimedAt || (new Date().getTime() - user.lastInvestmentGrowthBonusClaimedAt.getTime() >= 7 * 24 * 60 * 60 * 1000))) {
      claimableCount++;
    }

    // 5. Referral Streak Bonus Check
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recentReferrals = (await prisma.activityLog.findMany({
      where: { userId: user.id, type: ActivityLogType.REFERRAL_SIGNUP_BONUS, createdAt: { gte: threeDaysAgo } },
      distinct: ['sourceUserId'],
      select: { sourceUserId: true }
    })).length;
    const bonusClaimed = await prisma.activityLog.count({
      where: { userId: user.id, type: ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS, createdAt: { gte: threeDaysAgo } },
    });
    if (recentReferrals >= 3 && bonusClaimed === 0) {
      claimableCount++;
    }

    res.status(200).json({ claimableCount });

  } catch (error) {
    console.error(`Error fetching bonuses summary for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// GET /api/user/:telegramId/daily-bonus
export const getDailyBonusStatus = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        telegramId: true,
        lastInvestmentGrowthBonusClaimedAt: true,
        lastReferralZeroPenaltyAppliedAt: true,
        isSuspicious: true,
        lastSuspiciousPenaltyAppliedAt: true,
        rank: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lastClaim = await prisma.activityLog.findFirst({
      where: { userId: user.id, type: ActivityLogType.DAILY_BONUS },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastClaim) {
      return res.status(200).json({ canClaim: true, nextClaimAt: null });
    }

    const nextClaimDate = new Date(lastClaim.createdAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
    const canClaim = new Date() >= nextClaimDate;

    res.status(200).json({ canClaim, nextClaimAt: canClaim ? null : nextClaimDate.toISOString() });
  } catch (error) {
    console.error(`Error fetching daily bonus status for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/daily-bonus/claim
export const claimDailyBonus = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots, // Use the reusable userSelect
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lastClaim = await prisma.activityLog.findFirst({
      where: { userId: user.id, type: ActivityLogType.DAILY_BONUS },
      orderBy: { createdAt: 'desc' },
    });

    if (lastClaim) {
      const nextClaimDate = new Date(lastClaim.createdAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
      if (new Date() < nextClaimDate) {
        return res.status(400).json({ error: 'Daily bonus not available yet.' });
      }
    }

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet) return res.status(400).json({ error: 'USD wallet not found' });

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { increment: DAILY_BONUS_AMOUNT } },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.DAILY_BONUS,
          amount: DAILY_BONUS_AMOUNT,
          description: DAILY_BONUS_DESCRIPTION,
        },
      }),
    ]);

    res.status(200).json({ message: `Claimed ${DAILY_BONUS_AMOUNT} USD successfully!` });
  } catch (error) {
    console.error(`Error claiming daily bonus for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/claim-leaderboard-bonus
export const claimLeaderboardBonus = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const ipAddress = req.ip;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots, // Use the reusable userSelect
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const topWallets = await prisma.wallet.findMany({
      where: { currency: 'USD' },
      take: 10,
      orderBy: { balance: 'desc' },
      select: { userId: true },
    });

    const isInTop10 = topWallets.some(w => w.userId === user.id);
    if (!isInTop10) {
      return res.status(400).json({ error: 'You are not currently in the top 10 of the leaderboard.' });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const lastClaim = await prisma.activityLog.findFirst({
      where: {
        userId: user.id,
        type: ActivityLogType.LEADERBOARD_BONUS,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (lastClaim) {
      return res.status(400).json({ error: 'Leaderboard bonus already claimed recently.' });
    }

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet) return res.status(400).json({ error: 'USD wallet not found' });

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { increment: LEADERBOARD_BONUS_AMOUNT } },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.LEADERBOARD_BONUS,
          amount: LEADERBOARD_BONUS_AMOUNT,
          description: `Claimed leaderboard top 10 bonus of ${LEADERBOARD_BONUS_AMOUNT} USD.`,
          ipAddress: ipAddress,
        },
      }),
    ]);

    res.status(200).json({ message: `Claimed ${LEADERBOARD_BONUS_AMOUNT} USD leaderboard bonus!` });
  } catch (error) {
    console.error(`Error claiming leaderboard bonus for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/claim-investment-growth-bonus
export const claimInvestmentGrowthBonus = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const ipAddress = req.ip;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots, // Use the reusable userSelect
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const hasRecentInvestmentActivity = await prisma.activityLog.count({
      where: {
        userId: user.id,
        type: {
          in: [
            ActivityLogType.DEPOSIT,
            ActivityLogType.NEW_SLOT_PURCHASE,
            ActivityLogType.SLOT_EXTENSION,
            ActivityLogType.REINVESTMENT,
          ],
        },
        createdAt: { gte: sevenDaysAgo },
      },
    }) > 0;

    if (!hasRecentInvestmentActivity) {
      return res.status(400).json({ error: 'No investment growth in the last 7 days.' });
    }

    if (user.lastInvestmentGrowthBonusClaimedAt && (new Date().getTime() - user.lastInvestmentGrowthBonusClaimedAt.getTime() < 7 * 24 * 60 * 60 * 1000)) {
      return res.status(400).json({ error: 'Investment growth bonus already claimed recently.' });
    }

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet) return res.status(400).json({ error: 'USD wallet not found' });

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { increment: INVESTMENT_GROWTH_BONUS_AMOUNT } },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { lastInvestmentGrowthBonusClaimedAt: new Date() },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.INVESTMENT_GROWTH_BONUS,
          amount: INVESTMENT_GROWTH_BONUS_AMOUNT,
          description: `Claimed investment growth bonus of ${INVESTMENT_GROWTH_BONUS_AMOUNT} USD.`,
          ipAddress: ipAddress,
        },
      }),
    ]);

    res.status(200).json({ message: `Claimed ${INVESTMENT_GROWTH_BONUS_AMOUNT} USD investment growth bonus!` });
  } catch (error) {
    console.error(`Error claiming investment growth bonus for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/dividends-status
export const getDividendsStatus = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        totalInvested: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lastClaim = await prisma.activityLog.findFirst({
      where: { userId: user.id, type: ActivityLogType.DIVIDEND_BONUS },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastClaim) {
      return res.status(200).json({ canClaim: true, nextClaimAt: null, estimatedAmount: (user.totalInvested * DIVIDEND_BASE_RATE * (DIVIDEND_RAND_MIN + DIVIDEND_RAND_MAX) / 2).toFixed(4) });
    }

    const nextClaimDate = new Date(lastClaim.createdAt.getTime() + DIVIDEND_COOLDOWN_HOURS * 60 * 60 * 1000);
    const canClaim = new Date() >= nextClaimDate;
    const estimatedAmount = (user.totalInvested * DIVIDEND_BASE_RATE * (DIVIDEND_RAND_MIN + DIVIDEND_RAND_MAX) / 2).toFixed(4);

    res.status(200).json({ canClaim, nextClaimAt: canClaim ? null : nextClaimDate.toISOString(), estimatedAmount });
  } catch (error) {
    console.error(`Error fetching dividends status for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/claim-dividends
export const claimDividends = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const ipAddress = req.ip;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots, // Use the reusable userSelect
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lastClaim = await prisma.activityLog.findFirst({
      where: { userId: user.id, type: ActivityLogType.DIVIDEND_BONUS },
      orderBy: { createdAt: 'desc' },
    });

    if (lastClaim) {
      const nextClaimDate = new Date(lastClaim.createdAt.getTime() + DIVIDEND_COOLDOWN_HOURS * 60 * 60 * 1000);
      if (new Date() < nextClaimDate) {
        return res.status(400).json({ error: 'Dividends not available yet.' });
      }
    }

    if (user.totalInvested <= 0) {
      return res.status(400).json({ error: 'You need to have investments to claim dividends.' });
    }

    const randomFactor = DIVIDEND_RAND_MIN + Math.random() * (DIVIDEND_RAND_MAX - DIVIDEND_RAND_MIN);
    const dividendAmount = user.totalInvested * DIVIDEND_BASE_RATE * randomFactor;

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet) return res.status(400).json({ error: 'USD wallet not found' });

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { increment: dividendAmount } },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.DIVIDEND_BONUS,
          amount: dividendAmount,
          description: `Claimed ${dividendAmount.toFixed(4)} USD dividends based on ${user.totalInvested.toFixed(4)} USD invested.`,
          ipAddress: ipAddress,
        },
      }),
    ]);

    res.status(200).json({ message: `Claimed ${dividendAmount.toFixed(4)} USD dividends!` });
  } catch (error) {
    console.error(`Error claiming dividends for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
