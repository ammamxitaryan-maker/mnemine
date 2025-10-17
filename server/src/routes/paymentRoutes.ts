import { Router } from 'express';
import {
  addFundsToWallet,
  createPayment,
  getPaymentHistory,
  getPaymentStatus,
  handleWebhook,
  refundPayment
} from '../controllers/paymentController.js';

const router = Router();

// Payment routes
router.post('/create', createPayment);
router.post('/webhook', handleWebhook);
router.get('/status/:orderId', getPaymentStatus);
router.get('/history/:telegramId', getPaymentHistory);
router.post('/refund', refundPayment);
router.post('/add-funds', addFundsToWallet);

export default router;
