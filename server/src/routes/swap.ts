import { Router } from 'express';
import { getExchangeRate, getSwapHistory, swapNONoNON, swapNONToUSD } from '../controllers/swapController.js';

const router = Router();

// GET /api/user/:telegramId/swap/rate
router.get('/:telegramId/swap/rate', getExchangeRate);

// POST /api/user/:telegramId/swap/USD-to-NON
router.post('/:telegramId/swap/USD-to-NON', swapNONoNON);

// POST /api/user/:telegramId/swap/NON-to-USD
router.post('/:telegramId/swap/NON-to-USD', swapNONToUSD);

// GET /api/user/:telegramId/swap/history
router.get('/:telegramId/swap/history', getSwapHistory);

export default router;

