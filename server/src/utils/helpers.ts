import crypto from 'crypto';
import prisma from '../prisma.js';
import { ActivityLogType } from '@prisma/client';
import { ACTIVE_REFERRAL_MIN_SLOTS, ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS, SUSPICIOUS_IP_THRESHOLD } from '../constants.js';

export async function generateUniqueReferralCode(): Promise<string> {
  let code: string;
  let userWithCode = null;
  do {
    code = crypto.randomBytes(4).toString('hex');
    userWithCode = await prisma.user.findUnique({ where: { referralCode: code } }).catch(() => null);
  } while (userWithCode);
  return code;
}

export async function isUserEligible(userId: string): Promise<boolean> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Check for investment growth in the last 7 days
  const recentInvestmentActivity = await prisma.activityLog.count({
    where: {
      userId: userId,
      type: {
        in: [
          ActivityLogType.DEPOSIT,
          ActivityLogType.NEW_SLOT_PURCHASE,
          ActivityLogType.SLOT_EXTENSION,
        ],
      },
      createdAt: { gte: sevenDaysAgo },
    },
  });
  const hasInvestmentGrowth = recentInvestmentActivity > 0;

  // Check for active direct referrals (at least 3)
  const directReferrals = await prisma.user.findMany({
    where: { referredById: userId },
    select: {
      id: true,
      _count: {
        select: {
          miningSlots: { where: { isActive: true } },
          referrals: true, // Direct referrals of the referred user
        },
      },
    },
  });

  const activeDirectReferralsCount = directReferrals.filter(ref =>
    ref._count.miningSlots >= ACTIVE_REFERRAL_MIN_SLOTS || ref._count.referrals >= ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS
  ).length;

  const hasEnoughActiveReferrals = activeDirectReferralsCount >= 3; // M = 3 USD

  return hasInvestmentGrowth || hasEnoughActiveReferrals;
}

export async function isUserSuspicious(userId: string): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  // Count unique IP addresses used by the user in the last 24 hours
  const ipAddresses = await prisma.activityLog.findMany({
    where: {
      userId: userId,
      createdAt: { gte: twentyFourHoursAgo },
      ipAddress: { not: null },
    },
    select: { ipAddress: true },
    distinct: ['ipAddress'],
  });

  return ipAddresses.length > SUSPICIOUS_IP_THRESHOLD;
}

export async function hasReferredInLast7Days(userId: string): Promise<boolean> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const recentReferrals = await prisma.activityLog.count({
    where: {
      userId: userId,
      type: ActivityLogType.REFERRAL_SIGNUP_BONUS,
      createdAt: { gte: sevenDaysAgo },
    },
  });

  return recentReferrals > 0;
}
