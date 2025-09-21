import { Router } from 'express';
import { 
  getCurrentExchangeRate, 
  setExchangeRate, 
  getExchangeRateHistory,
  swapCFMToCFMT,
  getUserSwapHistory 
} from '../controllers/exchangeController';

const router = Router();

// Public routes
router.get('/rate', getCurrentExchangeRate);
router.get('/rate/history', getExchangeRateHistory);

// User routes
router.post('/:telegramId/swap', swapCFMToCFMT);
router.get('/:telegramId/swap/history', getUserSwapHistory);

// Admin routes (will be protected by admin middleware)
router.post('/admin/rate', setExchangeRate);

export default router;
