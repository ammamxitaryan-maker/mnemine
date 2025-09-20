import { Router } from 'express';
import { getUserData, getUserStats, getUserActivity } from '../controllers/dataController';
import { depositFunds, withdrawFunds, claimEarnings } from '../controllers/walletController';
import { getUserSlots, buyNewSlot, extendSlot, buyBooster, reinvestEarnings, upgradeSlot } from '../controllers/slotController'; // Import reinvestEarnings and upgradeSlot
import { getReferralData, getReferralList, getReferralStreakBonusStatus, claimReferralStreakBonus, getReferralStats } from '../controllers/referralController'; // Import new functions
import { claimTaskReward } from '../controllers/taskController';
import { getDailyBonusStatus, claimDailyBonus, getDividendsStatus, claimDividends, getBonusesSummary, claimLeaderboardBonus, claimInvestmentGrowthBonus } from '../controllers/bonusController'; // Import new dividend functions
import { getAchievementsStatus, claimAchievementReward } from '../controllers/achievementController';

const router = Router();

// Data routes
router.get('/:telegramId/data', getUserData);
router.get('/:telegramId/stats', getUserStats);
router.get('/:telegramId/activity', getUserActivity);

// Wallet routes
router.post('/:telegramId/deposit', depositFunds);
router.post('/:telegramId/withdraw', withdrawFunds);
router.post('/:telegramId/claim', claimEarnings);

// Slot & Booster routes
router.get('/:telegramId/slots', getUserSlots);
router.post('/:telegramId/slots/buy', buyNewSlot);
router.post('/:telegramId/slots/:slotId/extend', extendSlot);
router.post('/:telegramId/slots/:slotId/upgrade', upgradeSlot); // New route for upgrading
router.post('/:telegramId/buy-booster', buyBooster);
router.post('/:telegramId/reinvest', reinvestEarnings); // New route for reinvestment

// Referral routes
router.get('/:telegramId/referrals', getReferralData);
router.get('/:telegramId/referrals/list', getReferralList);
router.get('/:telegramId/referrals/stats', getReferralStats); // New route
router.get('/:telegramId/referrals/streak-bonus-status', getReferralStreakBonusStatus); // New route
router.post('/:telegramId/referrals/claim-streak-bonus', claimReferralStreakBonus); // New route

// Task routes
router.post('/:telegramId/claim-task', claimTaskReward);

// Daily Bonus routes
router.get('/:telegramId/daily-bonus', getDailyBonusStatus);
router.post('/:telegramId/daily-bonus/claim', claimDailyBonus);

// Achievement routes
router.get('/:telegramId/achievements', getAchievementsStatus);
router.post('/:telegramId/achievements/claim', claimAchievementReward);

// New Bonus routes
router.get('/:telegramId/bonuses/summary', getBonusesSummary);
router.post('/:telegramId/claim-leaderboard-bonus', claimLeaderboardBonus);
router.post('/:telegramId/claim-investment-growth-bonus', claimInvestmentGrowthBonus);

// Dividends Bonus routes
router.get('/:telegramId/dividends-status', getDividendsStatus);
router.post('/:telegramId/claim-dividends', claimDividends);

export default router;