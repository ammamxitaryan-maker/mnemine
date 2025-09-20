"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimAchievementReward = exports.getAchievementsStatus = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const constants_1 = require("../constants");
const client_1 = require("@prisma/client"); // Import ActivityLogType
const getAchievementDescription = (id, reward) => `Achievement Reward: ${id} (${reward} CFM)`; // Changed to CFM
// GET /api/user/:telegramId/achievements
const getAchievementsStatus = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            include: {
                _count: { select: { referrals: true, completedTasks: true } },
            },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const activityLogs = await prisma_1.default.activityLog.findMany({
            where: {
                userId: user.id,
                type: { in: [client_1.ActivityLogType.DEPOSIT, client_1.ActivityLogType.BOOSTER_PURCHASE, client_1.ActivityLogType.TASK_REWARD] }, // Use ActivityLogType
            },
        });
        const achievementStatus = await Promise.all(Object.values(constants_1.achievements).map(async (ach) => {
            let isCompleted = false;
            const isClaimed = activityLogs.some(log => log.type === client_1.ActivityLogType.TASK_REWARD && log.description === getAchievementDescription(ach.id, ach.reward)); // Use ActivityLogType
            switch (ach.id) {
                case 'FIRST_DEPOSIT':
                    isCompleted = activityLogs.some(log => log.type === client_1.ActivityLogType.DEPOSIT); // Use ActivityLogType
                    break;
                case 'FIVE_REFERRALS':
                    isCompleted = user._count.referrals >= 5;
                    break;
                case 'BUY_BOOSTER':
                    isCompleted = activityLogs.some(log => log.type === client_1.ActivityLogType.BOOSTER_PURCHASE); // Use ActivityLogType
                    break;
                case 'COMPLETE_ALL_TASKS':
                    isCompleted = user._count.completedTasks >= constants_1.tasks.length;
                    break;
            }
            return { ...ach, isCompleted, isClaimed };
        }));
        res.status(200).json(achievementStatus);
    }
    catch (error) {
        console.error(`Error fetching achievement status for user ${telegramId}:`, error); // Added error logging
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getAchievementsStatus = getAchievementsStatus;
// POST /api/user/:telegramId/achievements/claim
const claimAchievementReward = async (req, res) => {
    const { telegramId } = req.params;
    const { achievementId } = req.body;
    const achievement = constants_1.achievements[achievementId];
    if (!achievement)
        return res.status(404).json({ error: 'Achievement not found' });
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            include: {
                wallets: true,
                _count: { select: { referrals: true, completedTasks: true } },
            },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const activityLogs = await prisma_1.default.activityLog.findMany({
            where: {
                userId: user.id,
                type: { in: [client_1.ActivityLogType.DEPOSIT, client_1.ActivityLogType.BOOSTER_PURCHASE, client_1.ActivityLogType.TASK_REWARD] }, // Use ActivityLogType
            },
        });
        const description = getAchievementDescription(achievement.id, achievement.reward);
        const isClaimed = activityLogs.some(log => log.type === client_1.ActivityLogType.TASK_REWARD && log.description === description); // Use ActivityLogType
        if (isClaimed)
            return res.status(400).json({ error: 'Achievement already claimed' });
        let isCompleted = false;
        switch (achievement.id) {
            case 'FIRST_DEPOSIT':
                isCompleted = activityLogs.some(log => log.type === client_1.ActivityLogType.DEPOSIT); // Use ActivityLogType
                break;
            case 'FIVE_REFERRALS':
                isCompleted = user._count.referrals >= 5;
                break;
            case 'BUY_BOOSTER':
                isCompleted = activityLogs.some(log => log.type === client_1.ActivityLogType.BOOSTER_PURCHASE); // Use ActivityLogType
                break;
            case 'COMPLETE_ALL_TASKS':
                isCompleted = user._count.completedTasks >= constants_1.tasks.length;
                break;
        }
        if (!isCompleted)
            return res.status(400).json({ error: 'Achievement not completed' });
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { increment: achievement.reward } },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.TASK_REWARD, // Use ActivityLogType
                    amount: achievement.reward,
                    description,
                },
            }),
        ]);
        res.status(200).json({ message: 'Achievement reward claimed!' });
    }
    catch (error) {
        console.error(`Error claiming achievement reward for user ${telegramId}:`, error); // Added error logging
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.claimAchievementReward = claimAchievementReward;
