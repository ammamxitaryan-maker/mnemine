"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserActivity = exports.getUserStats = exports.getUserData = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const constants_1 = require("../constants");
const client_1 = require("@prisma/client");
const helpers_1 = require("../utils/helpers");
const dbSelects_1 = require("../utils/dbSelects"); // Import userSelect
// GET /api/user/:telegramId/data
const getUserData = async (req, res) => {
    const { telegramId } = req.params;
    // console.log(`[DATA] Received /data request for user ${telegramId}.`); // Removed log
    if (!telegramId) {
        console.error('[DATA] Request failed: Telegram ID is required.');
        return res.status(400).json({ error: 'Telegram ID is required' });
    }
    try {
        // console.log(`[DATA] Querying database for user ${telegramId}...`); // Removed log
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: {
                ...dbSelects_1.userSelect,
                _count: {
                    select: { referrals: true }
                }
            }, // Use the reusable userSelect
        });
        if (!user) {
            console.error(`[DATA] User not found for telegramId: ${telegramId}.`);
            return res.status(404).json({ error: 'User not found' });
        }
        // console.log(`[DATA] User found. ID: ${user.id}. Wallets: ${user.wallets.length}, Active Slots: ${user.miningSlots.length}.`); // Removed log
        // Update lastSeenAt on data fetch
        await prisma_1.default.user.update({
            where: { telegramId },
            data: { lastSeenAt: new Date() },
        });
        const now = new Date();
        let totalEarnings = 0;
        // console.log('[DATA] Calculating accrued earnings...'); // Removed log
        user.miningSlots.forEach(slot => {
            const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
            if (timeElapsedMs > 0) {
                const earnings = slot.principal * slot.effectiveWeeklyRate * (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));
                totalEarnings += earnings;
            }
        });
        // console.log(`[DATA] Calculated accrued earnings: ${totalEarnings}.`); // Removed log
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        const currentBalance = cfmWallet?.balance || 0;
        // console.log(`[DATA] Current balance from wallet: ${currentBalance}.`); // Removed log
        const totalMiningPower = user.miningSlots.reduce((sum, slot) => sum + slot.effectiveWeeklyRate, 0);
        // console.log(`[DATA] Total mining power: ${totalMiningPower}.`); // Removed log
        const responseData = {
            balance: currentBalance,
            miningPower: totalMiningPower,
            accruedEarnings: totalEarnings,
            totalInvested: user.totalInvested,
            referralCount: user._count.referrals, // Added referral count
            rank: user.rank, // Added user rank
        };
        // console.log('[DATA] Sending successful response:', responseData); // Removed log
        res.status(200).json(responseData);
    }
    catch (error) {
        console.error(`[DATA] CRITICAL: Error fetching data for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserData = getUserData;
// GET /api/user/:telegramId/stats
const getUserStats = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: {
                id: true,
                telegramId: true,
                username: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                referralCode: true,
                referredById: true,
                totalInvested: true,
                lastDepositAt: true,
                lastWithdrawalAt: true,
                lastSlotPurchaseAt: true,
                _count: {
                    select: { referrals: true, completedTasks: true, miningSlots: true },
                },
                miningSlots: { where: { isActive: true } },
                lastInvestmentGrowthBonusClaimedAt: true,
                lastReferralZeroPenaltyAppliedAt: true,
                isSuspicious: true,
                lastSuspiciousPenaltyAppliedAt: true,
                rank: true,
            },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const transactions = await prisma_1.default.activityLog.findMany({
            where: { userId: user.id },
        });
        const totalEarnings = transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        const totalSpending = transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + t.amount, 0);
        const boostersPurchased = transactions.filter(t => t.type === client_1.ActivityLogType.BOOSTER_PURCHASE).length;
        const activeReferralsCount = await prisma_1.default.user.count({
            where: {
                referredById: user.id,
                OR: [
                    { miningSlots: { some: { isActive: true } } },
                    { referrals: { some: {} } }
                ]
            }
        });
        const isEligible = await (0, helpers_1.isUserEligible)(user.id);
        const isSuspicious = await (0, helpers_1.isUserSuspicious)(user.id);
        let rank = null;
        if (user.totalInvested >= constants_1.PLATINUM_GOD_THRESHOLD) {
            rank = 'Platinum God';
        }
        else if (user.totalInvested >= constants_1.GOLD_MAGNATE_THRESHOLD) {
            rank = 'Gold Magnate';
        }
        else if (user.totalInvested >= constants_1.BRONZE_INVESTOR_THRESHOLD) {
            rank = 'Bronze Investor';
        }
        const totalSystemWithdrawals = await prisma_1.default.activityLog.count({
            where: { type: client_1.ActivityLogType.WITHDRAWAL },
        });
        const stats = {
            totalEarnings,
            totalSpending: Math.abs(totalSpending),
            referralCount: user._count.referrals,
            activeReferralCount: activeReferralsCount,
            tasksCompleted: user._count.completedTasks,
            slotsOwned: user._count.miningSlots,
            boostersPurchased,
            totalInvested: user.totalInvested,
            isEligible: isEligible,
            isSuspicious: isSuspicious,
            rank: rank,
            totalSystemWithdrawals,
        };
        res.status(200).json(stats);
    }
    catch (error) {
        console.error(`Error fetching stats for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserStats = getUserStats;
// GET /api/user/:telegramId/activity
const getUserActivity = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const transactions = await prisma_1.default.activityLog.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        res.status(200).json(transactions);
    }
    catch (error) {
        console.error(`Error fetching activity for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserActivity = getUserActivity;
