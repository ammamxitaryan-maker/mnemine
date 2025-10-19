/**
 * Zod validation schemas for API endpoints
 * Provides runtime validation for all API requests and responses
 */

import { z } from 'zod';

// Base schemas
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const DateRangeBaseSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const DateRangeSchema = DateRangeBaseSchema.refine(
  (data: any) => {
    if (data.startDate && data.endDate) {
      return new Date(data.startDate) <= new Date(data.endDate);
    }
    return true;
  },
  {
    message: "Start date must be before end date",
    path: ["endDate"],
  }
);

// User schemas
export const UserIdSchema = z.object({
  userId: z.string().cuid(),
});

export const TelegramIdSchema = z.object({
  telegramId: z.string().min(1),
});

export const UserUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  username: z.string().min(1).max(30).optional(),
});

// Wallet schemas
export const CurrencySchema = z.enum(['USD', 'NON']);

export const WalletBalanceSchema = z.object({
  currency: CurrencySchema,
  balance: z.number().min(0),
});

export const WalletUpdateSchema = z.object({
  currency: CurrencySchema,
  amount: z.number().min(0),
  reason: z.string().min(1).max(200),
});

// Mining slot schemas
export const SlotTypeSchema = z.enum(['standard', 'premium', 'vip']);

export const SlotPurchaseSchema = z.object({
  amount: z.number().positive().max(1000000),
  currency: CurrencySchema,
  type: SlotTypeSchema.default('standard'),
}).refine(
  (data: any) => {
    if (data.currency === 'USD' && data.amount < 1) {
      return false;
    }
    if (data.currency === 'NON' && data.amount < 10) {
      return false;
    }
    return true;
  },
  {
    message: "Minimum purchase amount: $1 USD or 10 NON",
    path: ["amount"],
  }
);

export const SlotClaimSchema = z.object({
  slotId: z.string().cuid(),
});

export const SlotExtendSchema = z.object({
  slotId: z.string().cuid(),
  amount: z.number().positive().max(1000000),
  currency: CurrencySchema,
});

// Transaction schemas
export const TransactionTypeSchema = z.enum([
  'DEPOSIT',
  'WITHDRAWAL',
  'SLOT_PURCHASE',
  'SLOT_CLAIM',
  'REFERRAL_BONUS',
  'TASK_REWARD',
  'LOTTERY_WIN',
  'SWAP',
  'ADMIN_ADJUSTMENT',
  'SYSTEM_BONUS',
]);

export const TransactionStatusSchema = z.enum([
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'REJECTED',
]);

export const TransactionFilterSchema = z.object({
  type: TransactionTypeSchema.optional(),
  status: TransactionStatusSchema.optional(),
  currency: CurrencySchema.optional(),
  ...DateRangeBaseSchema.shape,
  ...PaginationSchema.shape,
});

// Withdrawal schemas
export const WithdrawalTypeSchema = z.enum([
  'FIRST_WITHDRAWAL',
  'REGULAR_WITHDRAWAL',
  'EMERGENCY_WITHDRAWAL',
]);

export const WithdrawalRequestSchema = z.object({
  amount: z.number().positive().max(1000000),
  currency: CurrencySchema,
  type: WithdrawalTypeSchema.default('REGULAR_WITHDRAWAL'),
  reason: z.string().max(500).optional(),
}).refine(
  (data: any) => {
    if (data.currency === 'USD' && data.amount < 10) {
      return false;
    }
    if (data.currency === 'NON' && data.amount < 100) {
      return false;
    }
    return true;
  },
  {
    message: "Minimum withdrawal amount: $10 USD or 100 NON",
    path: ["amount"],
  }
);

export const WithdrawalApprovalSchema = z.object({
  withdrawalId: z.string().cuid(),
  approved: z.boolean(),
  reason: z.string().max(500).optional(),
});

// Lottery schemas
export const LotteryNumberSchema = z.string().regex(/^\d{1,2}$/).transform(Number);

export const LotteryPurchaseSchema = z.object({
  numbers: z.array(LotteryNumberSchema).length(6),
  amount: z.number().positive().max(10000),
}).refine(
  (data: any) => {
    const uniqueNumbers = new Set(data.numbers);
    return uniqueNumbers.size === 6;
  },
  {
    message: "All lottery numbers must be unique",
    path: ["numbers"],
  }
).refine(
  (data: any) => {
    return data.numbers.every((num: any) => num >= 1 && num <= 49);
  },
  {
    message: "Lottery numbers must be between 1 and 49",
    path: ["numbers"],
  }
);

export const LotteryDrawSchema = z.object({
  lotteryId: z.string().cuid(),
  winningNumbers: z.array(LotteryNumberSchema).length(6),
});

// Swap schemas
export const SwapRequestSchema = z.object({
  fromCurrency: CurrencySchema,
  toCurrency: CurrencySchema,
  amount: z.number().positive().max(1000000),
}).refine(
  (data: any) => data.fromCurrency !== data.toCurrency,
  {
    message: "From and to currencies must be different",
    path: ["toCurrency"],
  }
);

// Task schemas
export const TaskCompletionSchema = z.object({
  taskId: z.string().cuid(),
});

// Referral schemas
export const ReferralCodeSchema = z.object({
  referralCode: z.string().min(6).max(20),
});

export const ReferralStatsSchema = z.object({
  ...DateRangeBaseSchema.shape,
  ...PaginationSchema.shape,
});

// Exchange rate schemas
export const ExchangeRateUpdateSchema = z.object({
  rate: z.number().positive().max(1000),
  isActive: z.boolean().default(true),
});

// Notification schemas
export const NotificationCreateSchema = z.object({
  userId: z.string().cuid(),
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(1000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  scheduledFor: z.string().datetime().optional(),
});

export const NotificationUpdateSchema = z.object({
  notificationId: z.string().cuid(),
  isRead: z.boolean().optional(),
});

// Admin schemas
export const AdminUserUpdateSchema = z.object({
  userId: z.string().cuid(),
  role: z.enum(['USER', 'ADMIN', 'MANAGER', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
  isFrozen: z.boolean().optional(),
  frozenReason: z.string().max(500).optional(),
  permissions: z.array(z.string()).optional(),
});

export const AdminBalanceAdjustmentSchema = z.object({
  userId: z.string().cuid(),
  currency: CurrencySchema,
  amount: z.number(),
  reason: z.string().min(1).max(200),
  type: z.enum(['ADD', 'SUBTRACT', 'SET']),
});

// Activity log schemas
export const ActivityLogFilterSchema = z.object({
  type: z.string().optional(),
  userId: z.string().cuid().optional(),
  ...DateRangeBaseSchema.shape,
  ...PaginationSchema.shape,
});

// Search schemas
export const SearchSchema = z.object({
  query: z.string().min(1).max(100),
  type: z.enum(['users', 'transactions', 'slots', 'lottery']).optional(),
  ...PaginationSchema.shape,
});

// Health check schemas
export const HealthCheckSchema = z.object({
  includeDetails: z.boolean().default(false),
});

// Performance monitoring schemas
export const PerformanceMetricsSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  metrics: z.array(z.enum(['memory', 'cpu', 'database', 'api', 'cache'])),
});

// Export all schemas
export const Schemas = {
  // Base
  Pagination: PaginationSchema,
  DateRange: DateRangeSchema,

  // User
  UserId: UserIdSchema,
  TelegramId: TelegramIdSchema,
  UserUpdate: UserUpdateSchema,

  // Wallet
  Currency: CurrencySchema,
  WalletBalance: WalletBalanceSchema,
  WalletUpdate: WalletUpdateSchema,

  // Mining Slot
  SlotType: SlotTypeSchema,
  SlotPurchase: SlotPurchaseSchema,
  SlotClaim: SlotClaimSchema,
  SlotExtend: SlotExtendSchema,

  // Transaction
  TransactionType: TransactionTypeSchema,
  TransactionStatus: TransactionStatusSchema,
  TransactionFilter: TransactionFilterSchema,

  // Withdrawal
  WithdrawalType: WithdrawalTypeSchema,
  WithdrawalRequest: WithdrawalRequestSchema,
  WithdrawalApproval: WithdrawalApprovalSchema,

  // Lottery
  LotteryNumber: LotteryNumberSchema,
  LotteryPurchase: LotteryPurchaseSchema,
  LotteryDraw: LotteryDrawSchema,

  // Swap
  SwapRequest: SwapRequestSchema,

  // Task
  TaskCompletion: TaskCompletionSchema,

  // Referral
  ReferralCode: ReferralCodeSchema,
  ReferralStats: ReferralStatsSchema,

  // Exchange Rate
  ExchangeRateUpdate: ExchangeRateUpdateSchema,

  // Notification
  NotificationCreate: NotificationCreateSchema,
  NotificationUpdate: NotificationUpdateSchema,

  // Admin
  AdminUserUpdate: AdminUserUpdateSchema,
  AdminBalanceAdjustment: AdminBalanceAdjustmentSchema,

  // Activity Log
  ActivityLogFilter: ActivityLogFilterSchema,

  // Search
  Search: SearchSchema,

  // System
  HealthCheck: HealthCheckSchema,
  PerformanceMetrics: PerformanceMetricsSchema,
} as const;

// Type exports for TypeScript
export type PaginationInput = z.infer<typeof PaginationSchema>;
export type DateRangeInput = z.infer<typeof DateRangeSchema>;
export type UserIdInput = z.infer<typeof UserIdSchema>;
export type TelegramIdInput = z.infer<typeof TelegramIdSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type WalletBalanceInput = z.infer<typeof WalletBalanceSchema>;
export type WalletUpdateInput = z.infer<typeof WalletUpdateSchema>;
export type SlotPurchaseInput = z.infer<typeof SlotPurchaseSchema>;
export type SlotClaimInput = z.infer<typeof SlotClaimSchema>;
export type SlotExtendInput = z.infer<typeof SlotExtendSchema>;
export type TransactionFilterInput = z.infer<typeof TransactionFilterSchema>;
export type WithdrawalRequestInput = z.infer<typeof WithdrawalRequestSchema>;
export type WithdrawalApprovalInput = z.infer<typeof WithdrawalApprovalSchema>;
export type LotteryPurchaseInput = z.infer<typeof LotteryPurchaseSchema>;
export type LotteryDrawInput = z.infer<typeof LotteryDrawSchema>;
export type SwapRequestInput = z.infer<typeof SwapRequestSchema>;
export type TaskCompletionInput = z.infer<typeof TaskCompletionSchema>;
export type ReferralCodeInput = z.infer<typeof ReferralCodeSchema>;
export type ReferralStatsInput = z.infer<typeof ReferralStatsSchema>;
export type ExchangeRateUpdateInput = z.infer<typeof ExchangeRateUpdateSchema>;
export type NotificationCreateInput = z.infer<typeof NotificationCreateSchema>;
export type NotificationUpdateInput = z.infer<typeof NotificationUpdateSchema>;
export type AdminUserUpdateInput = z.infer<typeof AdminUserUpdateSchema>;
export type AdminBalanceAdjustmentInput = z.infer<typeof AdminBalanceAdjustmentSchema>;
export type ActivityLogFilterInput = z.infer<typeof ActivityLogFilterSchema>;
export type SearchInput = z.infer<typeof SearchSchema>;
export type HealthCheckInput = z.infer<typeof HealthCheckSchema>;
export type PerformanceMetricsInput = z.infer<typeof PerformanceMetricsSchema>;
