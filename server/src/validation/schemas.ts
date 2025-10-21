import { z } from 'zod';

// User schemas
export const userCreateSchema = z.object({
  telegramId: z.string().min(1, 'Telegram ID is required'),
  firstName: z.string().min(1, 'First name is required'),
  username: z.string().optional(),
  referralCode: z.string().optional(),
});

export const userUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  username: z.string().optional(),
  isSuspicious: z.boolean().optional(),
  captchaValidated: z.boolean().optional(),
});

// Wallet schemas
export const walletCreateSchema = z.object({
  currency: z.enum(['USD', 'NON'], { required_error: 'Currency is required' }),
  balance: z.number().min(0, 'Balance must be non-negative').default(0),
});

export const walletUpdateSchema = z.object({
  balance: z.number().min(0, 'Balance must be non-negative'),
});

// Transaction schemas
export const transactionCreateSchema = z.object({
  type: z.enum(['DEPOSIT', 'WITHDRAWAL', 'MINING_EARNINGS', 'MINING_EARNINGS_ACCUMULATED', 'REFERRAL_BONUS', 'LOTTERY_WIN', 'ADMIN_ADJUSTMENT', 'REFUND'], {
    required_error: 'Transaction type is required'
  }),
  amount: z.number().min(0.001, 'Amount must be at least 0.001'),
  currency: z.enum(['USD', 'NON'], { required_error: 'Currency is required' }),
  description: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// Mining slot schemas
export const slotCreateSchema = z.object({
  principal: z.number().min(1, 'Principal must be at least 1'),
  startAt: z.date().optional(),
  expiresAt: z.date().optional(),
  effectiveWeeklyRate: z.number().min(0).max(1).optional(),
});

export const slotUpdateSchema = z.object({
  principal: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  lastAccruedAt: z.date().optional(),
});

// Referral schemas
export const referralCreateSchema = z.object({
  referrerId: z.string().min(1, 'Referrer ID is required'),
  referredId: z.string().min(1, 'Referred ID is required'),
});

// Lottery schemas
export const lotteryTicketCreateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  ticketNumber: z.string().min(1, 'Ticket number is required'),
  isAdminSelected: z.boolean().default(false),
});

// Task schemas
export const taskCreateSchema = z.object({
  taskId: z.string().min(1, 'Task ID is required'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  reward: z.number().min(0, 'Reward must be non-negative'),
  isActive: z.boolean().default(true),
});

// Admin schemas
export const adminUserUpdateSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  isSuspicious: z.boolean().optional(),
  captchaValidated: z.boolean().optional(),
  lastSuspiciousPenaltyAppliedAt: z.date().optional(),
});

export const adminStatsSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  timeframe: z.enum(['1d', '7d', '30d', '90d', '1y']).optional(),
});

// Exchange rate schemas
export const exchangeRateSchema = z.object({
  rate: z.number().min(0.001, 'Rate must be at least 0.001'),
  isActive: z.boolean().default(true),
  createdBy: z.string().min(1, 'Created by is required'),
});

// Notification schemas
export const notificationCreateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).default('INFO'),
  isRead: z.boolean().default(false),
  metadata: z.record(z.any()).optional(),
});

// Payment schemas
export const paymentCreateSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  amount: z.number().min(0.001, 'Amount must be at least 0.001'),
  currency: z.enum(['USD', 'NON'], { required_error: 'Currency is required' }),
  paymentMethod: z.enum(['USDT', 'CARD', 'BANK']).optional(),
  description: z.string().optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Validation helper functions
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ');
      throw new Error(`Validation error: ${errorMessage}`);
    }
    throw error;
  }
};

export const validateQuery = <T>(schema: z.ZodSchema<T>, query: any): T => {
  return validateSchema(schema, query);
};

export const validateBody = <T>(schema: z.ZodSchema<T>, body: any): T => {
  return validateSchema(schema, body);
};

export const validateParams = <T>(schema: z.ZodSchema<T>, params: any): T => {
  return validateSchema(schema, params);
};