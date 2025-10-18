import { Router } from 'express';
import {
  createUSDTPayment,
  getUSDTPaymentHistory,
  getUSDTPaymentStatus,
  handleUSDTWebhook,
  getUSDTConfig
} from '../controllers/usdtPaymentController.js';

const router = Router();

// USDT Payment routes
router.post('/create', createUSDTPayment);
router.post('/webhook', handleUSDTWebhook);
router.get('/status/:paymentId', getUSDTPaymentStatus);
router.get('/history/:telegramId', getUSDTPaymentHistory);
router.get('/config', getUSDTConfig);

export default router;
