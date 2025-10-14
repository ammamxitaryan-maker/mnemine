import { Router } from 'express';
import { 
  getCurrentExchangeRate, 
  setExchangeRate, 
  getExchangeRateHistory,
  swapMNEoMNE,
  getUserSwapHistory 
} from '../controllers/exchangeController.js';
import { authenticateUser, extractUserIdFromParams } from '../middleware-stubs.js';

const router = Router();

// Public routes
router.get('/rate', getCurrentExchangeRate);
router.get('/rate/history', getExchangeRateHistory);

// User routes - with authentication
router.post('/:telegramId/swap', authenticateUser, extractUserIdFromParams, swapMNEoMNE);
router.get('/:telegramId/swap/history', authenticateUser, extractUserIdFromParams, getUserSwapHistory);

// Admin routes (will be protected by admin middleware)
// Note: This endpoint should be moved to admin routes for proper protection

export default router;

