/**
 * Business logic types for NONMINE application
 * Defines all business entities and operations
 */

import { InvestmentStatus, InvestmentType, UserRole, WithdrawalStatus, WithdrawalType } from '@prisma/client';

// User types
export interface UserProfile {
  id: string;
  telegramId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  referralCode: string;
  referredById: string | null;
  totalInvested: number;
  lastDepositAt: Date | null;
  lastWithdrawalAt: Date | null;
  lastSlotPurchaseAt: Date | null;
  captchaValidated: boolean;
  isSuspicious: boolean;
  lastSuspiciousPenaltyAppliedAt: Date | null;
  rank: string | null;
  lastInvestmentGrowthBonusClaimedAt: Date | null;
  isOnline: boolean;
  permissions: string[];
  managedBy: string | null;
  lastActivityAt: Date | null;
  isActive: boolean;
  isFrozen: boolean;
  frozenAt: Date | null;
  frozenReason: string | null;
  activityScore: number;
  totalEarnings: number;
  totalWithdrawn: number;
  firstWithdrawalAt: Date | null;
  hasMadeDeposit: boolean;
  lastLotteryTicketAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date | null;
}

// Wallet types
export interface WalletInfo {
  id: string;
  userId: string;
  currency: 'USD' | 'MNE';
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

// Mining slot types
export interface MiningSlotInfo {
  id: string;
  userId: string;
  principal: number;
  accruedEarnings: number;
  startAt: Date;
  lastAccruedAt: Date;
  effectiveWeeklyRate: number;
  expiresAt: Date;
  isActive: boolean;
  type: 'standard' | 'premium' | 'vip';
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SlotPurchaseRequest {
  amount: number;
  currency: 'USD' | 'MNE';
  type?: 'standard' | 'premium' | 'vip';
}

export interface SlotPurchaseResponse {
  slot: MiningSlotInfo;
  transaction: TransactionInfo;
  newBalance: number;
}

// Investment types
export interface InvestmentInfo {
  id: string;
  userId: string;
  amount: number;
  type: InvestmentType;
  status: InvestmentStatus;
  startDate: Date;
  endDate: Date;
  expectedReturn: number;
  actualReturn: number;
  weeklyRate: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction types
export interface TransactionInfo {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: 'USD' | 'MNE';
  status: TransactionStatus;
  description: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'SLOT_PURCHASE'
  | 'SLOT_CLAIM'
  | 'REFERRAL_BONUS'
  | 'TASK_REWARD'
  | 'LOTTERY_WIN'
  | 'SWAP'
  | 'ADMIN_ADJUSTMENT'
  | 'SYSTEM_BONUS';

export type TransactionStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REJECTED';

// Withdrawal types
export interface WithdrawalRequest {
  amount: number;
  currency: 'USD' | 'MNE';
  type: WithdrawalType;
  reason?: string;
}

export interface WithdrawalInfo {
  id: string;
  userId: string;
  amount: number;
  currency: 'USD' | 'MNE';
  status: WithdrawalStatus;
  type: WithdrawalType;
  adminApproved: boolean;
  adminId: string | null;
  processedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Lottery types
export interface LotteryInfo {
  id: string;
  drawDate: Date;
  jackpot: number;
  isDrawn: boolean;
  winningNumbers: string | null;
  createdAt: Date;
}

export interface LotteryTicketInfo {
  id: string;
  userId: string;
  lotteryId: string;
  numbers: string;
  isWinner: boolean;
  prizeAmount: number | null;
  isAdminSelected: boolean;
  createdAt: Date;
}

export interface LotteryPurchaseRequest {
  numbers: string[];
  amount: number;
}

export interface LotteryPurchaseResponse {
  ticket: LotteryTicketInfo;
  transaction: TransactionInfo;
  newBalance: number;
}

// Swap types
export interface SwapRequest {
  fromCurrency: 'USD' | 'MNE';
  toCurrency: 'USD' | 'MNE';
  amount: number;
}

export interface SwapResponse {
  swap: SwapTransactionInfo;
  newBalances: {
    fromBalance: number;
    toBalance: number;
  };
}

export interface SwapTransactionInfo {
  id: string;
  userId: string;
  USDAmount: number;
  MNEAmount: number;
  exchangeRate: number;
  createdAt: Date;
}

// Referral types
export interface ReferralInfo {
  id: string;
  userId: string;
  sourceUserId: string;
  amount: number;
  type: ReferralEarningType;
  level: number;
  isCapped: boolean;
  createdAt: Date;
}

export type ReferralEarningType =
  | 'SIGNUP_BONUS'
  | 'DEPOSIT_COMMISSION'
  | 'EARNINGS_COMMISSION'
  | 'ACTIVITY_BONUS';

// Task types
export interface TaskInfo {
  id: string;
  taskId: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  createdAt: Date;
}

export interface CompletedTaskInfo {
  userId: string;
  taskId: string;
  createdAt: Date;
}

// Activity log types
export interface ActivityLogInfo {
  id: string;
  userId: string;
  type: ActivityLogType;
  amount: number;
  description: string;
  createdAt: Date;
  sourceUserId: string | null;
  ipAddress: string | null;
}

export type ActivityLogType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'CLAIM'
  | 'NEW_SLOT_PURCHASE'
  | 'SLOT_EXTENSION'
  | 'REFERRAL_SIGNUP_BONUS'
  | 'REFERRAL_COMMISSION'
  | 'REFERRAL_DEPOSIT_BONUS'
  | 'TASK_REWARD'
  | 'DAILY_BONUS'
  | 'WELCOME_BONUS'
  | 'REINVESTMENT'
  | 'LEADERBOARD_BONUS'
  | 'INVESTMENT_GROWTH_BONUS'
  | 'DIVIDEND_BONUS'
  | 'REFERRAL_3_IN_3_DAYS_BONUS'
  | 'BALANCE_ZEROED_PENALTY'
  | 'BALANCE_FROZEN_PENALTY'
  | 'LOTTERY_TICKET_PURCHASE'
  | 'LOTTERY_WIN'
  | 'SWAP_USD_TO_MNE'
  | 'EXCHANGE_RATE_CHANGE'
  | 'ADMIN_LOTTERY_WIN'
  | 'LOGIN'
  | 'LOGOUT'
  | 'INVESTMENT_CREATED'
  | 'INVESTMENT_COMPLETED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'REFERRAL_EARNED'
  | 'ACCOUNT_FROZEN'
  | 'ACCOUNT_UNFROZEN'
  | 'PASSWORD_CHANGED'
  | 'PROFILE_UPDATED'
  | 'ADMIN_ACTION'
  | 'EARNINGS'
  | 'REFERRAL'
  | 'BONUS';

// Exchange rate types
export interface ExchangeRateInfo {
  id: string;
  rate: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Notification types
export interface NotificationInfo {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'PENDING' | 'SENT' | 'FAILED';
  scheduledFor: Date | null;
  attempts: number;
  lastAttemptAt: Date | null;
  error: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalInvestments: number;
  totalEarnings: number;
  totalWithdrawals: number;
  activeSlots: number;
  totalLotteryTickets: number;
  systemBalance: {
    USD: number;
    MNE: number;
  };
  recentActivity: ActivityLogInfo[];
  topUsers: Array<{
    userId: string;
    username: string | null;
    totalInvested: number;
    totalEarnings: number;
  }>;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string | null;
  firstName: string | null;
  totalInvested: number;
  totalEarnings: number;
  totalWithdrawn: number;
  activeSlots: number;
  referralCount: number;
  isCurrentUser?: boolean;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  currentUserRank?: number;
  totalUsers: number;
  lastUpdated: Date;
}
