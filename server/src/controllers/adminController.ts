import { Request, Response } from 'express';
import prisma from '../prisma';
import { userSelect, userSelectForAdminList } from '../utils/dbSelects';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const search = req.query.search as string;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder as 'asc' | 'desc' || 'desc';
    
    const skip = (page - 1) * limit;
    
    // Build where clause for search
    const where = search ? {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { username: { contains: search, mode: 'insensitive' as const } },
        { telegramId: { contains: search } }
      ]
    } : {};
    
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        select: userSelectForAdminList,
        skip,
        take: limit,
      }),
      prisma.user.count({ where })
    ]);
    
    res.status(200).json({
      users,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...userSelect, // Spread the common user fields
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 50 },
        referrals: { select: { id: true, firstName: true, username: true }, take: 10 },
        referredBy: { select: { id: true, firstName: true, username: true } },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error(`Error fetching details for user ${userId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};