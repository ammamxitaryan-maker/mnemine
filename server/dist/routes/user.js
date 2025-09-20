"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dataController_1 = require("../controllers/dataController");
const walletController_1 = require("../controllers/walletController");
const slotController_1 = require("../controllers/slotController"); // Import reinvestEarnings and upgradeSlot
const referralController_1 = require("../controllers/referralController"); // Import new functions
const taskController_1 = require("../controllers/taskController");
const bonusController_1 = require("../controllers/bonusController"); // Import new dividend functions
const achievementController_1 = require("../controllers/achievementController");
const router = (0, express_1.Router)();
// Data routes
router.get('/:telegramId/data', dataController_1.getUserData);
router.get('/:telegramId/stats', dataController_1.getUserStats);
router.get('/:telegramId/activity', dataController_1.getUserActivity);
// Wallet routes
router.post('/:telegramId/deposit', walletController_1.depositFunds);
router.post('/:telegramId/withdraw', walletController_1.withdrawFunds);
router.post('/:telegramId/claim', walletController_1.claimEarnings);
// Slot & Booster routes
router.get('/:telegramId/slots', slotController_1.getUserSlots);
router.post('/:telegramId/slots/buy', slotController_1.buyNewSlot);
router.post('/:telegramId/slots/:slotId/extend', slotController_1.extendSlot);
router.post('/:telegramId/slots/:slotId/upgrade', slotController_1.upgradeSlot); // New route for upgrading
router.post('/:telegramId/buy-booster', slotController_1.buyBooster);
router.post('/:telegramId/reinvest', slotController_1.reinvestEarnings); // New route for reinvestment
// Referral routes
router.get('/:telegramId/referrals', referralController_1.getReferralData);
router.get('/:telegramId/referrals/list', referralController_1.getReferralList);
router.get('/:telegramId/referrals/stats', referralController_1.getReferralStats); // New route
router.get('/:telegramId/referrals/streak-bonus-status', referralController_1.getReferralStreakBonusStatus); // New route
router.post('/:telegramId/referrals/claim-streak-bonus', referralController_1.claimReferralStreakBonus); // New route
// Task routes
router.post('/:telegramId/claim-task', taskController_1.claimTaskReward);
// Daily Bonus routes
router.get('/:telegramId/daily-bonus', bonusController_1.getDailyBonusStatus);
router.post('/:telegramId/daily-bonus/claim', bonusController_1.claimDailyBonus);
// Achievement routes
router.get('/:telegramId/achievements', achievementController_1.getAchievementsStatus);
router.post('/:telegramId/achievements/claim', achievementController_1.claimAchievementReward);
// New Bonus routes
router.get('/:telegramId/bonuses/summary', bonusController_1.getBonusesSummary);
router.post('/:telegramId/claim-leaderboard-bonus', bonusController_1.claimLeaderboardBonus);
router.post('/:telegramId/claim-investment-growth-bonus', bonusController_1.claimInvestmentGrowthBonus);
// Dividends Bonus routes
router.get('/:telegramId/dividends-status', bonusController_1.getDividendsStatus);
router.post('/:telegramId/claim-dividends', bonusController_1.claimDividends);
exports.default = router;
