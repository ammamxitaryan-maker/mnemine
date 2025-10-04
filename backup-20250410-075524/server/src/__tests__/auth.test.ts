import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../../routes/auth.js';

// Mock Prisma for auth tests
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  wallet: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  miningSlot: {
    create: vi.fn(),
  },
  activityLog: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
};

vi.mock('../../prisma', () => ({
  default: mockPrisma,
}));

// Mock helpers
vi.mock('../../utils/helpers', () => ({
  generateUniqueReferralCode: vi.fn().mockResolvedValue('TEST123'),
}));

// Mock constants
vi.mock('../../constants', () => ({
  WELCOME_BONUS_AMOUNT: 100,
  SLOT_WEEKLY_RATE: 0.05,
  REFERRAL_SIGNUP_BONUS: 50,
}));

// Mock userSelectWithoutMiningSlots
vi.mock('../../utils/dbSelects', () => ({
  userSelectWithoutMiningSlots: {
    id: true,
    telegramId: true,
    username: true,
    firstName: true,
    lastName: true,
    avatarUrl: true,
    role: true,
    referralCode: true,
    referredById: true,
    lastSeenAt: true,
    captchaValidated: true,
    wallets: {
      select: {
        id: true,
        currency: true,
        balance: true,
      },
    },
  },
}));

describe('Authentication Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /auth/validate - Automatic Login', () => {
    it('should automatically create new user when Telegram ID does not exist', async () => {
      const mockNewUser = {
        id: 'user1',
        telegramId: '123456789',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        role: 'USER',
        referralCode: 'TEST123',
        referredById: null,
        lastSeenAt: new Date(),
        captchaValidated: true,
        wallets: [{ id: 'wallet1', currency: 'CFM', balance: 100 }],
      };

      // Mock user not found initially
      mockPrisma.user.findUnique.mockResolvedValue(null);
      
      // Mock transaction for user creation
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const tx = {
          user: {
            create: vi.fn().mockResolvedValue(mockNewUser),
          },
          wallet: {
            create: vi.fn().mockResolvedValue({ id: 'wallet1', currency: 'CFM', balance: 100 }),
          },
          miningSlot: {
            create: vi.fn().mockResolvedValue({ id: 'slot1' }),
          },
          activityLog: {
            create: vi.fn().mockResolvedValue({ id: 'log1' }),
          },
        };
        return await callback(tx);
      });

      // Mock final user query
      mockPrisma.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(mockNewUser);

      const response = await request(app)
        .post('/auth/validate')
        .send({
          initData: null, // No initData - triggers automatic login
        })
        .expect(200);

      expect(response.body.message).toBe('Automatic login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.telegramId).toBe('123456789');
    });

    it('should automatically login existing user when Telegram ID exists', async () => {
      const mockExistingUser = {
        id: 'user1',
        telegramId: '123456789',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
        avatarUrl: null,
        role: 'USER',
        referralCode: 'TEST123',
        referredById: null,
        lastSeenAt: new Date(),
        captchaValidated: true,
        wallets: [{ id: 'wallet1', currency: 'CFM', balance: 100 }],
      };

      // Mock user found
      mockPrisma.user.findUnique.mockResolvedValue(mockExistingUser);
      mockPrisma.user.update.mockResolvedValue(mockExistingUser);

      const response = await request(app)
        .post('/auth/validate')
        .send({
          initData: null, // No initData - triggers automatic login
        })
        .expect(200);

      expect(response.body.message).toBe('Automatic login successful');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.telegramId).toBe('123456789');
    });

    it('should handle Telegram WebApp data for automatic login', async () => {
      const mockUser = {
        id: 'user1',
        telegramId: '987654321',
        username: 'telegramuser',
        firstName: 'Telegram',
        lastName: 'User',
        avatarUrl: null,
        role: 'USER',
        referralCode: 'TEST123',
        referredById: null,
        lastSeenAt: new Date(),
        captchaValidated: true,
        wallets: [{ id: 'wallet1', currency: 'CFM', balance: 100 }],
      };

      // Mock user found
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/auth/validate')
        .set('x-telegram-init-data', 'user=%7B%22id%22%3A987654321%2C%22first_name%22%3A%22Telegram%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22telegramuser%22%7D&auth_date=1234567890&hash=test_hash')
        .send({
          initData: null, // No initData in body - should use header data
        })
        .expect(200);

      expect(response.body.message).toBe('Automatic login successful');
      expect(response.body.user).toBeDefined();
    });

    it('should handle authentication errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/auth/validate')
        .send({
          initData: null,
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /auth/status', () => {
    it('should return authentication service status', async () => {
      const response = await request(app)
        .get('/auth/status')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.message).toBe('Authentication service is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});
