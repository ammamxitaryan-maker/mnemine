import { Router } from 'express';
import authRoutes from './auth.js';
import loginRoutes from './login.js'; // Import login routes
import userRoutes from './user.js';
import taskRoutes from './tasks.js';
import leaderboardRoutes from './leaderboard.js';
import lotteryRoutes from './lottery.js';
import adminRoutes from './admin.js'; // Import admin routes
import realTimeRoutes from './realTime.js'; // Import real-time routes
import exchangeRoutes from './exchange.js'; // Import exchange routes
import adminLotteryRoutes from './adminLottery.js'; // Import admin lottery routes
import swapRoutes from './swap.js'; // Import swap routes
import notificationRoutes from './notifications.js'; // Import notification routes
import processingRoutes from './processing.js'; // Import processing routes
import adminAuthRoutes from './adminAuth.js'; // Import admin auth routes
import performanceRoutes from './performance.js'; // Import performance routes
import memoryMonitoringRoutes from './memoryMonitoring.js'; // Import memory monitoring routes

const router = Router();

// Health check route
router.get('/health', (req: any, res: any) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint for Telegram
router.post('/webhook', (req: any, res: any) => {
  console.log('[WEBHOOK] Received webhook request via API routes');
  console.log('[WEBHOOK] Method:', req.method);
  console.log('[WEBHOOK] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[WEBHOOK] Body:', JSON.stringify(req.body, null, 2));
  
  // Simple response for now
  res.status(200).json({ ok: true, message: 'Webhook received' });
});

router.use('/auth', authRoutes);
router.use('/', loginRoutes); // Add login routes at root level
router.use('/user', userRoutes);
router.use('/tasks', taskRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/lottery', lotteryRoutes);
router.use('/admin', adminRoutes); // Add admin routes
router.use('/realtime', realTimeRoutes); // Add real-time routes
router.use('/exchange', exchangeRoutes); // Add exchange routes
router.use('/admin/lottery', adminLotteryRoutes); // Add admin lottery routes
router.use('/user', swapRoutes); // Add swap routes
router.use('/user', notificationRoutes); // Add notification routes
router.use('/', processingRoutes); // Add processing routes
router.use('/admin', adminAuthRoutes); // Add admin auth routes
router.use('/performance', performanceRoutes); // Add performance routes
router.use('/admin/memory', memoryMonitoringRoutes); // Add memory monitoring routes

export default router;