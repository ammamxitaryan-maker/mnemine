import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Request, Response } from 'express';
import { 
  getLotteryStatus, 
  buyLotteryTicket, 
  getUserLotteryTickets, 
  getLastDrawResults, 
  getLotteryHistory 
} from '../lotteryControllerImproved.js';
import prisma from '../../prisma.js';

// Mock Prisma
vi.mock('../../prisma', () => ({
  default: {
    lottery: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
    lotteryTicket: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    wallet: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    activityLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock constants
vi.mock('../../constants', () => ({
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

describe('Lottery Controller Improved', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: any;

  beforeEach(() => {
    mockReq = {
      params: { telegramId: '123456789' },
      body: {},
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

  describe('getLotteryStatus', () => {
    it('should return current lottery status', async () => {
      const mockLottery = {
        id: 'lottery1',
        isDrawn: false,
        jackpot: 1000,
        drawDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        createdAt: new Date(),
      };

      (prisma.lottery.findFirst as any).mockResolvedValue(null); // No overdue lottery
      (prisma.lottery.findFirst as any).mockResolvedValueOnce(mockLottery); // Current lottery

      await getLotteryStatus(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockLottery
      });
    });

    it('should handle overdue lottery and perform draw', async () => {
      const overdueLottery = {
        id: 'overdue1',
        isDrawn: false,
        drawDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      };

      const currentLottery = {
        id: 'current1',
        isDrawn: false,
        jackpot: 1000,
        drawDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      (prisma.lottery.findFirst as any)
        .mockResolvedValueOnce(overdueLottery) // Overdue lottery
        .mockResolvedValueOnce(currentLottery); // Current lottery

      (prisma.$transaction as any).mockResolvedValue({ success: true });

      await getLotteryStatus(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: currentLottery
      });
    });

    it('should handle database error', async () => {
      (prisma.lottery.findFirst as any).mockRejectedValue(new Error('Database error'));

      await getLotteryStatus(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error'
      });
    });
  });

  describe('buyLotteryTicket', () => {
    it('should successfully buy a lottery ticket', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 100 }],
      };

      const mockLottery = {
        id: 'lottery1',
        isDrawn: false,
        jackpot: 1000,
        drawDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.lottery.findFirst as any).mockResolvedValue(mockLottery);
      (prisma.$transaction as any).mockResolvedValue({ success: true });

      mockReq.body = { numbers: [1, 2, 3, 4, 5, 6] };

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: 'Lottery ticket purchased successfully!'
      });
    });

    it('should reject invalid telegram ID', async () => {
      mockReq.params = { telegramId: 'invalid' };
      mockReq.body = { numbers: [1, 2, 3, 4, 5, 6] };

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Invalid telegram ID'
      });
    });

    it('should reject invalid numbers array', async () => {
      mockReq.body = { numbers: [1, 2, 3] }; // Only 3 numbers

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'You must select exactly 6 numbers.'
      });
    });

    it('should reject numbers outside valid range', async () => {
      mockReq.body = { numbers: [1, 2, 3, 4, 5, 50] }; // 50 is outside 1-49 range

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'All numbers must be integers between 1 and 49.'
      });
    });

    it('should reject duplicate numbers', async () => {
      mockReq.body = { numbers: [1, 2, 3, 4, 5, 5] }; // Duplicate 5

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Numbers must be unique.'
      });
    });

    it('should reject non-integer numbers', async () => {
      mockReq.body = { numbers: [1, 2, 3, 4, 5, 6.5] }; // 6.5 is not an integer

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'All numbers must be integers between 1 and 49.'
      });
    });

    it('should handle user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      mockReq.body = { numbers: [1, 2, 3, 4, 5, 6] };

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });

    it('should handle insufficient funds', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'USD', balance: 5 }], // Less than ticket cost
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      mockReq.body = { numbers: [1, 2, 3, 4, 5, 6] };

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient funds'
      });
    });

    it('should handle missing USD wallet', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '123456789',
        wallets: [{ id: 'wallet1', currency: 'BTC', balance: 100 }], // No USD wallet
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      mockReq.body = { numbers: [1, 2, 3, 4, 5, 6] };

      await buyLotteryTicket(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'USD wallet not found'
      });
    });
  });

  describe('getUserLotteryTickets', () => {
    it('should return user lottery tickets', async () => {
      const mockUser = { id: 'user1', telegramId: '123456789' };
      const mockLottery = { id: 'lottery1', isDrawn: false };
      const mockTickets = [
        { id: 'ticket1', numbers: '1,2,3,4,5,6', createdAt: new Date() },
        { id: 'ticket2', numbers: '7,8,9,10,11,12', createdAt: new Date() },
      ];

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.lottery.findFirst as any).mockResolvedValue(mockLottery);
      (prisma.lotteryTicket.findMany as any).mockResolvedValue(mockTickets);

      await getUserLotteryTickets(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockTickets
      });
    });

    it('should handle user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await getUserLotteryTickets(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });

  describe('getLastDrawResults', () => {
    it('should return last draw results', async () => {
      const mockLastDraw = {
        id: 'lottery1',
        isDrawn: true,
        winningNumbers: '1,2,3,4,5,6',
        drawDate: new Date(),
      };

      (prisma.lottery.findFirst as any).mockResolvedValue(mockLastDraw);

      await getLastDrawResults(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockLastDraw
      });
    });

    it('should handle no draws found', async () => {
      (prisma.lottery.findFirst as any).mockResolvedValue(null);

      await getLastDrawResults(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'No lottery draws found'
      });
    });
  });

  describe('getLotteryHistory', () => {
    it('should return lottery history for user', async () => {
      const mockUser = { id: 'user1', telegramId: '123456789' };
      const mockHistory = [
        {
          id: 'lottery1',
          isDrawn: true,
          winningNumbers: '1,2,3,4,5,6',
          drawDate: new Date(),
          tickets: [{ id: 'ticket1', numbers: '1,2,3,4,5,6' }],
        },
      ];

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (prisma.lottery.findMany as any).mockResolvedValue(mockHistory);

      await getLotteryHistory(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory
      });
    });

    it('should handle user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await getLotteryHistory(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'User not found'
      });
    });
  });
});

