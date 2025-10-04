import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { getUserProfile, updateUserProfile } from '../controllers/userController.js';
import { prisma } from '../prisma.js';

// Mock Prisma
vi.mock('../prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock ResponseHelper
vi.mock('../utils/responseHelpers', () => ({
  ResponseHelper: {
    success: vi.fn((res, data) => res.status(200).json({ success: true, data })),
    badRequest: vi.fn((res, message) => res.status(400).json({ success: false, error: message })),
    notFound: vi.fn((res, message) => res.status(404).json({ success: false, error: message })),
    internalError: vi.fn((res, message) => res.status(500).json({ success: false, error: message })),
  },
}));

describe('User Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: vi.Mock;

  beforeEach(() => {
    mockReq = {
      params: { telegramId: '123456789' },
      body: {},
    };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
    vi.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('should get user profile successfully', async () => {
      const mockUser = {
        id: '1',
        telegramId: '123456789',
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser',
        balance: 1000,
        totalInvested: 5000,
        createdAt: new Date(),
        lastSeenAt: new Date(),
      };

      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      await getUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { telegramId: '123456789' },
        include: {
          wallets: true,
          miningSlots: true,
          referrals: true,
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle user not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      await getUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle database errors', async () => {
      const dbError = new Error('Database connection failed');
      (prisma.user.findUnique as any).mockRejectedValue(dbError);

      await getUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should handle missing telegramId parameter', async () => {
      mockReq.params = {};

      await getUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('updateUserProfile', () => {
    beforeEach(() => {
      mockReq.body = {
        firstName: 'Updated',
        lastName: 'Name',
        username: 'updateduser',
      };
    });

    it('should update user profile successfully', async () => {
      const mockUpdatedUser = {
        id: '1',
        telegramId: '123456789',
        firstName: 'Updated',
        lastName: 'Name',
        username: 'updateduser',
      };

      (prisma.user.update as any).mockResolvedValue(mockUpdatedUser);

      await updateUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: '123456789' },
        data: {
          firstName: 'Updated',
          lastName: 'Name',
          username: 'updateduser',
        },
      });
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle user not found during update', async () => {
      (prisma.user.update as any).mockResolvedValue(null);

      await updateUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should handle database errors during update', async () => {
      const dbError = new Error('Database update failed');
      (prisma.user.update as any).mockRejectedValue(dbError);

      await updateUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(dbError);
    });

    it('should validate required fields', async () => {
      mockReq.body = {};

      await updateUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should sanitize input data', async () => {
      mockReq.body = {
        firstName: '<script>alert("xss")</script>',
        lastName: 'Name',
        username: 'user<script>',
      };

      const mockUpdatedUser = {
        id: '1',
        telegramId: '123456789',
        firstName: 'alert("xss")',
        lastName: 'Name',
        username: 'user',
      };

      (prisma.user.update as any).mockResolvedValue(mockUpdatedUser);

      await updateUserProfile(mockReq as Request, mockRes as Response, mockNext);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { telegramId: '123456789' },
        data: {
          firstName: 'alert("xss")',
          lastName: 'Name',
          username: 'user',
        },
      });
    });
  });
});
