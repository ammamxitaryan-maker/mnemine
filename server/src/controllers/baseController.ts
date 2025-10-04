import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { ResponseHelper, asyncHandler } from '../utils/responseHelpers.js';
import { userSelect } from '../utils/dbSelects.js';

/**
 * BUG FIX: Fixed TypeScript error where referralCount field was being selected directly
 * from User model, but it doesn't exist in the Prisma schema. Instead, we now calculate
 * referral count from the referrals relation array length.
 */
export class BaseController {
  // Get user by Telegram ID
  static getUserByTelegramId = asyncHandler(async (req: Request, res: Response) => {
    const { telegramId } = req.params;

    if (!telegramId) {
      return ResponseHelper.badRequest(res, 'Telegram ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelect,
    });

    if (!user) {
      return ResponseHelper.notFound(res, 'User');
    }

    ResponseHelper.success(res, user);
  });

  // Get user without sensitive data
  static getUserPublic = asyncHandler(async (req: Request, res: Response) => {
    const { telegramId } = req.params;

    if (!telegramId) {
      return ResponseHelper.badRequest(res, 'Telegram ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        lastName: true,
        username: true,
        role: true,
        createdAt: true,
        totalInvested: true,
        referrals: {
          select: {
            id: true,
          },
        },
      },
    });

    // Calculate referral count from the relations
    const referralCount = user?.referrals?.length || 0;

    if (!user) {
      return ResponseHelper.notFound(res, 'User');
    }

    // Return user data with calculated referral count
    ResponseHelper.success(res, {
      ...user,
      referralCount,
    });
  });

  // Update user data
  static updateUser = asyncHandler(async (req: Request, res: Response) => {
    const { telegramId } = req.params;
    const updateData = req.body;

    if (!telegramId) {
      return ResponseHelper.badRequest(res, 'Telegram ID is required');
    }

    // Remove sensitive fields that shouldn't be updated directly
    const { id, telegramId: _, createdAt, ...allowedUpdates } = updateData;

    const user = await prisma.user.update({
      where: { telegramId },
      data: allowedUpdates,
      select: userSelect,
    });

    ResponseHelper.success(res, user, 'User updated successfully');
  });

  // Check if user exists
  static checkUserExists = asyncHandler(async (req: Request, res: Response) => {
    const { telegramId } = req.params;

    if (!telegramId) {
      return ResponseHelper.badRequest(res, 'Telegram ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true, telegramId: true },
    });

    ResponseHelper.success(res, { exists: !!user, user });
  });

  // Get user activity logs
  static getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const { telegramId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!telegramId) {
      return ResponseHelper.badRequest(res, 'Telegram ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });

    if (!user) {
      return ResponseHelper.notFound(res, 'User');
    }

    const activities = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        user: {
          select: {
            telegramId: true,
            firstName: true,
            username: true,
          },
        },
      },
    });

    ResponseHelper.success(res, activities);
  });

  // Generic pagination helper
  static paginate = async <T>(
    model: any,
    where: any = {},
    select: any = undefined,
    orderBy: any = { createdAt: 'desc' },
    page: number = 1,
    limit: number = 50
  ): Promise<{ data: T[]; total: number; page: number; totalPages: number }> => {
    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      model.findMany({
        where,
        select,
        orderBy,
        skip,
        take: limit,
      }),
      model.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  };

  // Generic search helper
  static search = async <T>(
    model: any,
    searchFields: string[],
    searchTerm: string,
    where: any = {},
    select: any = undefined,
    orderBy: any = { createdAt: 'desc' },
    limit: number = 50
  ): Promise<T[]> => {
    if (!searchTerm) {
      return model.findMany({
        where,
        select,
        orderBy,
        take: limit,
      });
    }

    const searchConditions = searchFields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as const,
      },
    }));

    return model.findMany({
      where: {
        ...where,
        OR: searchConditions,
      },
      select,
      orderBy,
      take: limit,
    });
  };
}
