import { Router } from 'express';
import { getLotteryStatus, buyLotteryTicket, getUserLotteryTickets, getLastDrawResults, getLotteryHistory } from '../controllers/lotteryController.js';
import { authenticateUser, extractUserIdFromParams } from '../middleware-stubs.js';

const router = Router();

router.get('/status', getLotteryStatus);
router.post('/:telegramId/buy', authenticateUser, extractUserIdFromParams, buyLotteryTicket);
router.get('/:telegramId/tickets', authenticateUser, extractUserIdFromParams, getUserLotteryTickets);
router.get('/last-draw', getLastDrawResults);
router.get('/:telegramId/history', authenticateUser, extractUserIdFromParams, getLotteryHistory);

export default router;