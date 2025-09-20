"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLotteryHistory = exports.getLastDrawResults = exports.getUserLotteryTickets = exports.buyLotteryTicket = exports.getLotteryStatus = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const constants_1 = require("../constants");
const client_1 = require("@prisma/client");
// A helper function to get or create the current lottery
const getCurrentLottery = async () => {
    let lottery = await prisma_1.default.lottery.findFirst({
        where: { isDrawn: false },
        orderBy: { createdAt: 'desc' },
    });
    if (!lottery) {
        const drawDate = new Date();
        drawDate.setHours(drawDate.getHours() + constants_1.LOTTERY_DRAW_INTERVAL_HOURS);
        lottery = await prisma_1.default.lottery.create({
            data: {
                drawDate,
                jackpot: constants_1.LOTTERY_JACKPOT_SEED,
            },
        });
    }
    return lottery;
};
const performLotteryDraw = async (lotteryId) => {
    const lottery = await prisma_1.default.lottery.findUnique({ where: { id: lotteryId } });
    if (!lottery || lottery.isDrawn)
        return;
    // 1. Generate winning numbers
    const winningNumbers = new Set();
    while (winningNumbers.size < 6) {
        winningNumbers.add(Math.floor(Math.random() * 49) + 1);
    }
    const winningNumbersArray = Array.from(winningNumbers).sort((a, b) => a - b);
    const winningNumbersString = winningNumbersArray.join(',');
    // 2. Find tickets and winners
    const tickets = await prisma_1.default.lotteryTicket.findMany({ where: { lotteryId } });
    const winners = [];
    for (const ticket of tickets) {
        const userNumbers = ticket.numbers.split(',').map(Number);
        const matches = userNumbers.filter(num => winningNumbers.has(num)).length;
        if (matches >= 4) {
            winners.push({ ticket, matches });
        }
    }
    // 3. Distribute prizes
    const winnersByTier = { 6: [], 5: [], 4: [] };
    winners.forEach(w => winnersByTier[w.matches].push(w.ticket));
    const prizeDistribution = {
        6: lottery.jackpot * constants_1.LOTTERY_PRIZE_DISTRIBUTION.MATCH_6,
        5: lottery.jackpot * constants_1.LOTTERY_PRIZE_DISTRIBUTION.MATCH_5,
        4: lottery.jackpot * constants_1.LOTTERY_PRIZE_DISTRIBUTION.MATCH_4,
    };
    await prisma_1.default.$transaction(async (tx) => {
        // Update lottery status
        await tx.lottery.update({
            where: { id: lotteryId },
            data: { isDrawn: true, winningNumbers: winningNumbersString },
        });
        // Distribute prizes for each tier
        for (const tier of [6, 5, 4]) {
            const tierWinners = winnersByTier[tier];
            if (tierWinners.length > 0) {
                const totalPrizeForTier = prizeDistribution[tier];
                const prizePerWinner = totalPrizeForTier / tierWinners.length;
                for (const winnerTicket of tierWinners) {
                    // Update wallet
                    await tx.wallet.updateMany({
                        where: { userId: winnerTicket.userId, currency: 'CFM' },
                        data: { balance: { increment: prizePerWinner } },
                    });
                    // Update ticket
                    await tx.lotteryTicket.update({
                        where: { id: winnerTicket.id },
                        data: { isWinner: true, prizeAmount: prizePerWinner },
                    });
                    // Create activity log
                    await tx.activityLog.create({
                        data: {
                            userId: winnerTicket.userId,
                            type: client_1.ActivityLogType.LOTTERY_WIN,
                            amount: prizePerWinner,
                            description: `Won lottery prize for matching ${tier} numbers.`,
                        },
                    });
                }
            }
        }
    });
    // console.log(`[LOTTERY] Draw for lottery ${lotteryId} completed. Winning numbers: ${winningNumbersString}`); // Removed log
};
// GET /api/lottery/status
const getLotteryStatus = async (req, res) => {
    try {
        const overdueLottery = await prisma_1.default.lottery.findFirst({
            where: { isDrawn: false, drawDate: { lt: new Date() } },
        });
        if (overdueLottery) {
            await performLotteryDraw(overdueLottery.id);
        }
        const lottery = await getCurrentLottery();
        res.status(200).json(lottery);
    }
    catch (error) {
        console.error('Error fetching lottery status:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLotteryStatus = getLotteryStatus;
// POST /api/lottery/:telegramId/buy
const buyLotteryTicket = async (req, res) => {
    const { telegramId } = req.params;
    const { numbers } = req.body; // Expecting an array of numbers
    if (!Array.isArray(numbers) || numbers.length !== 6) {
        return res.status(400).json({ error: 'You must select exactly 6 numbers.' });
    }
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId }, include: { wallets: true } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        if (!cfmWallet || cfmWallet.balance < constants_1.LOTTERY_TICKET_COST) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }
        const lottery = await getCurrentLottery();
        const numbersString = numbers.sort((a, b) => a - b).join(',');
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({
                where: { id: cfmWallet.id },
                data: { balance: { decrement: constants_1.LOTTERY_TICKET_COST } },
            }),
            prisma_1.default.lottery.update({
                where: { id: lottery.id },
                data: { jackpot: { increment: constants_1.LOTTERY_TICKET_COST * constants_1.LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE } },
            }),
            prisma_1.default.lotteryTicket.create({
                data: {
                    userId: user.id,
                    lotteryId: lottery.id,
                    numbers: numbersString,
                },
            }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: client_1.ActivityLogType.LOTTERY_TICKET_PURCHASE,
                    amount: -constants_1.LOTTERY_TICKET_COST,
                    description: `Purchased lottery ticket for draw on ${lottery.drawDate.toLocaleDateString()}`,
                },
            }),
        ]);
        res.status(201).json({ message: 'Lottery ticket purchased successfully!' });
    }
    catch (error) {
        console.error(`Error buying lottery ticket for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.buyLotteryTicket = buyLotteryTicket;
// GET /api/lottery/:telegramId/tickets
const getUserLotteryTickets = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const lottery = await getCurrentLottery();
        const tickets = await prisma_1.default.lotteryTicket.findMany({
            where: {
                userId: user.id,
                lotteryId: lottery.id,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json(tickets);
    }
    catch (error) {
        console.error(`Error fetching lottery tickets for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getUserLotteryTickets = getUserLotteryTickets;
// GET /api/lottery/last-draw
const getLastDrawResults = async (req, res) => {
    try {
        const lastDrawnLottery = await prisma_1.default.lottery.findFirst({
            where: { isDrawn: true },
            orderBy: { drawDate: 'desc' },
        });
        res.status(200).json(lastDrawnLottery);
    }
    catch (error) {
        console.error('Error fetching last draw results:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLastDrawResults = getLastDrawResults;
// GET /api/lottery/:telegramId/history
const getLotteryHistory = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const pastDraws = await prisma_1.default.lottery.findMany({
            where: { isDrawn: true },
            orderBy: { drawDate: 'desc' },
            take: 10, // Limit to last 10 draws for performance
            include: {
                tickets: {
                    where: { userId: user.id },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        res.status(200).json(pastDraws);
    }
    catch (error) {
        console.error(`Error fetching lottery history for user ${telegramId}:`, error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getLotteryHistory = getLotteryHistory;
