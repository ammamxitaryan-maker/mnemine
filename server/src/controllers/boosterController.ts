import { Request, Response } from 'express';
import prisma from '../prisma';

// GET /api/boosters
export const getBoosters = async (req: Request, res: Response) => {
  try {
    const boosters = await prisma.booster.findMany({
      orderBy: { price: 'asc' },
    });
    res.status(200).json(boosters);
  } catch (error) {
    console.error('Error fetching boosters:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};