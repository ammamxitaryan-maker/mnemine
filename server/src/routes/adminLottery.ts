import { Router } from 'express';
import { 
  getLotteryParticipants,
  selectLotteryWinner,
  removeLotteryWinner,
  completeLotteryDraw,
  getLotteryStats
} from '../controllers/adminLotteryController.js';

const router = Router();

// All routes will be protected by admin middleware
router.get('/participants', getLotteryParticipants);
router.post('/select-winner', selectLotteryWinner);
router.post('/remove-winner', removeLotteryWinner);
router.post('/complete-draw', completeLotteryDraw);
router.get('/stats', getLotteryStats);

export default router;
