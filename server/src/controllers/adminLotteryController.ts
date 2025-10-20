import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { ActivityLogType } from '@prisma/client';

// GET /api/admin/lottery/participants - Get all lottery participants with ticket counts
export const getLotteryParticipants = async (req: Request, res: Response) => {
  try {
    const currentLottery = await prisma.lottery.findFirst({
      where: { isDrawn: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentLottery) {
      return res.status(404).json({ error: 'No active lottery found' });
    }

    const participants = await prisma.user.findMany({
      where: {
        lotteryTickets: {
          some: { lotteryId: currentLottery.id }
        }
      },
      include: {
        wallets: {
          where: { currency: 'USD' }
        },
        lotteryTickets: {
          where: { lotteryId: currentLottery.id },
          select: {
            id: true,
            numbers: true,
            isWinner: true,
            prizeAmount: true,
            // isAdminSelected: true, // Temporarily disabled until database schema is fixed
            createdAt: true,
          }
        },
        _count: {
          select: {
            lotteryTickets: {
              where: { lotteryId: currentLottery.id }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const participantsWithStats = participants.map(participant => ({
      id: participant.id,
      telegramId: participant.telegramId,
      firstName: participant.firstName,
      username: participant.username,
      USDBalance: participant.wallets[0]?.balance || 0,
      ticketCount: participant._count.lotteryTickets,
      tickets: participant.lotteryTickets,
      isWinner: participant.lotteryTickets.some(ticket => ticket.isWinner),
      totalWinnings: participant.lotteryTickets
        .filter(ticket => ticket.isWinner)
        .reduce((sum, ticket) => sum + (ticket.prizeAmount || 0), 0),
    }));

    res.status(200).json({
      lottery: currentLottery,
      participants: participantsWithStats,
    });
  } catch (error) {
    console.error('Error fetching lottery participants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/lottery/select-winner - Manually select lottery winner
export const selectLotteryWinner = async (req: Request, res: Response) => {
  const { ticketId, prizeAmount } = req.body;
  const adminUserId = (req as { user?: { id: string } }).user?.id;

  if (!ticketId || typeof prizeAmount !== 'number' || prizeAmount < 0) {
    return res.status(400).json({ error: 'Invalid ticket ID or prize amount' });
  }

  try {
    const ticket = await prisma.lotteryTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          include: { wallets: { where: { currency: 'USD' } } }
        },
        lottery: true
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    if (ticket.lottery?.isDrawn) {
      return res.status(400).json({ error: 'Lottery has already been drawn' });
    }

    const USDWallet = ticket.user.wallets[0];
    if (!USDWallet) {
      return res.status(400).json({ error: 'User USD wallet not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Update ticket as winner
      await tx.lotteryTicket.update({
        where: { id: ticketId },
        data: {
          isWinner: true,
          prizeAmount,
          // isAdminSelected: true, // Temporarily disabled until database schema is fixed
        },
      });

      // Add prize to user's wallet
      await tx.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { increment: prizeAmount } },
      });

      // Log the win
      await tx.activityLog.create({
        data: {
          userId: ticket.userId,
          type: ActivityLogType.ADMIN_LOTTERY_WIN,
          amount: prizeAmount,
          description: `Admin-selected lottery winner - Prize: ${prizeAmount.toFixed(4)} USD`,
          sourceUserId: adminUserId,
        },
      });
    });

    res.status(200).json({
      message: 'Winner selected successfully',
      ticketId,
      prizeAmount,
      user: {
        id: ticket.user.id,
        firstName: ticket.user.firstName,
        username: ticket.user.username,
      }
    });
  } catch (error) {
    console.error('Error selecting lottery winner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/lottery/remove-winner - Remove winner status from ticket
export const removeLotteryWinner = async (req: Request, res: Response) => {
  const { ticketId } = req.body;
  const adminUserId = (req as { user?: { id: string } }).user?.id;

  if (!ticketId) {
    return res.status(400).json({ error: 'Ticket ID is required' });
  }

  try {
    const ticket = await prisma.lotteryTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          include: { wallets: { where: { currency: 'USD' } } }
        }
      }
    });

    if (!ticket || !ticket.isWinner) {
      return res.status(404).json({ error: 'Winning ticket not found' });
    }

    const USDWallet = ticket.user.wallets[0];
    if (!USDWallet) {
      return res.status(400).json({ error: 'User USD wallet not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Remove prize from user's wallet
      await tx.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { decrement: ticket.prizeAmount || 0 } },
      });

      // Reset ticket
      await tx.lotteryTicket.update({
        where: { id: ticketId },
        data: {
          isWinner: false,
          prizeAmount: null,
          // isAdminSelected: false, // Temporarily disabled until database schema is fixed
        },
      });

      // Log the removal
      await tx.activityLog.create({
        data: {
          userId: ticket.userId,
          type: ActivityLogType.ADMIN_LOTTERY_WIN,
          amount: -(ticket.prizeAmount || 0),
          description: `Admin removed lottery win - Prize removed: ${(ticket.prizeAmount || 0).toFixed(4)} USD`,
          sourceUserId: adminUserId,
        },
      });
    });

    res.status(200).json({
      message: 'Winner status removed successfully',
      ticketId,
      prizeRemoved: ticket.prizeAmount,
    });
  } catch (error) {
    console.error('Error removing lottery winner:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/lottery/complete-draw - Complete the lottery draw
export const completeLotteryDraw = async (req: Request, res: Response) => {
  // const adminUserId = (req as { user?: { id: string } }).user?.id; // Unused variable removed

  try {
    const currentLottery = await prisma.lottery.findFirst({
      where: { isDrawn: false },
      orderBy: { createdAt: 'desc' },
      include: {
        tickets: {
          where: { isWinner: true },
          include: { user: true }
        }
      }
    });

    if (!currentLottery) {
      return res.status(404).json({ error: 'No active lottery found' });
    }

    const totalPrizes = currentLottery.tickets.reduce(
      (sum, ticket) => sum + (ticket.prizeAmount || 0), 
      0
    );

    await prisma.lottery.update({
      where: { id: currentLottery.id },
      data: { 
        isDrawn: true,
        winningNumbers: 'ADMIN_SELECTED', // Mark as admin-selected
      },
    });

    res.status(200).json({
      message: 'Lottery draw completed successfully',
      lotteryId: currentLottery.id,
      totalWinners: currentLottery.tickets.length,
      totalPrizes,
      winners: currentLottery.tickets.map(ticket => ({
        userId: ticket.userId,
        firstName: ticket.user.firstName,
        username: ticket.user.username,
        prizeAmount: ticket.prizeAmount,
      }))
    });
  } catch (error) {
    console.error('Error completing lottery draw:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/admin/lottery/stats - Get lottery statistics
export const getLotteryStats = async (req: Request, res: Response) => {
  try {
    const currentLottery = await prisma.lottery.findFirst({
      where: { isDrawn: false },
      orderBy: { createdAt: 'desc' },
      include: {
        tickets: {
          include: { user: true }
        }
      }
    });

    if (!currentLottery) {
      return res.status(404).json({ error: 'No active lottery found' });
    }

    const totalTickets = currentLottery.tickets.length;
    const totalParticipants = new Set(currentLottery.tickets.map(t => t.userId)).size;
    const totalRevenue = totalTickets * 1.0; // 1 USD per ticket
    const winners = currentLottery.tickets.filter(t => t.isWinner);
    const totalPrizes = winners.reduce((sum, t) => sum + (t.prizeAmount || 0), 0);

    // Generate fake top 10 winners for display
    const fakeWinners = generateFakeWinners(10);

    const stats = {
      lotteryId: currentLottery.id,
      jackpot: currentLottery.jackpot,
      drawDate: currentLottery.drawDate,
      totalTickets,
      totalParticipants,
      totalRevenue,
      winnersCount: winners.length,
      totalPrizes,
      adminSelectedWinners: winners.length,
      remainingJackpot: currentLottery.jackpot - totalPrizes,
      fakeTopWinners: fakeWinners, // Fake winners for public display
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching lottery stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate fake winners for public display
const generateFakeWinners = (count: number) => {
  const fakeNames = [
    'Alex', 'Maria', 'John', 'Anna', 'David', 'Elena', 'Mike', 'Sofia', 'Tom', 'Lisa',
    'Chris', 'Nina', 'Sam', 'Kate', 'Nick', 'Olga', 'Dan', 'Irina', 'Max', 'Tanya'
  ];
  
  const fakeWinners = [];
  for (let i = 0; i < count; i++) {
    fakeWinners.push({
      position: i + 1,
      name: fakeNames[Math.floor(Math.random() * fakeNames.length)],
      prize: Math.floor(Math.random() * 1000) + 100, // Random prize between 100-1100
      isFake: true
    });
  }
  
  return fakeWinners.sort((a, b) => b.prize - a.prize);
};

