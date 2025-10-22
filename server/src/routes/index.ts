import { Request, Response, Router } from 'express';
import adminRoutes from './admin.js'; // Import admin routes
import adminAnalyticsRoutes from './adminAnalytics.js';
import adminAuthRoutes from './adminAuth.js'; // Import admin auth routes
import adminBrowserRoutes from './adminBrowser.js'; // Import browser admin routes
import adminLotteryRoutes from './adminLottery.js'; // Import admin lottery routes
import adminMonitoringRoutes from './adminMonitoring.js';
import adminUsersAdvancedRoutes from './adminUsersAdvanced.js'; // Import admin monitoring routes
import authRoutes from './auth.js';
import enhancedStatsRoutes from './enhancedStats.js'; // Import enhanced stats routes
import exchangeRoutes from './exchange.js'; // Import exchange routes
import leaderboardRoutes from './leaderboard.js';
import loginRoutes from './login.js'; // Import login routes
import lotteryRoutes from './lottery.js';
import memoryMonitoringRoutes from './memoryMonitoring.js'; // Import memory monitoring routes
import notificationRoutes from './notifications.js'; // Import notification routes
import paymentRoutes from './paymentRoutes.js'; // Import payment routes
import performanceRoutes from './performance.js'; // Import performance routes
import processingRoutes from './processing.js'; // Import processing routes
import realTimeRoutes from './realTime.js'; // Import real-time routes
import swapRoutes from './swap.js'; // Import swap routes
import taskRoutes from './tasks.js';
import usdtPaymentRoutes from './usdtPaymentRoutes.js'; // Import USDT payment routes
import usdtWithdrawalRoutes from './usdtWithdrawalRoutes.js'; // Import USDT withdrawal routes
import userRoutes from './user.js';
import webSocketMonitoringRoutes from './webSocketMonitoring.js'; // Import WebSocket monitoring routes

const router = Router();

// Health check route
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Webhook endpoint for Telegram
router.post('/webhook', (req: Request, res: Response) => {
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
router.use('/admin', adminBrowserRoutes); // Add browser admin routes
router.use('/realtime', realTimeRoutes); // Add real-time routes
router.use('/exchange', exchangeRoutes); // Add exchange routes
router.use('/admin/lottery', adminLotteryRoutes); // Add admin lottery routes
router.use('/admin', adminMonitoringRoutes); // Add admin monitoring routes
router.use('/admin/analytics', adminAnalyticsRoutes); // Add admin analytics routes
router.use('/admin/users', adminUsersAdvancedRoutes); // Add admin users advanced routes
router.use('/user', swapRoutes); // Add swap routes
router.use('/user', notificationRoutes); // Add notification routes
router.use('/', processingRoutes); // Add processing routes
router.use('/api/admin/auth', adminAuthRoutes); // Add admin auth routes
router.use('/performance', performanceRoutes); // Add performance routes
router.use('/admin/memory', memoryMonitoringRoutes); // Add memory monitoring routes
router.use('/admin/websocket', webSocketMonitoringRoutes); // Add WebSocket monitoring routes
router.use('/payments', paymentRoutes); // Add payment routes
router.use('/payments/usdt', usdtPaymentRoutes); // Add USDT payment routes
router.use('/withdrawals', usdtWithdrawalRoutes); // Add USDT withdrawal routes
router.use('/stats', enhancedStatsRoutes); // Add enhanced stats routes

export default router;