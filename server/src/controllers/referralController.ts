import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { REFERRAL_3_IN_3_DAYS_BONUS, RANK_REFERRAL_BONUS_PERCENTAGE } from '../constants.js';
import { ActivityLogType, Wallet } from '@prisma/client';
import { isUserEligible } from '../utils/helpers.js';
import { userSelectWithoutMiningSlots } from '../utils/dbSelects.js'; // Import userSelect

// GET /api/user/:telegramId/referrals
export const getReferralData = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId }, include: { _count: { select: { referrals: true } } } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    // Generate individual referral link
    const referralLink = `https://t.me/mnemine/app?startapp=${user.referralCode}`;
    
    res.status(200).json({ 
      referralCode: user.referralCode, 
      referralLink: referralLink,
      referralCount: user._count.referrals 
    });
  } catch (error) {
    console.error(`Error fetching referral data for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/referrals/list
export const getReferralList = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const referrals = await prisma.user.findMany({
      where: { referredById: user.id },
      select: {
        id: true,
        firstName: true,
        username: true,
        avatarUrl: true,
        lastSeenAt: true,
        createdAt: true,
        totalInvested: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const referralsWithStatus = referrals.map(ref => ({
      ...ref,
      isOnline: ref.lastSeenAt ? new Date(ref.lastSeenAt) > fiveMinutesAgo : false,
    }));

    res.status(200).json(referralsWithStatus);
  } catch (error) {
    console.error(`Error fetching referral list for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/referrals/stats
export const getReferralStats = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId }, select: { id: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // 1. Total Referral Earnings
    const referralActivities = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        type: { in: [ActivityLogType.REFERRAL_COMMISSION, ActivityLogType.REFERRAL_SIGNUP_BONUS, ActivityLogType.REFERRAL_DEPOSIT_BONUS, ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS] },
      },
      select: { amount: true },
    });
    const totalReferralEarnings = referralActivities.reduce((sum, act) => sum + (act.amount || 0), 0);

    // 2. Active Referrals Count
    const activeReferralsCount = await prisma.user.count({
      where: {
        referredById: user.id,
        OR: [
          { miningSlots: { some: { isActive: true } } },
          { referrals: { some: {} } }
        ]
      }
    });

    // 3. Referrals by Level
    const l1Referrals = await prisma.user.findMany({ where: { referredById: user.id }, select: { id: true } });
    const l1Ids = l1Referrals.map(r => r.id);

    const l2Referrals = await prisma.user.findMany({ where: { referredById: { in: l1Ids } }, select: { id: true } });
    const l2Ids = l2Referrals.map(r => r.id);
    
    const l3ReferralsCount = await prisma.user.count({ where: { referredById: { in: l2Ids } } });

    const referralsByLevel = {
      l1: l1Referrals.length,
      l2: l2Referrals.length,
      l3: l3ReferralsCount,
    };

    res.status(200).json({
      totalReferralEarnings,
      activeReferralsCount,
      referralsByLevel,
    });

  } catch (error) {
    console.error(`Error fetching referral stats for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/referrals/streak-bonus-status
export const getReferralStreakBonusStatus = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const recentReferrals = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        type: ActivityLogType.REFERRAL_SIGNUP_BONUS,
        createdAt: { gte: threeDaysAgo },
      },
      distinct: ['sourceUserId'],
      select: { sourceUserId: true },
    });

    const bonusClaimed = await prisma.activityLog.count({
      where: {
        userId: user.id,
        type: ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS,
        createdAt: { gte: threeDaysAgo },
      },
    });

    const canClaim = recentReferrals.length >= 3 && bonusClaimed === 0;

    res.status(200).json({ canClaim, referralCountIn3Days: recentReferrals.length });
  } catch (error) {
    console.error(`Error fetching referral streak bonus status for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/referrals/claim-streak-bonus
export const claimReferralStreakBonus = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const ipAddress = req.ip;

  try {
    const user = await prisma.user.findUnique({ 
      where: { telegramId }, 
      select: userSelectWithoutMiningSlots, // Use the reusable userSelect
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const recentReferrals = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        type: ActivityLogType.REFERRAL_SIGNUP_BONUS,
        createdAt: { gte: threeDaysAgo },
      },
      distinct: ['sourceUserId'],
      select: { sourceUserId: true },
    });

    const bonusClaimed = await prisma.activityLog.count({
      where: {
        userId: user.id,
        type: ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS,
        createdAt: { gte: threeDaysAgo },
      },
    });

    if (recentReferrals.length < 3 || bonusClaimed > 0) {
      return res.status(400).json({ error: 'Conditions for 3 referrals in 3 days bonus not met or already claimed.' });
    }

    let bonusAmount = REFERRAL_3_IN_3_DAYS_BONUS;
    if (user.rank) {
      bonusAmount += bonusAmount * RANK_REFERRAL_BONUS_PERCENTAGE;
    }

    const userIsEligible = await isUserEligible(user.id);
    if (!userIsEligible) {
      const userCurrentBalance = user.wallets.find((w: Wallet) => w.currency === 'USD')?.balance || 0;
      bonusAmount = Math.min(bonusAmount * 0.5, 0.5 * userCurrentBalance);
    }

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet) return res.status(400).json({ error: 'USD wallet not found' });

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { increment: bonusAmount } },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS,
          amount: bonusAmount,
          description: `Bonus for 3 referrals in 3 days${!userIsEligible ? ' (cut by 50% & capped)' : ''}`,
          ipAddress: ipAddress,
        },
      }),
    ]);

    res.status(200).json({ message: `Claimed ${bonusAmount} USD for 3 referrals in 3 days!` });
  } catch (error) {
    console.error(`Error claiming referral streak bonus for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
