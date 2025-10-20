import { ActivityLogType } from '@prisma/client';
import { Request, Response } from 'express';
import { LOTTERY_DRAW_INTERVAL_HOURS, LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE, LOTTERY_JACKPOT_SEED, LOTTERY_PRIZE_DISTRIBUTION, LOTTERY_TICKET_COST } from '../constants.js';
import prisma from '../prisma.js';

// A helper function to get or create the current lottery
const getCurrentLottery = async () => {
  console.log('[LOTTERY] Getting current lottery...');

  let lottery = await prisma.lottery.findFirst({
    where: { isDrawn: false },
    orderBy: { createdAt: 'desc' },
  });

  console.log('[LOTTERY] Found existing lottery:', !!lottery);

  if (!lottery) {
    console.log('[LOTTERY] Creating new lottery...');
    const drawDate = new Date();
    drawDate.setHours(drawDate.getHours() + LOTTERY_DRAW_INTERVAL_HOURS);

    console.log('[LOTTERY] Draw date:', drawDate);
    console.log('[LOTTERY] Jackpot seed:', LOTTERY_JACKPOT_SEED);

    lottery = await prisma.lottery.create({
      data: {
        drawDate,
        jackpot: LOTTERY_JACKPOT_SEED,
      },
    });

    console.log('[LOTTERY] New lottery created:', lottery.id);
  }

  console.log('[LOTTERY] Returning lottery:', lottery);
  return lottery;
};

const performLotteryDraw = async (lotteryId: string) => {
  const lottery = await prisma.lottery.findUnique({ where: { id: lotteryId } });
  if (!lottery || lottery.isDrawn) return;

  // 1. Generate winning numbers
  const winningNumbers = new Set<number>();
  while (winningNumbers.size < 6) {
    winningNumbers.add(Math.floor(Math.random() * 49) + 1);
  }
  const winningNumbersArray = Array.from(winningNumbers).sort((a, b) => a - b);
  const winningNumbersString = winningNumbersArray.join(',');

  // 2. Find tickets and winners
  const tickets = await prisma.lotteryTicket.findMany({ where: { lotteryId } });
  const winners: { ticket: { id: string; numbers: string | null; userId: string }; matches: number }[] = [];

  for (const ticket of tickets) {
    const userNumbers = ticket.numbers?.split(',').map(Number) || [];
    const matches = userNumbers.filter(num => winningNumbers.has(num)).length;
    if (matches >= 4) {
      winners.push({ ticket, matches });
    }
  }

  // 3. Distribute prizes
  const winnersByTier: { [key: number]: { ticket: { id: string; numbers: string | null; userId: string }; matches: number }[] } = { 6: [], 5: [], 4: [] };
  winners.forEach(w => winnersByTier[w.matches].push(w));

  const prizeDistribution = {
    6: lottery.jackpot * LOTTERY_PRIZE_DISTRIBUTION.MATCH_6,
    5: lottery.jackpot * LOTTERY_PRIZE_DISTRIBUTION.MATCH_5,
    4: lottery.jackpot * LOTTERY_PRIZE_DISTRIBUTION.MATCH_4,
  };

  await prisma.$transaction(async (tx) => {
    // Update lottery status
    await tx.lottery.update({
      where: { id: lotteryId },
      data: { isDrawn: true, winningNumbers: winningNumbersString },
    });

    // Distribute prizes for each tier
    for (const tier of [6, 5, 4]) {
      const tierWinners = winnersByTier[tier];
      if (tierWinners.length > 0) {
        const totalPrizeForTier = prizeDistribution[tier as keyof typeof prizeDistribution];
        const prizePerWinner = totalPrizeForTier / tierWinners.length;

        for (const winnerTicket of tierWinners) {
          // Update wallet
          await tx.wallet.updateMany({
            where: { userId: winnerTicket.ticket.userId, currency: 'USD' },
            data: { balance: { increment: prizePerWinner } },
          });
          // Update ticket
          await tx.lotteryTicket.update({
            where: { id: winnerTicket.ticket.id },
            data: { isWinner: true, prizeAmount: prizePerWinner },
          });
          // Create activity log
          await tx.activityLog.create({
            data: {
              userId: winnerTicket.ticket.userId,
              type: ActivityLogType.LOTTERY_WIN,
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
export const getLotteryStatus = async (req: Request, res: Response) => {
  try {
    console.log('[LOTTERY] Fetching lottery status...');

    const overdueLottery = await prisma.lottery.findFirst({
      where: { isDrawn: false, drawDate: { lt: new Date() } },
    });

    if (overdueLottery) {
      console.log('[LOTTERY] Found overdue lottery, performing draw...');
      await performLotteryDraw(overdueLottery.id);
    }

    console.log('[LOTTERY] Getting current lottery...');
    const lottery = await getCurrentLottery();
    console.log('[LOTTERY] Current lottery:', lottery);

    res.status(200).json(lottery);
  } catch (error) {
    console.error('Error fetching lottery status:', error);
    console.error('Error details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/lottery/:telegramId/buy
export const buyLotteryTicket = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { numbers } = req.body; // Expecting an array of numbers

  if (!Array.isArray(numbers) || numbers.length !== 6) {
    return res.status(400).json({ error: 'You must select exactly 6 numbers.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { telegramId }, include: { wallets: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet || USDWallet.balance < LOTTERY_TICKET_COST) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const lottery = await getCurrentLottery();
    const numbersString = numbers.sort((a, b) => a - b).join(',');

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { decrement: LOTTERY_TICKET_COST } },
      }),
      prisma.lottery.update({
        where: { id: lottery.id },
        data: { jackpot: { increment: LOTTERY_TICKET_COST * LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE } },
      }),
      prisma.lotteryTicket.create({
        data: {
          userId: user.id,
          lotteryId: lottery.id,
          numbers: numbersString,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.LOTTERY_TICKET_PURCHASE,
          amount: -LOTTERY_TICKET_COST,
          description: `Purchased lottery ticket for draw on ${lottery.drawDate.toLocaleDateString()}`,
        },
      }),
    ]);

    res.status(201).json({ message: 'Lottery ticket purchased successfully!' });
  } catch (error) {
    console.error(`Error buying lottery ticket for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/lottery/:telegramId/tickets
export const getUserLotteryTickets = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const lottery = await getCurrentLottery();

    const tickets = await prisma.lotteryTicket.findMany({
      where: {
        userId: user.id,
        lotteryId: lottery.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(tickets);
  } catch (error) {
    console.error(`Error fetching lottery tickets for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/lottery/last-draw
export const getLastDrawResults = async (req: Request, res: Response) => {
  try {
    const lastDrawnLottery = await prisma.lottery.findFirst({
      where: { isDrawn: true },
      orderBy: { drawDate: 'desc' },
    });
    res.status(200).json(lastDrawnLottery);
  } catch (error) {
    console.error('Error fetching last draw results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/lottery/:telegramId/history
export const getLotteryHistory = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const pastDraws = await prisma.lottery.findMany({
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
  } catch (error) {
    console.error(`Error fetching lottery history for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
