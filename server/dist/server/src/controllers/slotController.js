"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upgradeSlot = exports.reinvestEarnings = exports.buyBooster = exports.extendSlot = exports.buyNewSlot = exports.getUserSlots = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const constants_1 = require("../constants");
const client_1 = require("@prisma/client");
const dbSelects_1 = require("../utils/dbSelects"); // Import userSelect
// GET /api/user/:telegramId/slots
const getUserSlots = async (req, res) => {
    const { telegramId } = req.params;
    if (!telegramId)
        return res.status(400).json({ error: 'Telegram ID is required' });
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelect, // Use the reusable userSelect
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user.miningSlots);
    }
    catch (error) {
        console.error(`Error fetching slots for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserSlots = getUserSlots;
// POST /api/user/:telegramId/slots/buy
const buyNewSlot = async (req, res) => {
    const { telegramId } = req.params;
    const { amount } = req.body;
    const ipAddress = req.ip;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid investment amount' });
    }
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelectWithoutMiningSlots, // Use the reusable userSelect
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const cfmWallet = user.wallets.find((w) => w.currency === 'CFM');
        if (!cfmWallet || cfmWallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const recentSlotPurchases = await prisma_1.default.activityLog.count({
            where: {
                userId: user.id,
                type: client_1.ActivityLogType.NEW_SLOT_PURCHASE,
                createdAt: { gte: twentyFourHoursAgo },
            },
        });
        if (recentSlotPurchases >= constants_1.SLOT_PURCHASE_DAILY_LIMIT) {
            return res.status(400).json({ error: `You can only purchase ${constants_1.SLOT_PURCHASE_DAILY_LIMIT} slots per day.` });
        }
        let weeklyRate = constants_1.BASE_STANDARD_SLOT_WEEKLY_RATE;
        if (user.rank) {
            weeklyRate += constants_1.RANK_SLOT_RATE_BONUS_PERCENTAGE;
        }
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { decrement: amount } },
            }),
            prisma_1.default.miningSlot.create({
                data: {
                    userId: user.id,
                    principal: amount,
                    startAt: new Date(),
                    lastAccruedAt: new Date(),
                    effectiveWeeklyRate: weeklyRate,
                    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
                    isActive: true,
                    type: 'standard',
                },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.NEW_SLOT_PURCHASE,
                    amount: -amount,
                    description: `Invested ${amount.toFixed(2)} CFM in a new slot`,
                    ipAddress: ipAddress,
                },
            }),
            prisma_1.default.user.update({
                where: { id: user.id },
                data: {
                    totalInvested: { increment: amount },
                    lastSlotPurchaseAt: new Date(),
                },
            }),
        ]);
        res.status(201).json({ message: `Slot purchased successfully for ${amount.toFixed(2)} CFM.` });
    }
    catch (error) {
        console.error(`Error purchasing slot for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.buyNewSlot = buyNewSlot;
// POST /api/user/:telegramId/slots/:slotId/extend
const extendSlot = async (req, res) => {
    const { telegramId, slotId } = req.params;
    const ipAddress = req.ip;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelect, // Use the reusable userSelect
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const cfmWallet = user.wallets.find((w) => w.currency === 'CFM');
        if (!cfmWallet || cfmWallet.balance < constants_1.SLOT_EXTENSION_COST) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        const slot = user.miningSlots.find((s) => s.id === slotId); // Find the specific slot
        if (!slot) {
            return res.status(404).json({ error: 'Slot not found' });
        }
        if (!slot.isActive || new Date(slot.expiresAt) < new Date()) {
            return res.status(400).json({ error: 'Cannot extend an inactive or expired slot' });
        }
        const newExpiresAt = new Date(slot.expiresAt);
        newExpiresAt.setDate(newExpiresAt.getDate() + constants_1.SLOT_EXTENSION_DAYS);
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { decrement: constants_1.SLOT_EXTENSION_COST } },
            }),
            prisma_1.default.miningSlot.update({
                where: { id: slot.id },
                data: { expiresAt: newExpiresAt },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.SLOT_EXTENSION,
                    amount: -constants_1.SLOT_EXTENSION_COST,
                    description: `Extended mining slot by ${constants_1.SLOT_EXTENSION_DAYS} days`,
                    ipAddress: ipAddress,
                },
            }),
            prisma_1.default.user.update({
                where: { id: user.id },
                data: { totalInvested: { increment: constants_1.SLOT_EXTENSION_COST } },
            }),
        ]);
        res.status(200).json({ message: `Slot extended by ${constants_1.SLOT_EXTENSION_DAYS} days.` });
    }
    catch (error) {
        console.error(`Error extending slot for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.extendSlot = extendSlot;
// POST /api/user/:telegramId/buy-booster
const buyBooster = async (req, res) => {
    const { telegramId } = req.params;
    const { boosterId } = req.body;
    const ipAddress = req.ip;
    try {
        const booster = await prisma_1.default.booster.findUnique({ where: { boosterId } });
        if (!booster)
            return res.status(404).json({ error: 'Booster not found' });
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelect, // Use the reusable userSelect
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const cfmWallet = user.wallets.find((w) => w.currency === 'CFM');
        if (!cfmWallet || cfmWallet.balance < booster.price)
            return res.status(400).json({ error: 'Insufficient funds' });
        // Find the first active slot to apply the booster
        const activeSlot = user.miningSlots.find((s) => s.isActive && new Date(s.expiresAt) > new Date());
        if (!activeSlot)
            return res.status(400).json({ error: 'No active mining slot found to apply booster.' });
        let powerIncrease = booster.powerIncrease;
        if (user.rank) {
            powerIncrease += constants_1.RANK_SLOT_RATE_BONUS_PERCENTAGE;
        }
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({ where: { id: cfmWallet.id }, data: { balance: { decrement: booster.price } } }),
            prisma_1.default.miningSlot.update({ where: { id: activeSlot.id }, data: { effectiveWeeklyRate: { increment: powerIncrease } } }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.BOOSTER_PURCHASE,
                    amount: -booster.price,
                    description: `Purchased booster: ${booster.name}`,
                    ipAddress: ipAddress,
                },
            }),
            prisma_1.default.user.update({
                where: { id: user.id },
                data: { totalInvested: { increment: booster.price } },
            }),
        ]);
        res.status(200).json({ message: 'Booster purchased successfully' });
    }
    catch (error) {
        console.error(`Error purchasing booster for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.buyBooster = buyBooster;
// POST /api/user/:telegramId/reinvest
const reinvestEarnings = async (req, res) => {
    const { telegramId } = req.params;
    const ipAddress = req.ip;
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelect, // Use the reusable userSelect
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const cfmWallet = user.wallets.find((w) => w.currency === 'CFM');
        if (!cfmWallet) {
            return res.status(400).json({ error: 'CFM wallet not found' });
        }
        if (cfmWallet.balance < constants_1.REINVESTMENT_AMOUNT) {
            return res.status(400).json({ error: `Insufficient funds for reinvestment. Requires ${constants_1.REINVESTMENT_AMOUNT} CFM.` });
        }
        // Find the first active slot for reinvestment
        const targetSlot = user.miningSlots.find((s) => s.isActive && new Date(s.expiresAt) > new Date());
        if (!targetSlot) {
            return res.status(400).json({ error: 'No active mining slot found for reinvestment.' });
        }
        let bonusRateIncrease = constants_1.REINVESTMENT_BONUS_PERCENTAGE;
        if (user.rank) {
            bonusRateIncrease += constants_1.RANK_SLOT_RATE_BONUS_PERCENTAGE;
        }
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { decrement: constants_1.REINVESTMENT_AMOUNT } },
            }),
            prisma_1.default.miningSlot.update({
                where: { id: targetSlot.id },
                data: { effectiveWeeklyRate: { increment: bonusRateIncrease } },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.REINVESTMENT,
                    amount: -constants_1.REINVESTMENT_AMOUNT,
                    description: `Reinvested ${constants_1.REINVESTMENT_AMOUNT} CFM into mining slot for +${(bonusRateIncrease * 100).toFixed(2)}% weekly rate.`,
                    ipAddress: ipAddress,
                },
            }),
        ]);
        res.status(200).json({ message: `Successfully reinvested ${constants_1.REINVESTMENT_AMOUNT} CFM.` });
    }
    catch (error) {
        console.error(`Error reinvesting earnings for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.reinvestEarnings = reinvestEarnings;
// POST /api/user/:telegramId/slots/:slotId/upgrade
const upgradeSlot = async (req, res) => {
    const { telegramId, slotId } = req.params;
    const { amount } = req.body;
    const ipAddress = req.ip;
    if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ error: 'Invalid upgrade amount' });
    }
    try {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            select: dbSelects_1.userSelect, // Use the reusable userSelect
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const cfmWallet = user.wallets.find((w) => w.currency === 'CFM');
        if (!cfmWallet || cfmWallet.balance < amount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        const slot = user.miningSlots.find((s) => s.id === slotId);
        if (!slot) {
            return res.status(404).json({ error: 'Slot not found or not active' });
        }
        if (!slot.isActive || new Date(slot.expiresAt) < new Date()) {
            return res.status(400).json({ error: 'Cannot upgrade an inactive or expired slot' });
        }
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { decrement: amount } },
            }),
            prisma_1.default.miningSlot.update({
                where: { id: slot.id },
                data: { principal: { increment: amount } },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.REINVESTMENT, // Re-using this type for upgrades
                    amount: -amount,
                    description: `Upgraded slot principal with ${amount.toFixed(2)} CFM.`,
                    ipAddress: ipAddress,
                },
            }),
            prisma_1.default.user.update({
                where: { id: user.id },
                data: { totalInvested: { increment: amount } },
            }),
        ]);
        res.status(200).json({ message: `Slot upgraded successfully with ${amount.toFixed(2)} CFM.` });
    }
    catch (error) {
        console.error(`Error upgrading slot for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.upgradeSlot = upgradeSlot;
