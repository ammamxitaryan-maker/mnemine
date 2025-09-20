import { Router } from 'express';
import { getLotteryStatus, buyLotteryTicket, getUserLotteryTickets, getLastDrawResults, getLotteryHistory } from '../controllers/lotteryController';

const router = Router();

router.get('/status', getLotteryStatus);
router.post('/:telegramId/buy', buyLotteryTicket);
router.get('/:telegramId/tickets', getUserLotteryTickets);
router.get('/last-draw', getLastDrawResults);
router.get('/:telegramId/history', getLotteryHistory);

export default router;