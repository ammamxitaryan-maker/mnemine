import { Router } from 'express';
import { getExchangeRate, swapCfmToCfmt, swapCfmtToCfm, getSwapHistory } from '../controllers/swapController.js';

const router = Router();

// GET /api/user/:telegramId/swap/rate
router.get('/:telegramId/swap/rate', getExchangeRate);

// POST /api/user/:telegramId/swap/cfm-to-cfmt
router.post('/:telegramId/swap/cfm-to-cfmt', swapCfmToCfmt);

// POST /api/user/:telegramId/swap/cfmt-to-cfm
router.post('/:telegramId/swap/cfmt-to-cfm', swapCfmtToCfm);

// GET /api/user/:telegramId/swap/history
router.get('/:telegramId/swap/history', getSwapHistory);

export default router;
