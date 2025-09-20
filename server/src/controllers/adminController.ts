import { Request, Response } from 'express';
import prisma from '../prisma';
import { userSelect, userSelectForAdminList } from '../utils/dbSelects';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: userSelectForAdminList,
    });
    res.status(200).json(users);
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