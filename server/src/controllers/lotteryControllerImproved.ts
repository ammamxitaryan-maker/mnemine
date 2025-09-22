import { Request, Response } from 'express';
import prisma from '../prisma';
import { LOTTERY_TICKET_COST, LOTTERY_DRAW_INTERVAL_HOURS, LOTTERY_JACKPOT_SEED, LOTTERY_JACKPOT_CONTRIBUTION_PERCENTAGE, LOTTERY_PRIZE_DISTRIBUTION } from '../constants';
import { ActivityLogType } from '@prisma/client';
import { validateLotteryRequest, validateDatabaseTransaction, sanitizeString } from '../utils/advancedValidation';
import { ResponseHelper } from '../utils/responseHelpers';

// Enhanced lottery number generation with better randomness
const generateWinningNumbers = (): number[] => {
  const numbers = new Set<number>();
  
  // Use crypto.getRandomValues for better randomness if available
  const getRandomInt = (min: number, max: number): number => {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return min + (array[0] % (max - min + 1));
    }
    // Fallback to Math.random
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };
  
  while (numbers.size < 6) {
    numbers.add(getRandomInt(1, 49));
  }
  
  return Array.from(numbers).sort((a, b) => a - b);
};

// Enhanced lottery draw with better error handling
const performLotteryDraw = async (lotteryId: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const lottery = await prisma.lottery.findUnique({ 
      where: { id: lotteryId },
      include: { tickets: true }
    });
    
    if (!lottery || lottery.isDrawn) {
      return { success: false, error: 'Lottery not found or already drawn' };
    }

    // Enhanced winning number generation
    const winningNumbersArray = generateWinningNumbers();
    const winningNumbersString = winningNumbersArray.join(',');

    // Enhanced winner detection with better performance
    const tickets = lottery.tickets;
    const winners: { ticket: any; matches: number }[] = [];

    for (const ticket of tickets) {
      try {
        const userNumbers = ticket.numbers.split(',').map(Number);
        
        // Validate user numbers
        if (userNumbers.length !== 6 || userNumbers.some(num => isNaN(num) || num < 1 || num > 49)) {
          console.warn(`Invalid ticket numbers for ticket ${ticket.id}: ${ticket.numbers}`);
          continue;
        }
        
        const matches = userNumbers.filter(num => winningNumbersArray.includes(num)).length;
        if (matches >= 4) {
          winners.push({ ticket, matches });
        }
      } catch (error) {
        console.error(`Error processing ticket ${ticket.id}:`, error);
        continue;
      }
    }

    // Enhanced prize distribution with overflow protection
    const winnersByTier: { [key: number]: any[] } = { 6: [], 5: [], 4: [] };
    winners.forEach(w => winnersByTier[w.matches].push(w.ticket));

    const prizeDistribution = {
      6: lottery.jackpot * LOTTERY_PRIZE_DISTRIBUTION.MATCH_6,
      5: lottery.jackpot * LOTTERY_PRIZE_DISTRIBUTION.MATCH_5,
      4: lottery.jackpot * LOTTERY_PRIZE_DISTRIBUTION.MATCH_4,
    };

    // Enhanced transaction with proper error handling
    const transactionResult = await validateDatabaseTransaction(async () => {
      return await prisma.$transaction(async (tx) => {
        // Update lottery status
        await tx.lottery.update({
          where: { id: lotteryId },
          data: { isDrawn: true, winningNumbers: winningNumbersString },
        });

        // Distribute prizes for each tier with enhanced validation
        for (const tier of [6, 5, 4]) {
          const tierWinners = winnersByTier[tier];
          if (tierWinners.length > 0) {
            const totalPrizeForTier = prizeDistribution[tier as keyof typeof prizeDistribution];
            const prizePerWinner = totalPrizeForTier / tierWinners.length;

            // Validate prize amount
            if (prizePerWinner <= 0 || prizePerWinner > Number.MAX_SAFE_INTEGER) {
              throw new Error(`Invalid prize amount for tier ${tier}: ${prizePerWinner}`);
            }

            for (const winnerTicket of tierWinners) {
              // Get user's wallet with proper error handling
              const userWallet = await tx.wallet.findFirst({
                where: { userId: winnerTicket.userId, currency: 'CFM' }
              });

              if (!userWallet) {
                console.warn(`No CFM wallet found for user ${winnerTicket.userId}`);
                continue;
              }

              // Check for balance overflow
              const newBalance = userWallet.balance + prizePerWinner;
              if (newBalance > Number.MAX_SAFE_INTEGER) {
                throw new Error(`Balance would exceed maximum safe integer for user ${winnerTicket.userId}`);
              }

              // Update wallet
              await tx.wallet.update({
                where: { id: userWallet.id },
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
                  type: ActivityLogType.LOTTERY_WIN,
                  amount: prizePerWinner,
                  description: `Won lottery prize for matching ${tier} numbers.`,
                },
              });
            }
          }
        }

        return { success: true };
      });
    });

    if (!transactionResult.success) {
      return { success: false, error: transactionResult.error };
    }

    console.log(`[LOTTERY] Draw for lottery ${lotteryId} completed. Winning numbers: ${winningNumbersString}`);
    return { success: true };
  } catch (error) {
    console.error(`Error performing lottery draw for ${lotteryId}:`, error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Enhanced get current lottery with better error handling
const getCurrentLottery = async (): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    let lottery = await prisma.lottery.findFirst({
      where: { isDrawn: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!lottery) {
      const drawDate = new Date();
      drawDate.setHours(drawDate.getHours() + LOTTERY_DRAW_INTERVAL_HOURS);
      
      lottery = await prisma.lottery.create({
        data: {
          drawDate,
          jackpot: LOTTERY_JACKPOT_SEED,
        },
      });
    }

    return { success: true, data: lottery };
  } catch (error) {
    console.error('Error getting current lottery:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// GET /api/lottery/status
export const getLotteryStatus = async (req: Request, res: Response) => {
  try {
    // Check for overdue lotteries
    const overdueLottery = await prisma.lottery.findFirst({
      where: { isDrawn: false, drawDate: { lt: new Date() } },
    });

    if (overdueLottery) {
      const drawResult = await performLotteryDraw(overdueLottery.id);
      if (!drawResult.success) {
        console.error(`Failed to draw overdue lottery ${overdueLottery.id}:`, drawResult.error);
      }
    }

    const lotteryResult = await getCurrentLottery();
    if (!lotteryResult.success) {
      return ResponseHelper.internalError(res, lotteryResult.error || 'Failed to get lottery status');
    }

    ResponseHelper.success(res, lotteryResult.data);
  } catch (error) {
    console.error('Error fetching lottery status:', error);
    ResponseHelper.internalError(res, 'Internal server error');
  }
};

// POST /api/lottery/:telegramId/buy
export const buyLotteryTicket = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { numbers } = req.body;

  try {
    const sanitizedTelegramId = sanitizeString(telegramId, 50);
    if (!sanitizedTelegramId) {
      return ResponseHelper.badRequest(res, 'Invalid telegram ID');
    }

    // Enhanced number validation
    if (!Array.isArray(numbers) || numbers.length !== 6) {
      return ResponseHelper.badRequest(res, 'You must select exactly 6 numbers.');
    }

    // Validate each number
    for (const num of numbers) {
      if (typeof num !== 'number' || !Number.isInteger(num) || num < 1 || num > 49) {
        return ResponseHelper.badRequest(res, 'All numbers must be integers between 1 and 49.');
      }
    }

    // Check for duplicates
    const uniqueNumbers = new Set(numbers);
    if (uniqueNumbers.size !== 6) {
      return ResponseHelper.badRequest(res, 'Numbers must be unique.');
    }

    // Get user with enhanced error handling
    const user = await prisma.user.findUnique({ 
      where: { telegramId: sanitizedTelegramId }, 
      include: { wallets: true } 
    });
    
    if (!user) {
      return ResponseHelper.notFound(res, 'User not found');
    }

    const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
    if (!cfmWallet) {
      return ResponseHelper.badRequest(res, 'CFM wallet not found');
    }

    if (cfmWallet.balance < LOTTERY_TICKET_COST) {
      return ResponseHelper.badRequest(res, 'Insufficient funds');
    }

    // Get current lottery with enhanced error handling
    const lotteryResult = await getCurrentLottery();
    if (!lotteryResult.success) {
      return ResponseHelper.internalError(res, lotteryResult.error || 'Failed to get current lottery');
    }

    const lottery = lotteryResult.data;
    const numbersString = numbers.sort((a, b) => a - b).join(',');

    // Enhanced transaction with proper error handling
    const transactionResult = await validateDatabaseTransaction(async () => {
      return await prisma.$transaction([
        prisma.wallet.update({
          where: { id: cfmWallet.id },
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
    });

    if (!transactionResult.success) {
      return ResponseHelper.internalError(res, transactionResult.error || 'Transaction failed');
    }

    ResponseHelper.success(res, null, 'Lottery ticket purchased successfully!');
  } catch (error) {
    console.error(`Error buying lottery ticket for user ${telegramId}:`, error);
    ResponseHelper.internalError(res, 'Internal server error');
  }
};

// GET /api/lottery/:telegramId/tickets
export const getUserLotteryTickets = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  
  try {
    const sanitizedTelegramId = sanitizeString(telegramId, 50);
    if (!sanitizedTelegramId) {
      return ResponseHelper.badRequest(res, 'Invalid telegram ID');
    }

    const user = await prisma.user.findUnique({ where: { telegramId: sanitizedTelegramId } });
    if (!user) {
      return ResponseHelper.notFound(res, 'User not found');
    }

    const lotteryResult = await getCurrentLottery();
    if (!lotteryResult.success) {
      return ResponseHelper.internalError(res, lotteryResult.error || 'Failed to get current lottery');
    }

    const lottery = lotteryResult.data;

    const tickets = await prisma.lotteryTicket.findMany({
      where: {
        userId: user.id,
        lotteryId: lottery.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    ResponseHelper.success(res, tickets);
  } catch (error) {
    console.error(`Error fetching lottery tickets for user ${telegramId}:`, error);
    ResponseHelper.internalError(res, 'Internal server error');
  }
};

// GET /api/lottery/last-draw
export const getLastDrawResults = async (req: Request, res: Response) => {
  try {
    const lastDrawnLottery = await prisma.lottery.findFirst({
      where: { isDrawn: true },
      orderBy: { drawDate: 'desc' },
    });

    if (!lastDrawnLottery) {
      return ResponseHelper.notFound(res, 'No lottery draws found');
    }

    ResponseHelper.success(res, lastDrawnLottery);
  } catch (error) {
    console.error('Error fetching last draw results:', error);
    ResponseHelper.internalError(res, 'Internal server error');
  }
};

// GET /api/lottery/:telegramId/history
export const getLotteryHistory = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  
  try {
    const sanitizedTelegramId = sanitizeString(telegramId, 50);
    if (!sanitizedTelegramId) {
      return ResponseHelper.badRequest(res, 'Invalid telegram ID');
    }

    const user = await prisma.user.findUnique({ where: { telegramId: sanitizedTelegramId } });
    if (!user) {
      return ResponseHelper.notFound(res, 'User not found');
    }

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

    ResponseHelper.success(res, pastDraws);
  } catch (error) {
    console.error(`Error fetching lottery history for user ${telegramId}:`, error);
    ResponseHelper.internalError(res, 'Internal server error');
  }
};
