import { Router } from 'express';
import { 
  getCurrentExchangeRate, 
  setExchangeRate, 
  getExchangeRateHistory,
  swapCFMToCFMT,
  getUserSwapHistory 
} from '../controllers/exchangeController.js';
import { authenticateUser, extractUserIdFromParams } from '../middleware-stubs.js';

const router = Router();

// Public routes
router.get('/rate', getCurrentExchangeRate);
router.get('/rate/history', getExchangeRateHistory);

// User routes - with authentication
router.post('/:telegramId/swap', authenticateUser, extractUserIdFromParams, swapCFMToCFMT);
router.get('/:telegramId/swap/history', authenticateUser, extractUserIdFromParams, getUserSwapHistory);

// Admin routes (will be protected by admin middleware)
router.post('/admin/rate', setExchangeRate);

export default router;
