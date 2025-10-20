import { Request, Response, Router } from 'express';
import prisma from '../prisma.js';

const router = Router();

// GET /api/leaderboard
router.get('/', async (req: Request, res: Response) => {
  try {
    const topWallets = await prisma.wallet.findMany({ where: { currency: 'USD' }, take: 10, orderBy: { balance: 'desc' }, include: { user: { select: { firstName: true, username: true } } } });
    const leaderboard = topWallets.map(w => ({ firstName: w.user.firstName || 'Anonymous', username: w.user.username, balance: w.balance }));
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard data:', error); // Added error logging
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
