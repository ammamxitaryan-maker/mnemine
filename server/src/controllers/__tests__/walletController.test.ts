import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { depositFunds, withdrawFunds, claimEarnings } from '../walletControllerImproved.js';
import prisma from '../../prisma.js';

// Mock Prisma
vi.mock('../../prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    wallet: {
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock helpers
vi.mock('../../utils/helpers', () => ({
  isUserEligible: vi.fn(),
  hasReferredInLast7Days: vi.fn(),
  isUserSuspicious: vi.fn(),
}));

// Mock constants
vi.mock('../../constants', () => ({
  REFERRAL_COMMISSIONS: [0.1, 0.05, 0.02],
  RESERVE_FUND_PERCENTAGE: 0.1,
  MINIMUM_WITHDRAWAL_REGULAR: 10,
  WITHDRAWAL_FEE_PERCENTAGE: 0.05,
  WITHDRAWAL_REFERRAL_REQUIREMENT: 3,
  WITHDRAWAL_SLOT_REQUIREMENT: 1,
  REFERRAL_DEPOSIT_BONUS: 50,
  MINIMUM_WITHDRAWAL_FIRST_100: 5,
  FIRST_100_WITHDRAWALS_LIMIT: 100,
  WITHDRAWAL_DAILY_LIMIT: 1,
  WITHDRAWAL_MIN_BALANCE_REQUIREMENT: 20,
  REFERRAL_INCOME_CAP_THRESHOLD: 1000,
  REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED: true,
  RANKED_REFERRAL_COMMISSIONS_L1: 0.15,
  RANKED_REFERRAL_COMMISSIONS_L2: 0.08,
  RANKED_REFERRAL_COMMISSIONS_L3: 0.03,
}));

describe('Wallet Controller Improved', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      params: { telegramId: '123456789' },
      body: {},
      ip: '127.0.0.1',
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('depositFunds', () => {
    it('should successfully process a valid deposit', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        firstName: 'Test',
        username: 'testuser',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 100 }],
        totalInvested: 0,
        lastDepositAt: null,
        referredById: null,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.$transaction as any).mockImplementation((callback) => callback({
        wallet: { update: vi.fn() },
        user: { update: vi.fn() },
        activityLog: { create: vi.fn() },
      }));

      mockReq.body = { amount: 100 };

      await depositFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Deposit successful'
      });
    });

    it('should reject invalid telegram ID', async () => {
      mockReq.params = { telegramId: 'invalid' };
      mockReq.body = { amount: 100 };

      await depositFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid telegram ID'
      });
    });

    it('should reject invalid amount', async () => {
      mockReq.body = { amount: -100 };

      await depositFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid deposit amount'
      });
    });

    it('should reject amount with too many decimal places', async () => {
      mockReq.body = { amount: 100.123 };

      await depositFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Amount cannot have more than 2 decimal places'
      });
    });

    it('should reject amount exceeding maximum', async () => {
      mockReq.body = { amount: 2000000 };

      await depositFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid deposit amount'
      });
    });

    it('should handle user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      mockReq.body = { amount: 100 };

      await depositFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should handle database transaction failure', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 100 }],
        totalInvested: 0,
        lastDepositAt: null,
        referredById: null,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.$transaction as any).mockRejectedValue(new Error('Database error'));

      mockReq.body = { amount: 100 };

      await depositFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('withdrawFunds', () => {
    it('should successfully process a valid withdrawal', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 1000 }],
        miningSlots: [{ id: 'slot1', isActive: true }],
        lastReferralZeroPenaltyAppliedAt: null,
        lastSuspiciousPenaltyAppliedAt: null,
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.activityLog.count as any).mockResolvedValue(0);
      (prisma.$transaction as any).mockImplementation((callback) => callback({
        wallet: { update: vi.fn() },
        activityLog: { create: vi.fn() },
        user: { update: vi.fn() },
      }));

      mockReq.body = { amount: 100, address: 'TTestAddress1234567890123456789012345' };

      await withdrawFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { amountToReceive: 95 },
        message: 'Withdrawal of 95.00 USD initiated.'
      });
    });

    it('should reject invalid address format', async () => {
      mockReq.body = { amount: 100, address: 'invalid-address' };

      await withdrawFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid USD TRC20 address format'
      });
    });

    it('should reject insufficient balance', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 50 }],
        miningSlots: [],
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      mockReq.body = { amount: 100, address: 'TTestAddress1234567890123456789012345' };

      await withdrawFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient balance'
      });
    });

    it('should reject withdrawal below minimum balance requirement', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 10 }],
        miningSlots: [],
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      mockReq.body = { amount: 100, address: 'TTestAddress1234567890123456789012345' };

      await withdrawFunds(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Minimum balance for withdrawal is 20.00 USD'
      });
    });
  });

  describe('claimEarnings', () => {
    it('should successfully claim earnings', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 100 }],
        miningSlots: [{
          id: 'slot1',
          principal: 1000,
          effectiveWeeklyRate: 0.05,
          lastAccruedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        }],
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.$transaction as any).mockImplementation((callback) => callback({
        wallet: { update: vi.fn() },
        miningSlot: { update: vi.fn() },
        activityLog: { create: vi.fn() },
      }));

      await claimEarnings(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { claimedAmount: expect.any(Number) },
        message: 'Earnings claimed successfully!'
      });
    });

    it('should handle no significant earnings', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 100 }],
        miningSlots: [{
          id: 'slot1',
          principal: 1000,
          effectiveWeeklyRate: 0.05,
          lastAccruedAt: new Date(), // Just now
        }],
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await claimEarnings(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { claimedAmount: 0 },
        message: 'No significant earnings to claim.'
      });
    });

    it('should handle user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await claimEarnings(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });
});

