"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimReferralStreakBonus = exports.getReferralStreakBonusStatus = exports.getReferralStats = exports.getReferralList = exports.getReferralData = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const constants_1 = require("../constants");
const client_1 = require("@prisma/client");
const helpers_1 = require("../utils/helpers");
const dbSelects_1 = require("../utils/dbSelects"); // Import userSelect
// GET /api/user/:telegramId/referrals
const getReferralData = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId }, include: { _count: { select: { referrals: true } } } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.status(200).json({ referralCode: user.referralCode, referralCount: user._count.referrals });
    }
    catch (error) {
        console.error(`Error fetching referral data for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getReferralData = getReferralData;
// GET /api/user/:telegramId/referrals/list
const getReferralList = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const referrals = await prisma_1.default.user.findMany({
            where: { referredById: user.id },
            select: {
                id: true,
                firstName: true,
                username: true,
                avatarUrl: true,
                lastSeenAt: true,
                createdAt: true,
                totalInvested: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const referralsWithStatus = referrals.map(ref => ({
            ...ref,
            isOnline: ref.lastSeenAt ? new Date(ref.lastSeenAt) > fiveMinutesAgo : false,
        }));
        res.status(200).json(referralsWithStatus);
    }
    catch (error) {
        console.error(`Error fetching referral list for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getReferralList = getReferralList;
// GET /api/user/:telegramId/referrals/stats
const getReferralStats = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId }, select: { id: true } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        // 1. Total Referral Earnings
        const referralActivities = await prisma_1.default.activityLog.findMany({
            where: {
                userId: user.id,
                type: { in: [client_1.ActivityLogType.REFERRAL_COMMISSION, client_1.ActivityLogType.REFERRAL_SIGNUP_BONUS, client_1.ActivityLogType.REFERRAL_DEPOSIT_BONUS, client_1.ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS] },
            },
            select: { amount: true },
        });
        const totalReferralEarnings = referralActivities.reduce((sum, act) => sum + act.amount, 0);
        // 2. Active Referrals Count
        const activeReferralsCount = await prisma_1.default.user.count({
            where: {
                referredById: user.id,
                OR: [
                    { miningSlots: { some: { isActive: true } } },
                    { referrals: { some: {} } }
                ]
            }
        });
        // 3. Referrals by Level
        const l1Referrals = await prisma_1.default.user.findMany({ where: { referredById: user.id }, select: { id: true } });
        const l1Ids = l1Referrals.map(r => r.id);
        const l2Referrals = await prisma_1.default.user.findMany({ where: { referredById: { in: l1Ids } }, select: { id: true } });
        const l2Ids = l2Referrals.map(r => r.id);
        const l3ReferralsCount = await prisma_1.default.user.count({ where: { referredById: { in: l2Ids } } });
        const referralsByLevel = {
            l1: l1Referrals.length,
            l2: l2Referrals.length,
            l3: l3ReferralsCount,
        };
        res.status(200).json({
            totalReferralEarnings,
            activeReferralsCount,
            referralsByLevel,
        });
    }
    catch (error) {
        console.error(`Error fetching referral stats for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getReferralStats = getReferralStats;
// GET /api/user/:telegramId/referrals/streak-bonus-status
const getReferralStreakBonusStatus = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const recentReferrals = await prisma_1.default.activityLog.findMany({
            where: {
                userId: user.id,
                type: client_1.ActivityLogType.REFERRAL_SIGNUP_BONUS,
                createdAt: { gte: threeDaysAgo },
            },
            distinct: ['sourceUserId'],
            select: { sourceUserId: true },
        });
        const bonusClaimed = await prisma_1.default.activityLog.count({
            where: {
                userId: user.id,
                type: client_1.ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS,
                createdAt: { gte: threeDaysAgo },
            },
        });
        const canClaim = recentReferrals.length >= 3 && bonusClaimed === 0;
        res.status(200).json({ canClaim, referralCountIn3Days: recentReferrals.length });
    }
    catch (error) {
        console.error(`Error fetching referral streak bonus status for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getReferralStreakBonusStatus = getReferralStreakBonusStatus;
// POST /api/user/:telegramId/referrals/claim-streak-bonus
const claimReferralStreakBonus = async (req, res) => {
    const { telegramId } = req.params;
    const ipAddress = req.ip;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelectWithoutMiningSlots, // Use the reusable userSelect
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
        const recentReferrals = await prisma_1.default.activityLog.findMany({
            where: {
                userId: user.id,
                type: client_1.ActivityLogType.REFERRAL_SIGNUP_BONUS,
                createdAt: { gte: threeDaysAgo },
            },
            distinct: ['sourceUserId'],
            select: { sourceUserId: true },
        });
        const bonusClaimed = await prisma_1.default.activityLog.count({
            where: {
                userId: user.id,
                type: client_1.ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS,
                createdAt: { gte: threeDaysAgo },
            },
        });
        if (recentReferrals.length < 3 || bonusClaimed > 0) {
            return res.status(400).json({ error: 'Conditions for 3 referrals in 3 days bonus not met or already claimed.' });
        }
        let bonusAmount = constants_1.REFERRAL_3_IN_3_DAYS_BONUS;
        if (user.rank) {
            bonusAmount += bonusAmount * constants_1.RANK_REFERRAL_BONUS_PERCENTAGE;
        }
        const userIsEligible = await (0, helpers_1.isUserEligible)(user.id);
        if (!userIsEligible) {
            const userCurrentBalance = user.wallets.find((w) => w.currency === 'CFM')?.balance || 0;
            bonusAmount = Math.min(bonusAmount * 0.5, 0.5 * userCurrentBalance);
        }
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { increment: bonusAmount } },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.REFERRAL_3_IN_3_DAYS_BONUS,
                    amount: bonusAmount,
                    description: `Bonus for 3 referrals in 3 days${!userIsEligible ? ' (cut by 50% & capped)' : ''}`,
                    ipAddress: ipAddress,
                },
            }),
        ]);
        res.status(200).json({ message: `Claimed ${bonusAmount} CFM for 3 referrals in 3 days!` });
    }
    catch (error) {
        console.error(`Error claiming referral streak bonus for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.claimReferralStreakBonus = claimReferralStreakBonus;
