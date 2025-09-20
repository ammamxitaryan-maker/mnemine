import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const { telegramId } = req.params;

  if (!telegramId) {
    return res.status(401).json({ error: 'Unauthorized: No user identifier provided.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { telegramId: String(telegramId) } });

    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Access denied.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
};