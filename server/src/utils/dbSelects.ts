import { Prisma } from '@prisma/client';

export const userSelect = Prisma.validator<Prisma.UserSelect>()({
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
  wallets: true,
  miningSlots: {
    where: { isActive: true },
    select: {
      id: true,
      userId: true,
      principal: true,
      startAt: true,
      lastAccruedAt: true,
      effectiveWeeklyRate: true,
      expiresAt: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      type: true,
      isLocked: true,
    },
  },
  lastReferralZeroPenaltyAppliedAt: true,
  isSuspicious: true,
  lastSuspiciousPenaltyAppliedAt: true,
  rank: true,
  referrals: {
    select: {
      id: true,
      telegramId: true,
      firstName: true,
      username: true,
    },
  },
});

export const userSelectWithoutMiningSlots = Prisma.validator<Prisma.UserSelect>()({
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
  wallets: true,
  lastReferralZeroPenaltyAppliedAt: true,
  isSuspicious: true,
  lastSuspiciousPenaltyAppliedAt: true,
  rank: true,
  lastInvestmentGrowthBonusClaimedAt: true,
});

export const userSelectForAdminList = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  telegramId: true,
  firstName: true,
  username: true,
  role: true,
  createdAt: true,
  lastSeenAt: true,
  totalInvested: true,
  wallets: {
    select: {
      currency: true,
      balance: true,
    },
  },
  _count: {
    select: {
      referrals: true,
      miningSlots: true,
    },
  },
});

// Optimized userSelect for production - minimal data to reduce query size
export const userSelectMinimal = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  telegramId: true,
  username: true,
  firstName: true,
  totalInvested: true,
  wallets: {
    select: {
      currency: true,
      balance: true,
    },
  },
  miningSlots: {
    where: { isActive: true },
    select: {
      id: true,
      principal: true,
      lastAccruedAt: true,
      effectiveWeeklyRate: true,
      expiresAt: true,
    },
  },
  rank: true,
});