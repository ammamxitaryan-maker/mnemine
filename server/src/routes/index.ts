import { Router } from 'express';
import authRoutes from './auth';
import userRoutes from './user';
import taskRoutes from './tasks';
import leaderboardRoutes from './leaderboard';
import boosterRoutes from './boosters';
import lotteryRoutes from './lottery';
import adminRoutes from './admin'; // Import admin routes
import realTimeRoutes from './realTime'; // Import real-time routes

const router = Router();

// Health check route
router.get('/health', (req: any, res: any) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/boosters', boosterRoutes);
router.use('/lottery', lotteryRoutes);
router.use('/admin', adminRoutes); // Add admin routes
router.use('/realtime', realTimeRoutes); // Add real-time routes

export default router;