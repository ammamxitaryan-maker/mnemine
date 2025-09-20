"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimDividends = exports.getDividendsStatus = exports.claimInvestmentGrowthBonus = exports.claimLeaderboardBonus = exports.claimDailyBonus = exports.getDailyBonusStatus = exports.getBonusesSummary = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const constants_1 = require("../constants"); // Added dividend constants
const client_1 = require("@prisma/client");
const dbSelects_1 = require("../utils/dbSelects"); // Import userSelect
const COOLDOWN_HOURS = 24;
const DAILY_BONUS_DESCRIPTION = 'Claimed daily bonus';
// GET /api/user/:telegramId/bonuses/summary
const getBonusesSummary = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: {
                id: true,
                totalInvested: true,
                lastInvestmentGrowthBonusClaimedAt: true,
            },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        let claimableCount = 0;
        // 1. Daily Bonus Check
        const lastDailyClaim = await prisma_1.default.activityLog.findFirst({
            where: { userId: user.id, type: client_1.ActivityLogType.DAILY_BONUS },
            orderBy: { createdAt: 'desc' },
        });
        if (!lastDailyClaim || (new Date().getTime() - lastDailyClaim.createdAt.getTime() >= COOLDOWN_HOURS * 60 * 60 * 1000)) {
            claimableCount++;
        }
        // 2. Dividends Bonus Check
        if (user.totalInvested > 0) {
            const lastDividendClaim = await prisma_1.default.activityLog.findFirst({
                where: { userId: user.id, type: client_1.ActivityLogType.DIVIDEND_BONUS },
                orderBy: { createdAt: 'desc' },
            });
            if (!lastDividendClaim || (new Date().getTime() - lastDividendClaim.createdAt.getTime() >= constants_1.DIVIDEND_COOLDOWN_HOURS * 60 * 60 * 1000)) {
                claimableCount++;
            }
        }
        // 3. Leaderboard Bonus Check
        const topWallets = await prisma_1.default.wallet.findMany({
            where: { currency: 'CFM' },
            take: 10,
            orderBy: { balance: 'desc' },
            select: { userId: true },
        });
        const isInTop10 = topWallets.some(w => w.userId === user.id);
        if (isInTop10) {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            const lastLeaderboardClaim = await prisma_1.default.activityLog.findFirst({
                where: { userId: user.id, type: client_1.ActivityLogType.LEADERBOARD_BONUS, createdAt: { gte: twentyFourHoursAgo } },
            });
            if (!lastLeaderboardClaim) {
                claimableCount++;
            }
        }
        // 4. Investment Growth Bonus Check
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const hasRecentInvestment = await prisma_1.default.activityLog.count({
            where: { userId: user.id, type: { in: [client_1.ActivityLogType.DEPOSIT, client_1.ActivityLogType.NEW_SLOT_PURCHASE, client_1.ActivityLogType.SLOT_EXTENSION, client_1.ActivityLogType.BOOSTER_PURCHASE, client_1.ActivityLogType.REINVESTMENT] }, createdAt: { gte: sevenDaysAgo } },
        }) > 0;
        if (hasRecentInvestment && (!user.lastInvestmentGrowthBonusClaimedAt || (new Date().getTime() - user.lastInvestmentGrowthBonusClaimedAt.getTime() >= 7 * 24 * 60 * 60 * 1000))) {
            claimableCount++;
        }
        // 5. Referral Streak Bonus Check
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const recentReferrals = (await prisma_1.default.activityLog.findMany({
            where: { userId: user.id, type: client_1.ActivityLogType.REFERRAL_SIGNUP_BONUS, createdAt: { gte: threeDaysAgo } },
            distinct: ['sourceUserId'],
            select: { sourceUserId: true }
        })).length;
        const bonusClaimed = await prisma_1.default.activityLog.count({
            where: { userId: user.id, type: client_1.ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS, createdAt: { gte: threeDaysAgo } },
        });
        if (recentReferrals >= 3 && bonusClaimed === 0) {
            claimableCount++;
        }
        res.status(200).json({ claimableCount });
    }
    catch (error) {
        console.error(`Error fetching bonuses summary for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getBonusesSummary = getBonusesSummary;
// GET /api/user/:telegramId/daily-bonus
const getDailyBonusStatus = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: {
                id: true,
                telegramId: true,
                lastInvestmentGrowthBonusClaimedAt: true,
                lastReferralZeroPenaltyAppliedAt: true,
                isSuspicious: true,
                lastSuspiciousPenaltyAppliedAt: true,
                rank: true,
            },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const lastClaim = await prisma_1.default.activityLog.findFirst({
            where: { userId: user.id, type: client_1.ActivityLogType.DAILY_BONUS },
            orderBy: { createdAt: 'desc' },
        });
        if (!lastClaim) {
            return res.status(200).json({ canClaim: true, nextClaimAt: null });
        }
        const nextClaimDate = new Date(lastClaim.createdAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
        const canClaim = new Date() >= nextClaimDate;
        res.status(200).json({ canClaim, nextClaimAt: canClaim ? null : nextClaimDate.toISOString() });
    }
    catch (error) {
        console.error(`Error fetching daily bonus status for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDailyBonusStatus = getDailyBonusStatus;
// POST /api/user/:telegramId/daily-bonus/claim
const claimDailyBonus = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelectWithoutMiningSlots, // Use the reusable userSelect
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const lastClaim = await prisma_1.default.activityLog.findFirst({
            where: { userId: user.id, type: client_1.ActivityLogType.DAILY_BONUS },
            orderBy: { createdAt: 'desc' },
        });
        if (lastClaim) {
            const nextClaimDate = new Date(lastClaim.createdAt.getTime() + COOLDOWN_HOURS * 60 * 60 * 1000);
            if (new Date() < nextClaimDate) {
                return res.status(400).json({ error: 'Daily bonus not available yet.' });
            }
        }
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { increment: constants_1.DAILY_BONUS_AMOUNT } },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.DAILY_BONUS,
                    amount: constants_1.DAILY_BONUS_AMOUNT,
                    description: DAILY_BONUS_DESCRIPTION,
                },
            }),
        ]);
        res.status(200).json({ message: `Claimed ${constants_1.DAILY_BONUS_AMOUNT} CFM successfully!` });
    }
    catch (error) {
        console.error(`Error claiming daily bonus for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.claimDailyBonus = claimDailyBonus;
// POST /api/user/:telegramId/claim-leaderboard-bonus
const claimLeaderboardBonus = async (req, res) => {
    const { telegramId } = req.params;
    const ipAddress = req.ip;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelectWithoutMiningSlots, // Use the reusable userSelect
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const topWallets = await prisma_1.default.wallet.findMany({
            where: { currency: 'CFM' },
            take: 10,
            orderBy: { balance: 'desc' },
            select: { userId: true },
        });
        const isInTop10 = topWallets.some(w => w.userId === user.id);
        if (!isInTop10) {
            return res.status(400).json({ error: 'You are not currently in the top 10 of the leaderboard.' });
        }
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const lastClaim = await prisma_1.default.activityLog.findFirst({
            where: {
                userId: user.id,
                type: client_1.ActivityLogType.LEADERBOARD_BONUS,
                createdAt: { gte: twentyFourHoursAgo },
            },
        });
        if (lastClaim) {
            return res.status(400).json({ error: 'Leaderboard bonus already claimed recently.' });
        }
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { increment: constants_1.LEADERBOARD_BONUS_AMOUNT } },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.LEADERBOARD_BONUS,
                    amount: constants_1.LEADERBOARD_BONUS_AMOUNT,
                    description: `Claimed leaderboard top 10 bonus of ${constants_1.LEADERBOARD_BONUS_AMOUNT} CFM.`,
                    ipAddress: ipAddress,
                },
            }),
        ]);
        res.status(200).json({ message: `Claimed ${constants_1.LEADERBOARD_BONUS_AMOUNT} CFM leaderboard bonus!` });
    }
    catch (error) {
        console.error(`Error claiming leaderboard bonus for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.claimLeaderboardBonus = claimLeaderboardBonus;
// POST /api/user/:telegramId/claim-investment-growth-bonus
const claimInvestmentGrowthBonus = async (req, res) => {
    const { telegramId } = req.params;
    const ipAddress = req.ip;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelectWithoutMiningSlots, // Use the reusable userSelect
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const hasRecentInvestmentActivity = await prisma_1.default.activityLog.count({
            where: {
                userId: user.id,
                type: {
                    in: [
                        client_1.ActivityLogType.DEPOSIT,
                        client_1.ActivityLogType.NEW_SLOT_PURCHASE,
                        client_1.ActivityLogType.SLOT_EXTENSION,
                        client_1.ActivityLogType.BOOSTER_PURCHASE,
                        client_1.ActivityLogType.REINVESTMENT,
                    ],
                },
                createdAt: { gte: sevenDaysAgo },
            },
        }) > 0;
        if (!hasRecentInvestmentActivity) {
            return res.status(400).json({ error: 'No investment growth in the last 7 days.' });
        }
        if (user.lastInvestmentGrowthBonusClaimedAt && (new Date().getTime() - user.lastInvestmentGrowthBonusClaimedAt.getTime() < 7 * 24 * 60 * 60 * 1000)) {
            return res.status(400).json({ error: 'Investment growth bonus already claimed recently.' });
        }
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { increment: constants_1.INVESTMENT_GROWTH_BONUS_AMOUNT } },
            }),
            prisma_1.default.user.update({
                where: { id: user.id },
                data: { lastInvestmentGrowthBonusClaimedAt: new Date() },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.INVESTMENT_GROWTH_BONUS,
                    amount: constants_1.INVESTMENT_GROWTH_BONUS_AMOUNT,
                    description: `Claimed investment growth bonus of ${constants_1.INVESTMENT_GROWTH_BONUS_AMOUNT} CFM.`,
                    ipAddress: ipAddress,
                },
            }),
        ]);
        res.status(200).json({ message: `Claimed ${constants_1.INVESTMENT_GROWTH_BONUS_AMOUNT} CFM investment growth bonus!` });
    }
    catch (error) {
        console.error(`Error claiming investment growth bonus for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.claimInvestmentGrowthBonus = claimInvestmentGrowthBonus;
// GET /api/user/:telegramId/dividends-status
const getDividendsStatus = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: {
                id: true,
                totalInvested: true,
            },
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const lastClaim = await prisma_1.default.activityLog.findFirst({
            where: { userId: user.id, type: client_1.ActivityLogType.DIVIDEND_BONUS },
            orderBy: { createdAt: 'desc' },
        });
        if (!lastClaim) {
            return res.status(200).json({ canClaim: true, nextClaimAt: null, estimatedAmount: (user.totalInvested * constants_1.DIVIDEND_BASE_RATE * (constants_1.DIVIDEND_RAND_MIN + constants_1.DIVIDEND_RAND_MAX) / 2).toFixed(4) });
        }
        const nextClaimDate = new Date(lastClaim.createdAt.getTime() + constants_1.DIVIDEND_COOLDOWN_HOURS * 60 * 60 * 1000);
        const canClaim = new Date() >= nextClaimDate;
        const estimatedAmount = (user.totalInvested * constants_1.DIVIDEND_BASE_RATE * (constants_1.DIVIDEND_RAND_MIN + constants_1.DIVIDEND_RAND_MAX) / 2).toFixed(4);
        res.status(200).json({ canClaim, nextClaimAt: canClaim ? null : nextClaimDate.toISOString(), estimatedAmount });
    }
    catch (error) {
        console.error(`Error fetching dividends status for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getDividendsStatus = getDividendsStatus;
// POST /api/user/:telegramId/claim-dividends
const claimDividends = async (req, res) => {
    const { telegramId } = req.params;
    const ipAddress = req.ip;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelectWithoutMiningSlots, // Use the reusable userSelect
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const lastClaim = await prisma_1.default.activityLog.findFirst({
            where: { userId: user.id, type: client_1.ActivityLogType.DIVIDEND_BONUS },
            orderBy: { createdAt: 'desc' },
        });
        if (lastClaim) {
            const nextClaimDate = new Date(lastClaim.createdAt.getTime() + constants_1.DIVIDEND_COOLDOWN_HOURS * 60 * 60 * 1000);
            if (new Date() < nextClaimDate) {
                return res.status(400).json({ error: 'Dividends not available yet.' });
            }
        }
        if (user.totalInvested <= 0) {
            return res.status(400).json({ error: 'You need to have investments to claim dividends.' });
        }
        const randomFactor = constants_1.DIVIDEND_RAND_MIN + Math.random() * (constants_1.DIVIDEND_RAND_MAX - constants_1.DIVIDEND_RAND_MIN);
        const dividendAmount = user.totalInvested * constants_1.DIVIDEND_BASE_RATE * randomFactor;
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { increment: dividendAmount } },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.DIVIDEND_BONUS,
                    amount: dividendAmount,
                    description: `Claimed ${dividendAmount.toFixed(4)} CFM dividends based on ${user.totalInvested.toFixed(4)} CFM invested.`,
                    ipAddress: ipAddress,
                },
            }),
        ]);
        res.status(200).json({ message: `Claimed ${dividendAmount.toFixed(4)} CFM dividends!` });
    }
    catch (error) {
        console.error(`Error claiming dividends for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.claimDividends = claimDividends;
