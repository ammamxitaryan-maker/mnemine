import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { LogContext, logger } from '../utils/logger.js';
import { ResponseHelper } from '../utils/validation.js';

// Process all active mining slots
export const processAllSlots = async (req: Request, res: Response) => {
  try {
    logger.business('Processing all active mining slots');

    const activeSlots = await prisma.miningSlot.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          include: {
            wallets: true
          }
        }
      }
    });

    let processedCount = 0;
    let totalEarnings = 0;

    for (const slot of activeSlots) {
      try {
        const earnings = await processSlot(slot);
        if (earnings > 0) {
          processedCount++;
          totalEarnings += earnings;
        }
      } catch (error) {
        logger.error(LogContext.BUSINESS, `Error processing slot ${slot.id}`, error);
      }
    }

    logger.business(`Processed ${processedCount} slots, total earnings: ${totalEarnings}`);

    ResponseHelper.success(res, {
      processedCount,
      totalEarnings,
      activeSlotsCount: activeSlots.length
    }, `Processed ${processedCount} mining slots`);

  } catch (error) {
    logger.error(LogContext.BUSINESS, 'Error processing all slots', error);
    ResponseHelper.internalError(res, 'Failed to process mining slots');
  }
};

// Process a single slot
export const processSlot = async (slot: {
  id: string;
  userId: string;
  lastAccruedAt: Date | null;
  startAt: Date;
  principal: number;
  effectiveWeeklyRate: number;
  isActive: boolean;
  user: {
    wallets: Array<{ id: string; currency: string; balance: number }>;
  };
}): Promise<number> => {
  const now = new Date();
  const lastAccrued = slot.lastAccruedAt || slot.startAt;
  const timeDiff = now.getTime() - lastAccrued.getTime();
  const hoursElapsed = timeDiff / (1000 * 60 * 60);

  if (hoursElapsed < 1) {
    return 0; // Minimum 1 hour between processing
  }

  const weeklyRate = slot.effectiveWeeklyRate || 0.05; // Default 5% weekly
  const hourlyRate = weeklyRate / (24 * 7); // Convert to hourly rate
  const earnings = slot.principal * hourlyRate * hoursElapsed;

  if (earnings <= 0) {
    return 0;
  }

  // Update slot
  await prisma.miningSlot.update({
    where: { id: slot.id },
    data: {
      lastAccruedAt: now,
      accruedEarnings: {
        increment: earnings
      }
    }
  });

  // NOTE: Earnings are NOT added to wallet balance during mining
  // They are only accumulated in the slot and will be added to balance
  // when the slot expires or is manually claimed

  // Create transaction record for tracking (but not adding to balance)
  await prisma.transaction.create({
    data: {
      userId: slot.userId,
      type: 'MINING_EARNINGS_ACCUMULATED',
      amount: earnings,
      currency: 'NON',
      description: `Mining earnings accumulated in slot ${slot.id} (Principal: ${slot.principal}, Rate: ${(hourlyRate * 100).toFixed(4)}%/hour, Hours: ${hoursElapsed.toFixed(2)}) - NOT added to balance yet`,
      referenceId: slot.id
    }
  });

  logger.business(`Processed slot ${slot.id}: +${earnings} NON (accumulated, not added to balance)`, {
    slotId: slot.id,
    userId: slot.userId,
    earnings,
    principal: slot.principal,
    hoursElapsed,
    note: 'Earnings accumulated in slot, will be added to balance when slot expires'
  });

  return earnings;
};

// Process expired slots
export const processExpiredSlots = async (req: Request, res: Response) => {
  try {
    logger.business('Processing expired mining slots');

    const expiredSlots = await prisma.miningSlot.findMany({
      where: {
        isActive: true,
        expiresAt: {
          lte: new Date()
        }
      },
      include: {
        user: true
      }
    });

    let processedCount = 0;

    for (const slot of expiredSlots) {
      try {
        await prisma.miningSlot.update({
          where: { id: slot.id },
          data: {
            isActive: false
          }
        });

        processedCount++;

        logger.business(`Deactivated expired slot ${slot.id}`, {
          slotId: slot.id,
          userId: slot.userId,
          expiredAt: slot.expiresAt
        });
      } catch (error) {
        logger.error(LogContext.BUSINESS, `Error processing expired slot ${slot.id}`, error);
      }
    }

    ResponseHelper.success(res, {
      processedCount,
      expiredSlotsCount: expiredSlots.length
    }, `Processed ${processedCount} expired slots`);

  } catch (error) {
    logger.error(LogContext.BUSINESS, 'Error processing expired slots', error);
    ResponseHelper.internalError(res, 'Failed to process expired slots');
  }
};

// Get processing statistics
export const getProcessingStats = async (req: Request, res: Response) => {
  try {
    const stats = await prisma.$transaction(async (tx) => {
      const activeSlots = await tx.miningSlot.count({
        where: { isActive: true }
      });

      const expiredSlots = await tx.miningSlot.count({
        where: {
          isActive: true,
          expiresAt: {
            lte: new Date()
          }
        }
      });

      const totalEarnings = await tx.transaction.aggregate({
        where: {
          type: 'MINING_EARNINGS',
          currency: 'NON'
        },
        _sum: {
          amount: true
        }
      });

      const recentEarnings = await tx.transaction.aggregate({
        where: {
          type: 'MINING_EARNINGS',
          currency: 'NON',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        _sum: {
          amount: true
        }
      });

      return {
        activeSlots,
        expiredSlots,
        totalEarnings: totalEarnings._sum?.amount || 0,
        recentEarnings: recentEarnings._sum?.amount || 0
      };
    });

    ResponseHelper.success(res, stats, 'Processing statistics retrieved');

  } catch (error) {
    logger.error(LogContext.BUSINESS, 'Error getting processing stats', error);
    ResponseHelper.internalError(res, 'Failed to get processing statistics');
  }
};

// Manual slot processing (admin only)
export const processSlotManually = async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;

    if (!slotId) {
      return ResponseHelper.badRequest(res, 'Slot ID is required');
    }

    const slot = await prisma.miningSlot.findUnique({
      where: { id: slotId },
      include: {
        user: {
          include: {
            wallets: true
          }
        }
      }
    });

    if (!slot) {
      return ResponseHelper.notFound(res, 'Mining slot');
    }

    if (!slot.isActive) {
      return ResponseHelper.badRequest(res, 'Slot is not active');
    }

    const earnings = await processSlot(slot);

    ResponseHelper.success(res, {
      slotId: slot.id,
      earnings,
      principal: slot.principal,
      totalEarnings: slot.accruedEarnings + earnings
    }, `Processed slot manually: +${earnings} NON`);

  } catch (error) {
    logger.error(LogContext.BUSINESS, 'Error processing slot manually', error);
    ResponseHelper.internalError(res, 'Failed to process slot manually');
  }
};