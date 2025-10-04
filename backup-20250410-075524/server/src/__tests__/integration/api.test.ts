import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { depositFunds, withdrawFunds, claimEarnings } from '../../controllers/walletControllerImproved.js';
import { getLotteryStatus, buyLotteryTicket } from '../../controllers/lotteryControllerImproved.js';

// Mock Prisma for integration tests
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    update: vi.fn(),
    count: vi.fn(),
  },
  wallet: {
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  miningSlot: {
    update: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
    count: vi.fn(),
  },
  lottery: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  lotteryTicket: {
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../../prisma', () => ({
  default: mockPrisma,
}));

// Mock helpers
vi.mock('../../utils/helpers', () => ({
  isUserEligible: vi.fn().mockResolvedValue(true),
  hasReferredInLast7Days: vi.fn().mockResolvedValue(true),
  isUserSuspicious: vi.fn().mockResolvedValue(false),
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
  REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED: false,
  RANKED_REFERRAL_COMMISSIONS_L1: 0.15,
  RANKED_REFERRAL_COMMISSIONS_L2: 0.08,
  RANKED_REFERRAL_COMMISSIONS_L3: 0.03,
  LOTTERY_TICKET_COST: 10,
  LOTTERY_DRAW_INTERVAL_HOURS: 24,
  LOTTERY_JACKPOT_SEED: 1000,
  LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE: 0.8,
  LOTTERY_PRIZE_DISTRIBUTION: {
    MATCH_6: 0.6,
    MATCH_5: 0.25,
    MATCH_4: 0.15,
  },
}));

describe('API Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    
    // Wallet routes
    app.post('/api/user/:telegramId/deposit', depositFunds);
    app.post('/api/user/:telegramId/withdraw', withdrawFunds);
    app.post('/api/user/:telegramId/claim', claimEarnings);
    
    // Lottery routes
    app.get('/api/lottery/status', getLotteryStatus);
    app.post('/api/lottery/:telegramId/buy', buyLotteryTicket);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wallet API Integration', () => {
    describe('POST /api/user/:telegramId/deposit', () => {
      it('should process deposit successfully', async () => {
        const mockUser = {
          id: 'user1',
          telegramId: '123456789',
          firstName: 'Test',
          username: 'testuser',
          wallets: [{ id: 'wallet1', currency: 'CFM', balance: 100 }],
          totalInvested: 0,
          lastDepositAt: null,
          referredById: null,
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.$transaction.mockImplementation((callback) => 
          callback({
            wallet: { update: vi.fn() },
            user: { update: vi.fn() },
            activityLog: { create: vi.fn() },
          })
        );

        const response = await request(app)
          .post('/api/user/123456789/deposit')
          .send({ amount: 100 })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: null,
          message: 'Deposit successful'
        });
      });

      it('should reject invalid amount', async () => {
        const response = await request(app)
          .post('/api/user/123456789/deposit')
          .send({ amount: -100 })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Invalid deposit amount'
        });
      });

      it('should reject invalid telegram ID', async () => {
        const response = await request(app)
          .post('/api/user/invalid/deposit')
          .send({ amount: 100 })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Invalid telegram ID'
        });
      });
    });

    describe('POST /api/user/:telegramId/withdraw', () => {
      it('should process withdrawal successfully', async () => {
        const mockUser = {
          id: 'user1',
          telegramId: '123456789',
          wallets: [{ id: 'wallet1', currency: 'CFM', balance: 1000 }],
          miningSlots: [{ id: 'slot1', isActive: true }],
          lastReferralZeroPenaltyAppliedAt: null,
          lastSuspiciousPenaltyAppliedAt: null,
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.activityLog.count.mockResolvedValue(0);
        mockPrisma.$transaction.mockImplementation((callback) => 
          callback({
            wallet: { update: vi.fn() },
            activityLog: { create: vi.fn() },
            user: { update: vi.fn() },
          })
        );

        const response = await request(app)
          .post('/api/user/123456789/withdraw')
          .send({ 
            amount: 100, 
            address: 'TTestAddress1234567890123456789012345' 
          })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: { amountToReceive: 95 },
          message: 'Withdrawal of 95.00 CFM initiated.'
        });
      });

      it('should reject invalid address', async () => {
        const response = await request(app)
          .post('/api/user/123456789/withdraw')
          .send({ 
            amount: 100, 
            address: 'invalid-address' 
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Invalid CFM TRC20 address format'
        });
      });

      it('should reject insufficient balance', async () => {
        const mockUser = {
          id: 'user1',
          telegramId: '123456789',
          wallets: [{ id: 'wallet1', currency: 'CFM', balance: 50 }],
          miningSlots: [],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/user/123456789/withdraw')
          .send({ 
            amount: 100, 
            address: 'TTestAddress1234567890123456789012345' 
          })
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Insufficient balance'
        });
      });
    });

    describe('POST /api/user/:telegramId/claim', () => {
      it('should claim earnings successfully', async () => {
        const mockUser = {
          id: 'user1',
          telegramId: '123456789',
          wallets: [{ id: 'wallet1', currency: 'CFM', balance: 100 }],
          miningSlots: [{
            id: 'slot1',
            principal: 1000,
            effectiveWeeklyRate: 0.05,
            lastAccruedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
          }],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.$transaction.mockImplementation((callback) => 
          callback({
            wallet: { update: vi.fn() },
            miningSlot: { update: vi.fn() },
            activityLog: { create: vi.fn() },
          })
        );

        const response = await request(app)
          .post('/api/user/123456789/claim')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.claimedAmount).toBeGreaterThan(0);
        expect(response.body.message).toBe('Earnings claimed successfully!');
      });

      it('should handle no earnings to claim', async () => {
        const mockUser = {
          id: 'user1',
          telegramId: '123456789',
          wallets: [{ id: 'wallet1', currency: 'CFM', balance: 100 }],
          miningSlots: [{
            id: 'slot1',
            principal: 1000,
            effectiveWeeklyRate: 0.05,
            lastAccruedAt: new Date(), // Just now
          }],
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);

        const response = await request(app)
          .post('/api/user/123456789/claim')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: { claimedAmount: 0 },
          message: 'No significant earnings to claim.'
        });
      });
    });
  });

  describe('Lottery API Integration', () => {
    describe('GET /api/lottery/status', () => {
      it('should return lottery status', async () => {
        const mockLottery = {
          id: 'lottery1',
          isDrawn: false,
          jackpot: 1000,
          drawDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        };

        mockPrisma.lottery.findFirst.mockResolvedValue(mockLottery);

        const response = await request(app)
          .get('/api/lottery/status')
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: mockLottery
        });
      });
    });

    describe('POST /api/lottery/:telegramId/buy', () => {
      it('should buy lottery ticket successfully', async () => {
        const mockUser = {
          id: 'user1',
          telegramId: '123456789',
          wallets: [{ id: 'wallet1', currency: 'CFM', balance: 100 }],
        };

        const mockLottery = {
          id: 'lottery1',
          isDrawn: false,
          jackpot: 1000,
          drawDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        };

        mockPrisma.user.findUnique.mockResolvedValue(mockUser);
        mockPrisma.lottery.findFirst.mockResolvedValue(mockLottery);
        mockPrisma.$transaction.mockImplementation((callback) => 
          callback({
            wallet: { update: vi.fn() },
            lottery: { update: vi.fn() },
            lotteryTicket: { create: vi.fn() },
            activityLog: { create: vi.fn() },
          })
        );

        const response = await request(app)
          .post('/api/lottery/123456789/buy')
          .send({ numbers: [1, 2, 3, 4, 5, 6] })
          .expect(200);

        expect(response.body).toEqual({
          success: true,
          data: null,
          message: 'Lottery ticket purchased successfully!'
        });
      });

      it('should reject invalid numbers', async () => {
        const response = await request(app)
          .post('/api/lottery/123456789/buy')
          .send({ numbers: [1, 2, 3] }) // Only 3 numbers
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'You must select exactly 6 numbers.'
        });
      });

      it('should reject duplicate numbers', async () => {
        const response = await request(app)
          .post('/api/lottery/123456789/buy')
          .send({ numbers: [1, 2, 3, 4, 5, 5] }) // Duplicate 5
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'Numbers must be unique.'
        });
      });

      it('should reject numbers outside range', async () => {
        const response = await request(app)
          .post('/api/lottery/123456789/buy')
          .send({ numbers: [1, 2, 3, 4, 5, 50] }) // 50 is outside 1-49 range
          .expect(400);

        expect(response.body).toEqual({
          success: false,
          error: 'All numbers must be integers between 1 and 49.'
        });
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle database connection errors', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/user/123456789/deposit')
        .send({ amount: 100 })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });

    it('should handle transaction failures', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'CFM', balance: 100 }],
        totalInvested: 0,
        lastDepositAt: null,
        referredById: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.$transaction.mockRejectedValue(new Error('Transaction failed'));

      const response = await request(app)
        .post('/api/user/123456789/deposit')
        .send({ amount: 100 })
        .expect(500);

      expect(response.body).toEqual({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('Rate Limiting Integration', () => {
    it('should handle multiple rapid requests', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'CFM', balance: 1000 }],
        miningSlots: [{ id: 'slot1', isActive: true }],
        lastReferralZeroPenaltyAppliedAt: null,
        lastSuspiciousPenaltyAppliedAt: null,
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.activityLog.count.mockResolvedValue(0);
      mockPrisma.$transaction.mockImplementation((callback) => 
        callback({
          wallet: { update: vi.fn() },
          activityLog: { create: vi.fn() },
          user: { update: vi.fn() },
        })
      );

      // Make multiple requests rapidly
      const requests = Array(5).fill(null).map(() => 
        request(app)
          .post('/api/user/123456789/withdraw')
          .send({ 
            amount: 100, 
            address: 'TTestAddress1234567890123456789012345' 
          })
      );

      const responses = await Promise.all(requests);
      
      // All should succeed as we're not implementing actual rate limiting in this test
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});
