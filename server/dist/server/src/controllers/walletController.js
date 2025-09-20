"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimEarnings = exports.withdrawFunds = exports.depositFunds = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const constants_1 = require("../constants"); // Updated import for ranked commissions
const client_1 = require("@prisma/client");
const helpers_1 = require("../utils/helpers");
const dbSelects_1 = require("../utils/dbSelects"); // Import userSelect
const validation_1 = require("../utils/validation");
// POST /api/user/:telegramId/deposit
const depositFunds = async (req, res) => {
    const { telegramId } = req.params;
    const { amount } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    // Validate input
    if (!(0, validation_1.validateAmount)(amount)) {
        return res.status(400).json({ error: 'Invalid deposit amount' });
    }
    // Sanitize telegramId
    const sanitizedTelegramId = (0, validation_1.sanitizeInput)(telegramId);
    if (!sanitizedTelegramId) {
        return res.status(400).json({ error: 'Invalid telegram ID' });
    }
    try {
        const depositor = await prisma_1.default.user.findUnique({
            where: { telegramId: sanitizedTelegramId },
            select: dbSelects_1.userSelect, // Use the reusable userSelect
        });
        if (!depositor) {
            return res.status(404).json({ error: 'User not found' });
        }
        const reserveAmount = amount * constants_1.RESERVE_FUND_PERCENTAGE;
        const netDeposit = amount - reserveAmount;
        await prisma_1.default.$transaction(async (tx) => {
            const depositorWallet = depositor.wallets.find((w) => w.currency === 'CFM');
            if (!depositorWallet)
                throw new Error('Depositor CFM wallet not found');
            await tx.wallet.update({
                where: { id: depositorWallet.id },
                data: { balance: { increment: netDeposit } },
            });
            await tx.user.update({
                where: { id: depositor.id },
                data: {
                    totalInvested: { increment: amount },
                    lastDepositAt: depositor.lastDepositAt ? depositor.lastDepositAt : new Date(),
                },
            });
            await tx.activityLog.create({
                data: {
                    userId: depositor.id,
                    type: client_1.ActivityLogType.DEPOSIT,
                    amount: netDeposit,
                    description: `Deposited ${amount.toFixed(2)} CFM (Net after ${constants_1.RESERVE_FUND_PERCENTAGE * 100}% reserve)`,
                    ipAddress: ipAddress,
                },
            });
            let currentReferrerId = depositor.referredById;
            for (let level = 0; level < constants_1.REFERRAL_COMMISSIONS.length; level++) {
                if (!currentReferrerId)
                    break;
                const referrer = await tx.user.findUnique({
                    where: { id: currentReferrerId },
                    select: dbSelects_1.userSelect, // Use the reusable userSelect
                });
                if (!referrer)
                    break;
                let commissionRate;
                if (referrer.rank) {
                    // Use fixed ranked commissions if referrer has a rank
                    if (level === 0)
                        commissionRate = constants_1.RANKED_REFERRAL_COMMISSIONS_L1;
                    else if (level === 1)
                        commissionRate = constants_1.RANKED_REFERRAL_COMMISSIONS_L2;
                    else
                        commissionRate = constants_1.RANKED_REFERRAL_COMMISSIONS_L3;
                }
                else {
                    // Use base commissions if no rank
                    commissionRate = constants_1.REFERRAL_COMMISSIONS[level];
                }
                let commissionAmount = amount * commissionRate;
                if (depositor.totalInvested <= constants_1.REFERRAL_INCOME_CAP_THRESHOLD) {
                    const referrerWallet = referrer.wallets.find((w) => w.currency === 'CFM')?.balance || 0;
                    if (commissionAmount > referrerWallet) {
                        commissionAmount = referrerWallet;
                    }
                }
                const referrerIsEligible = await (0, helpers_1.isUserEligible)(referrer.id);
                if (!referrerIsEligible) {
                    const referrerWallet = referrer.wallets.find((w) => w.currency === 'CFM')?.balance || 0;
                    commissionAmount = Math.min(commissionAmount * 0.5, 0.5 * referrerWallet);
                }
                const referrerWallet = referrer.wallets.find((w) => w.currency === 'CFM');
                if (referrerWallet) {
                    await tx.wallet.update({
                        where: { id: referrerWallet.id },
                        data: { balance: { increment: commissionAmount } },
                    });
                    await tx.activityLog.create({
                        data: {
                            userId: referrer.id,
                            type: client_1.ActivityLogType.REFERRAL_COMMISSION,
                            amount: commissionAmount,
                            description: `Level ${level + 1} commission from ${depositor.firstName || depositor.username}${!referrerIsEligible ? ' (cut by 50% & capped)' : ''}`,
                            sourceUserId: depositor.id,
                            ipAddress: ipAddress,
                        },
                    });
                    if (level === 0 && !depositor.lastDepositAt) {
                        let depositBonusAmount = constants_1.REFERRAL_DEPOSIT_BONUS;
                        if (!referrerIsEligible) {
                            const referrerWallet = referrer.wallets.find((w) => w.currency === 'CFM')?.balance || 0;
                            depositBonusAmount = Math.min(depositBonusAmount * 0.5, 0.5 * referrerWallet);
                        }
                        await tx.wallet.update({
                            where: { id: referrerWallet.id },
                            data: { balance: { increment: depositBonusAmount } },
                        });
                        await tx.activityLog.create({
                            data: {
                                userId: referrer.id,
                                type: client_1.ActivityLogType.REFERRAL_DEPOSIT_BONUS,
                                amount: depositBonusAmount,
                                description: `Bonus for referred user @${depositor.username || depositor.firstName} making first deposit${!referrerIsEligible ? ' (cut by 50% & capped)' : ''}`,
                                sourceUserId: depositor.id,
                                ipAddress: ipAddress,
                            },
                        });
                    }
                }
                currentReferrerId = referrer.referredById || null;
            }
        });
        res.status(200).json({ message: 'Deposit successful' });
    }
    catch (error) {
        console.error(`Error processing deposit for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.depositFunds = depositFunds;
// POST /api/user/:telegramId/withdraw
const withdrawFunds = async (req, res) => {
    const { telegramId } = req.params;
    const { amount, address } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    // Validate input
    if (!(0, validation_1.validateAmount)(amount) || !address || typeof address !== 'string') {
        return res.status(400).json({ error: 'Invalid amount or address' });
    }
    if (!(0, validation_1.validateAddress)(address)) {
        return res.status(400).json({ error: 'Invalid CFM TRC20 address format' });
    }
    // Sanitize inputs
    const sanitizedTelegramId = (0, validation_1.sanitizeInput)(telegramId);
    const sanitizedAddress = (0, validation_1.sanitizeInput)(address);
    if (!sanitizedTelegramId || !sanitizedAddress) {
        return res.status(400).json({ error: 'Invalid input data' });
    }
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId: sanitizedTelegramId },
            select: dbSelects_1.userSelect, // Use the reusable userSelect
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const userIsEligible = await (0, helpers_1.isUserEligible)(user.id);
        if (!userIsEligible) {
            return res.status(400).json({ error: 'Withdrawals are blocked: You need to increase your investments or have at least 3 active direct referrals.' });
        }
        const cfmWallet = user.wallets.find((w) => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        if (cfmWallet.balance < constants_1.WITHDRAWAL_MIN_BALANCE_REQUIREMENT) {
            return res.status(400).json({ error: `Minimum balance for withdrawal is ${constants_1.WITHDRAWAL_MIN_BALANCE_REQUIREMENT.toFixed(2)} CFM` });
        }
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentWithdrawals = await prisma_1.default.activityLog.count({
            where: {
                userId: user.id,
                type: client_1.ActivityLogType.WITHDRAWAL,
                createdAt: { gte: twentyFourHoursAgo },
            },
        });
        if (recentWithdrawals >= constants_1.WITHDRAWAL_DAILY_LIMIT) {
            return res.status(400).json({ error: `You can only withdraw once every ${24 / constants_1.WITHDRAWAL_DAILY_LIMIT} hours.` });
        }
        const totalWithdrawalsCount = await prisma_1.default.activityLog.count({
            where: { type: client_1.ActivityLogType.WITHDRAWAL },
        });
        const minimumWithdrawal = totalWithdrawalsCount < constants_1.FIRST_100_WITHDRAWALS_LIMIT
            ? constants_1.MINIMUM_WITHDRAWAL_FIRST_100
            : constants_1.MINIMUM_WITHDRAWAL_REGULAR;
        if (amount < minimumWithdrawal)
            return res.status(400).json({ error: `Minimum withdrawal is ${minimumWithdrawal.toFixed(2)} CFM` });
        if (cfmWallet.balance < amount)
            return res.status(400).json({ error: 'Insufficient balance' });
        if (totalWithdrawalsCount >= constants_1.FIRST_100_WITHDRAWALS_LIMIT) {
            const activeReferralsCount = await prisma_1.default.user.count({
                where: {
                    referredById: user.id,
                    OR: [
                        { miningSlots: { some: { isActive: true } } },
                        { referrals: { some: {} } }
                    ]
                }
            });
            if (activeReferralsCount < constants_1.WITHDRAWAL_REFERRAL_REQUIREMENT) {
                return res.status(400).json({ error: `You need at least ${constants_1.WITHDRAWAL_REFERRAL_REQUIREMENT} active referrals to withdraw.` });
            }
            if (user.miningSlots.length < constants_1.WITHDRAWAL_SLOT_REQUIREMENT) {
                return res.status(400).json({ error: `You need at least ${constants_1.WITHDRAWAL_SLOT_REQUIREMENT} active mining slots to withdraw.` });
            }
        }
        if (constants_1.REFERRAL_ZERO_IN_7_DAYS_PENALTY_ENABLED) {
            const hasReferredRecently = await (0, helpers_1.hasReferredInLast7Days)(user.id);
            if (!hasReferredRecently) {
                if (!user.lastReferralZeroPenaltyAppliedAt || (new Date().getTime() - user.lastReferralZeroPenaltyAppliedAt.getTime() > 7 * 24 * 60 * 60 * 1000)) {
                    await prisma_1.default.$transaction([
                        prisma_1.default.wallet.update({
                            where: { id: cfmWallet.id },
                            data: { balance: 0 },
                        }),
                        prisma_1.default.user.update({
                            where: { id: user.id },
                            data: { lastReferralZeroPenaltyAppliedAt: new Date() },
                        }),
                        prisma_1.default.activityLog.create({
                            data: {
                                userId: user.id,
                                type: client_1.ActivityLogType.BALANCE_ZEROED_PENALTY,
                                amount: -cfmWallet.balance,
                                description: 'Balance zeroed due to no new referrals in the last 7 days.',
                                ipAddress: ipAddress,
                            },
                        }),
                    ]);
                    return res.status(400).json({ error: 'Withdrawals blocked: Your balance was reset due to no new referrals in the last 7 days.' });
                }
                return res.status(400).json({ error: 'Withdrawals blocked: You must refer at least one new friend in the last 7 days to withdraw.' });
            }
        }
        const isUserCurrentlySuspicious = await (0, helpers_1.isUserSuspicious)(user.id);
        if (isUserCurrentlySuspicious) {
            if (!user.lastSuspiciousPenaltyAppliedAt || (new Date().getTime() - user.lastSuspiciousPenaltyAppliedAt.getTime() > 24 * 60 * 60 * 1000)) {
                await prisma_1.default.$transaction([
                    prisma_1.default.wallet.update({
                        where: { id: cfmWallet.id },
                        data: { balance: 0 },
                    }),
                    prisma_1.default.user.update({
                        where: { id: user.id },
                        data: {
                            isSuspicious: true,
                            lastSuspiciousPenaltyAppliedAt: new Date(),
                        },
                    }),
                    prisma_1.default.activityLog.create({
                        data: {
                            userId: user.id,
                            type: client_1.ActivityLogType.BALANCE_ZEROED_PENALTY,
                            amount: -cfmWallet.balance,
                            description: 'Balance zeroed due to suspicious activity.',
                            ipAddress: ipAddress,
                        },
                    }),
                ]);
                return res.status(400).json({ error: 'Withdrawals blocked: Your balance was reset due to suspicious activity.' });
            }
            return res.status(400).json({ error: 'Withdrawals blocked: Your account is flagged for suspicious activity.' });
        }
        const fee = amount * constants_1.WITHDRAWAL_FEE_PERCENTAGE;
        const amountToReceive = amount - fee;
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { decrement: amount } },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.WITHDRAWAL,
                    amount: -amount,
                    description: `Withdrawal of ${amount.toFixed(2)} CFM to ${address}. Fee: ${fee.toFixed(2)} CFM.`,
                    ipAddress: ipAddress,
                },
            }),
            prisma_1.default.user.update({
                where: { id: user.id },
                data: { lastWithdrawalAt: new Date() },
            }),
        ]);
        res.status(200).json({ message: `Withdrawal of ${amountToReceive.toFixed(2)} CFM initiated.` });
    }
    catch (error) {
        console.error(`Error processing withdrawal for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.withdrawFunds = withdrawFunds;
// POST /api/user/:telegramId/claim
const claimEarnings = async (req, res) => {
    const { telegramId } = req.params;
    const ipAddress = req.ip;
    if (!telegramId)
        return res.status(400).json({ error: 'Telegram ID is required' });
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelect, // Use the reusable userSelect
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const now = new Date();
        let totalEarnings = 0;
        const updatedSlotsData = user.miningSlots.map((slot) => {
            const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
            if (timeElapsedMs > 0) {
                const earnings = slot.principal * slot.effectiveWeeklyRate * (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));
                totalEarnings += earnings;
                return { id: slot.id, lastAccruedAt: now };
            }
            return null;
        }).filter(Boolean);
        if (totalEarnings < 0.000001) {
            return res.status(200).json({ message: 'No significant earnings to claim.', claimedAmount: 0 });
        }
        const cfmWallet = user.wallets.find((w) => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        await prisma_1.default.$transaction(async (tx) => {
            await tx.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { increment: totalEarnings } }
            });
            for (const slotData of updatedSlotsData) {
                await tx.miningSlot.update({
                    where: { id: slotData.id },
                    data: { lastAccruedAt: slotData.lastAccruedAt }
                });
            }
            await tx.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.CLAIM,
                    amount: totalEarnings,
                    description: 'Claimed mining earnings',
                    ipAddress: ipAddress,
                },
            });
        });
        res.status(200).json({ message: 'Earnings claimed successfully!', claimedAmount: totalEarnings });
    }
    catch (error) {
        console.error(`Error claiming earnings for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.claimEarnings = claimEarnings;
