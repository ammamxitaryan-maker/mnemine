import { Router } from 'express';
import { claimAchievementReward, getAchievementsStatus } from '../controllers/achievementController.js';
import { claimDailyBonus, claimDividends, claimInvestmentGrowthBonus, claimLeaderboardBonus, getBonusesSummary, getDailyBonusStatus, getDividendsStatus } from '../controllers/bonusController.js'; // Import new dividend functions
import { getUserActivity, getUserData, getUserStats } from '../controllers/dataController.js';
import { claimReferralStreakBonus, getReferralData, getReferralList, getReferralStats, getReferralStreakBonusStatus } from '../controllers/referralController.js'; // Import new functions
import { buyNewSlot, claimCompletedSlot, claimEarnings, createInvestmentSlot, extendSlot, getRealTimeIncome, getUserAccruedEarnings, getUserInvestmentSlots, getUserSlots, upgradeSlot } from '../controllers/slotController.js'; // Import new functions
import { claimTaskReward } from '../controllers/taskController.js';
import { depositFunds, withdrawFunds } from '../controllers/walletController.js';
import { authenticateUser, extractUserIdFromParams } from '../middleware-stubs.js';
import { earningsAccumulator } from '../services/earningsAccumulator.js';

const router = Router();

// Data routes - without authentication (middleware removed)
router.get('/:telegramId/data', getUserData);
router.get('/:telegramId/stats', authenticateUser, extractUserIdFromParams, getUserStats);
router.get('/:telegramId/activity', authenticateUser, extractUserIdFromParams, getUserActivity);

// Wallet routes - with authentication
router.post('/:telegramId/deposit', authenticateUser, extractUserIdFromParams, depositFunds);
router.post('/:telegramId/withdraw', authenticateUser, extractUserIdFromParams, withdrawFunds);
// Claim route removed - earnings are now automatically transferred to NON balance after 7 days

// Slot & Booster routes - with authentication
router.get('/:telegramId/slots', authenticateUser, extractUserIdFromParams, getUserSlots);
router.get('/:telegramId/real-time-income', authenticateUser, extractUserIdFromParams, getRealTimeIncome);
router.get('/:telegramId/slots/earnings', authenticateUser, extractUserIdFromParams, getUserAccruedEarnings);
router.get('/:telegramId/earnings/recovery-info', authenticateUser, extractUserIdFromParams, async (req, res) => {
  try {
    const { telegramId } = req.params;
    const recoveryInfo = await earningsAccumulator.getRecoveryInfo(telegramId);
    res.json({ success: true, data: recoveryInfo });
  } catch (error) {
    console.error('Error getting recovery info:', error);
    res.status(500).json({ success: false, message: 'Error getting recovery info' });
  }
});
router.post('/:telegramId/slots/claim', authenticateUser, extractUserIdFromParams, claimEarnings);
router.post('/:telegramId/slots/buy', authenticateUser, extractUserIdFromParams, buyNewSlot);
router.post('/:telegramId/slots/:slotId/extend', authenticateUser, extractUserIdFromParams, extendSlot);
router.post('/:telegramId/slots/:slotId/upgrade', authenticateUser, extractUserIdFromParams, upgradeSlot);
// Booster functionality removed - reinvestEarnings function was removed

// Investment Slots API routes
router.post('/:telegramId/invest', authenticateUser, extractUserIdFromParams, createInvestmentSlot);
router.get('/:telegramId/myslots', authenticateUser, extractUserIdFromParams, getUserInvestmentSlots);
router.post('/:telegramId/claim/:slotId', authenticateUser, extractUserIdFromParams, claimCompletedSlot);

// Referral routes - with authentication
router.get('/:telegramId/referrals', authenticateUser, extractUserIdFromParams, getReferralData);
router.get('/:telegramId/referrals/list', authenticateUser, extractUserIdFromParams, getReferralList);
router.get('/:telegramId/referrals/stats', authenticateUser, extractUserIdFromParams, getReferralStats);
router.get('/:telegramId/referrals/streak-bonus-status', authenticateUser, extractUserIdFromParams, getReferralStreakBonusStatus);
router.post('/:telegramId/referrals/claim-streak-bonus', authenticateUser, extractUserIdFromParams, claimReferralStreakBonus);

// Task routes - with authentication
router.post('/:telegramId/claim-task', authenticateUser, extractUserIdFromParams, claimTaskReward);

// Daily Bonus routes - with authentication
router.get('/:telegramId/daily-bonus', authenticateUser, extractUserIdFromParams, getDailyBonusStatus);
router.post('/:telegramId/daily-bonus/claim', authenticateUser, extractUserIdFromParams, claimDailyBonus);

// Achievement routes - with authentication
router.get('/:telegramId/achievements', authenticateUser, extractUserIdFromParams, getAchievementsStatus);
router.post('/:telegramId/achievements/claim', authenticateUser, extractUserIdFromParams, claimAchievementReward);

// New Bonus routes - with authentication
router.get('/:telegramId/bonuses/summary', authenticateUser, extractUserIdFromParams, getBonusesSummary);
router.post('/:telegramId/claim-leaderboard-bonus', authenticateUser, extractUserIdFromParams, claimLeaderboardBonus);
router.post('/:telegramId/claim-investment-growth-bonus', authenticateUser, extractUserIdFromParams, claimInvestmentGrowthBonus);

// Dividends Bonus routes - with authentication
router.get('/:telegramId/dividends-status', authenticateUser, extractUserIdFromParams, getDividendsStatus);
router.post('/:telegramId/claim-dividends', authenticateUser, extractUserIdFromParams, claimDividends);

export default router;