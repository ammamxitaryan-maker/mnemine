"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueReferralCode = generateUniqueReferralCode;
exports.isUserEligible = isUserEligible;
exports.isUserSuspicious = isUserSuspicious;
exports.hasReferredInLast7Days = hasReferredInLast7Days;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = __importDefault(require("../prisma"));
const client_1 = require("@prisma/client");
const constants_1 = require("../constants");
async function generateUniqueReferralCode() {
    let code;
    let userWithCode = null;
    do {
        code = crypto_1.default.randomBytes(4).toString('hex');
        userWithCode = await prisma_1.default.user.findUnique({ where: { referralCode: code } }).catch(() => null);
    } while (userWithCode);
    return code;
}
async function isUserEligible(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    // Check for investment growth in the last 7 days
    const recentInvestmentActivity = await prisma_1.default.activityLog.count({
        where: {
            userId: userId,
            type: {
                in: [
                    client_1.ActivityLogType.DEPOSIT,
                    client_1.ActivityLogType.NEW_SLOT_PURCHASE,
                    client_1.ActivityLogType.SLOT_EXTENSION,
                    client_1.ActivityLogType.BOOSTER_PURCHASE,
                ],
            },
            createdAt: { gte: sevenDaysAgo },
        },
    });
    const hasInvestmentGrowth = recentInvestmentActivity > 0;
    // Check for active direct referrals (at least 3)
    const directReferrals = await prisma_1.default.user.findMany({
        where: { referredById: userId },
        select: {
            id: true,
            _count: {
                select: {
                    miningSlots: { where: { isActive: true } },
                    referrals: true, // Direct referrals of the referred user
                },
            },
        },
    });
    const activeDirectReferralsCount = directReferrals.filter(ref => ref._count.miningSlots >= constants_1.ACTIVE_REFERRAL_MIN_SLOTS || ref._count.referrals >= constants_1.ACTIVE_REFERRAL_MIN_DIRECT_REFERRALS).length;
    const hasEnoughActiveReferrals = activeDirectReferralsCount >= 3; // M = 3 CFM
    return hasInvestmentGrowth || hasEnoughActiveReferrals;
}
async function isUserSuspicious(userId) {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    // Count unique IP addresses used by the user in the last 24 hours
    const ipAddresses = await prisma_1.default.activityLog.findMany({
        where: {
            userId: userId,
            createdAt: { gte: twentyFourHoursAgo },
            ipAddress: { not: null },
        },
        select: { ipAddress: true },
        distinct: ['ipAddress'],
    });
    return ipAddresses.length > constants_1.SUSPICIOUS_IP_THRESHOLD;
}
async function hasReferredInLast7Days(userId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentReferrals = await prisma_1.default.activityLog.count({
        where: {
            userId: userId,
            type: client_1.ActivityLogType.REFERRAL_SIGNUP_BONUS,
            createdAt: { gte: sevenDaysAgo },
        },
    });
    return recentReferrals > 0;
}
