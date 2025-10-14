import { Router } from 'express';
import { getExchangeRate, swapMNEoMNE, swapMNEToUSD, getSwapHistory } from '../controllers/swapController.js';

const router = Router();

// GET /api/user/:telegramId/swap/rate
router.get('/:telegramId/swap/rate', getExchangeRate);

// POST /api/user/:telegramId/swap/USD-to-MNE
router.post('/:telegramId/swap/USD-to-MNE', swapMNEoMNE);

// POST /api/user/:telegramId/swap/MNE-to-USD
router.post('/:telegramId/swap/MNE-to-USD', swapMNEToUSD);

// GET /api/user/:telegramId/swap/history
router.get('/:telegramId/swap/history', getSwapHistory);

export default router;

