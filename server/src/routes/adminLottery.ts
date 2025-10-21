import { Router } from 'express';
import {
  completeLotteryDraw,
  getLotteryParticipants,
  getLotteryStats,
  removeLotteryWinner,
  selectLotteryWinner
} from '../controllers/adminLotteryController.js';
import { isAdmin } from '../middleware-stubs.js';
import prisma from '../prisma.js';

const router = Router();

// All routes will be protected by admin middleware
router.get('/participants', isAdmin, getLotteryParticipants);
router.post('/select-winner', isAdmin, selectLotteryWinner);
router.post('/remove-winner', isAdmin, removeLotteryWinner);
router.post('/complete-draw', isAdmin, completeLotteryDraw);
router.get('/stats', isAdmin, getLotteryStats);

// Additional endpoints for the new admin interface
router.get('/current', isAdmin, async (req, res) => {
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
      return res.json({ success: true, data: null });
    }

    const totalTickets = await prisma.lotteryTicket.count({
      where: { lotteryId: currentLottery.id }
    });

    const totalParticipants = await prisma.user.count({
      where: {
        lotteryTickets: {
          some: { lotteryId: currentLottery.id }
        }
      }
    });

    const winner = currentLottery.tickets[0]?.user;

    res.json({
      success: true,
      data: {
        id: currentLottery.id,
        status: currentLottery.isDrawn ? 'COMPLETED' : 'ACTIVE',
        jackpot: currentLottery.jackpot,
        participants: totalParticipants,
        tickets: totalTickets,
        startDate: currentLottery.createdAt,
        endDate: currentLottery.drawDate,
        winner: winner ? {
          id: winner.id,
          firstName: winner.firstName,
          username: winner.username,
          ticketId: currentLottery.tickets[0].id
        } : null
      }
    });
  } catch (error) {
    console.error('Error fetching current lottery:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch lottery data' });
  }
});

router.get('/tickets', isAdmin, async (req, res) => {
  try {
    const currentLottery = await prisma.lottery.findFirst({
      where: { isDrawn: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentLottery) {
      return res.json({ success: true, data: { tickets: [] } });
    }

    const tickets = await prisma.lotteryTicket.findMany({
      where: { lotteryId: currentLottery.id },
      include: {
        user: {
          select: {
            firstName: true,
            username: true,
            telegramId: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        tickets: tickets.map(ticket => ({
          id: ticket.id,
          userId: ticket.userId,
          user: ticket.user,
          numbers: ticket.numbers,
          purchaseDate: ticket.createdAt,
          isWinner: ticket.isWinner
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching lottery tickets:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tickets' });
  }
});

// New endpoint to get participants grouped by user with their tickets
router.get('/participants-grouped', isAdmin, async (req, res) => {
  try {
    const currentLottery = await prisma.lottery.findFirst({
      where: { isDrawn: false },
      orderBy: { createdAt: 'desc' }
    });

    if (!currentLottery) {
      return res.json({ success: true, data: { participants: [] } });
    }

    const participants = await prisma.user.findMany({
      where: {
        lotteryTickets: {
          some: { lotteryId: currentLottery.id }
        }
      },
      include: {
        lotteryTickets: {
          where: { lotteryId: currentLottery.id },
          select: {
            id: true,
            numbers: true,
            isWinner: true,
            prizeAmount: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    const participantsWithTickets = participants.map(participant => ({
      id: participant.id,
      firstName: participant.firstName,
      username: participant.username,
      telegramId: participant.telegramId,
      ticketCount: participant.lotteryTickets.length,
      tickets: participant.lotteryTickets.map(ticket => ({
        id: ticket.id,
        numbers: ticket.numbers,
        isWinner: ticket.isWinner,
        prizeAmount: ticket.prizeAmount,
        purchaseDate: ticket.createdAt
      })),
      hasWinningTicket: participant.lotteryTickets.some(ticket => ticket.isWinner)
    }));

    res.json({
      success: true,
      data: {
        participants: participantsWithTickets,
        totalParticipants: participantsWithTickets.length,
        totalTickets: participantsWithTickets.reduce((sum, p) => sum + p.ticketCount, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching grouped participants:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch participants' });
  }
});

router.post('/award-prize', isAdmin, selectLotteryWinner);

export default router;
