import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { SLOT_EXTENSION_COST, SLOT_EXTENSION_DAYS, SLOT_WEEKLY_RATE, MINIMUM_SLOT_INVESTMENT } from '../constants.js';
import { sendSlotClosedNotification, sendInvestmentSlotCompletedNotification } from './notificationController.js';
import { Wallet, MiningSlot, ActivityLogType } from '@prisma/client';
import { isUserEligible } from '../utils/helpers.js';
import { userSelect, userSelectWithoutMiningSlots } from '../utils/dbSelects.js'; // Import userSelect
import { webSocketManager } from '../websocket/WebSocketManager.js';
import { earningsAccumulator } from '../services/earningsAccumulator.js';

// GET /api/user/:telegramId/slots
export const getUserSlots = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  if (!telegramId) return res.status(400).json({ error: 'Telegram ID is required' });

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelect, // Use the reusable userSelect
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(user.miningSlots);
  } catch (error) {
    console.error(`Error fetching slots for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/slots/buy
export const buyNewSlot = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip;

  if (!amount || typeof amount !== 'number' || amount < MINIMUM_SLOT_INVESTMENT) {
    return res.status(400).json({ error: `Minimum investment is ${MINIMUM_SLOT_INVESTMENT} MNE` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots, // Use the reusable userSelect
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const MNEWallet = user.wallets.find((w: Wallet) => w.currency === 'MNE');
    if (!MNEWallet || MNEWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient MNE funds' });
    }

    // REMOVED: Daily slot purchase limit - users can buy unlimited slots

    // Доходность всегда 30% независимо от суммы
    const weeklyRate = SLOT_WEEKLY_RATE; // Всегда 30%
    const now = new Date();

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: MNEWallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.miningSlot.create({
        data: {
          userId: user.id,
          principal: amount,
          startAt: now, // Время начала начисления дохода
          lastAccruedAt: now, // Последнее время начисления (для совместимости)
          effectiveWeeklyRate: weeklyRate,
          expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000), // 7 дней с момента покупки
          isActive: true,
          type: 'standard', // Все слоты стандартные с доходностью 30%
          isLocked: true, // FIX: Lock slots for 7 days - users can only claim after expiry
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.NEW_SLOT_PURCHASE,
          amount: -amount,
          description: `Invested ${amount.toFixed(2)} MNE in a new slot`,
          ipAddress: ipAddress,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { 
          totalInvested: { increment: amount },
          lastSlotPurchaseAt: now,
        },
      }),
    ]);

    res.status(201).json({ message: `Slot purchased successfully for ${amount.toFixed(2)} MNE.` });
  } catch (error) {
    console.error(`Error purchasing slot for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/slots/:slotId/extend
export const extendSlot = async (req: Request, res: Response) => {
  const { telegramId, slotId } = req.params;
  const ipAddress = req.ip;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelect, // Use the reusable userSelect
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const USDWallet = user.wallets.find((w: Wallet) => w.currency === 'USD');
    if (!USDWallet || USDWallet.balance < SLOT_EXTENSION_COST) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const slot = user.miningSlots.find(s => s.id === slotId); // Find the specific slot
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (!slot.isActive || new Date(slot.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Cannot extend an inactive or expired slot' });
    }

    const newExpiresAt = new Date(slot.expiresAt);
    newExpiresAt.setDate(newExpiresAt.getDate() + SLOT_EXTENSION_DAYS);

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { decrement: SLOT_EXTENSION_COST } },
      }),
      prisma.miningSlot.update({
        where: { id: slot.id },
        data: { expiresAt: newExpiresAt },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.SLOT_EXTENSION,
          amount: -SLOT_EXTENSION_COST,
          description: `Extended mining slot by ${SLOT_EXTENSION_DAYS} days`,
          ipAddress: ipAddress,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { totalInvested: { increment: SLOT_EXTENSION_COST } },
      }),
    ]);

    res.status(200).json({ message: `Slot extended by ${SLOT_EXTENSION_DAYS} days.` });
  } catch (error) {
    console.error(`Error extending slot for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// REMOVED: reinvestEarnings function - no reinvestment system, all slots are 30%

// POST /api/user/:telegramId/slots/:slotId/upgrade
export const upgradeSlot = async (req: Request, res: Response) => {
  const { telegramId, slotId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip;

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid upgrade amount' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelect, // Use the reusable userSelect
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const MNEWallet = user.wallets.find((w: Wallet) => w.currency === 'MNE');
    if (!MNEWallet || MNEWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient MNE funds' });
    }

    const slot = user.miningSlots.find(s => s.id === slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found or not active' });
    }

    if (!slot.isActive || new Date(slot.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Cannot upgrade an inactive or expired slot' });
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: MNEWallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.miningSlot.update({
        where: { id: slot.id },
        data: { principal: { increment: amount } },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.REINVESTMENT, // Re-using this type for upgrades
          amount: -amount,
          description: `Upgraded slot principal with ${amount.toFixed(2)} MNE.`,
          ipAddress: ipAddress,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { totalInvested: { increment: amount } },
      }),
    ]);

    res.status(200).json({ message: `Slot upgraded successfully with ${amount.toFixed(2)} MNE.` });
  } catch (error) {
    console.error(`Error upgrading slot for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Функция автоматического закрытия слотов
export const processExpiredSlots = async () => {
  try {
    const now = new Date();
    const BATCH_SIZE = 100; // Обрабатываем по 100 слотов за раз
    let totalProcessed = 0;
    let offset = 0;

    console.log('Starting batch processing of expired slots...');

    while (true) {
      // Получаем слоты батчами с пагинацией
      const expiredSlots = await prisma.miningSlot.findMany({
        where: {
          isActive: true,
          expiresAt: { lte: now },
        },
        select: {
          id: true,
          userId: true,
          principal: true,
          startAt: true,
          effectiveWeeklyRate: true,
          user: {
            select: {
              id: true,
              wallets: {
                select: {
                  id: true,
                  balance: true,
                  currency: true
                }
              }
            }
          }
        },
        take: BATCH_SIZE,
        skip: offset,
        orderBy: { expiresAt: 'asc' }, // Сначала самые старые
      });

      if (expiredSlots.length === 0) {
        break; // Больше нет слотов для обработки
      }

      console.log(`Processing batch: ${expiredSlots.length} slots (offset: ${offset})`);

      // Обрабатываем слоты в текущем батче
      const batchResults = await processSlotBatch(expiredSlots, now);
      totalProcessed += batchResults.processed;
      
      // Если обработали меньше слотов чем размер батча, значит это последний батч
      if (expiredSlots.length < BATCH_SIZE) {
        break;
      }

      offset += BATCH_SIZE;

      // Небольшая пауза между батчами для снижения нагрузки на БД
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`Batch processing completed. Total processed: ${totalProcessed} expired slots`);
  } catch (error) {
    console.error('Error processing expired slots:', error);
  }
};

// Обработка одного батча слотов
const processSlotBatch = async (slots: any[], now: Date) => {
  let processed = 0;
  const errors: string[] = [];

  for (const slot of slots) {
    try {
      // Рассчитываем финальный доход с момента покупки слота (всегда 30%)
      const totalTimeElapsedMs = now.getTime() - slot.startAt.getTime();
      const weeklyRate = 0.3; // Always 30% for all slots
      const finalEarnings = slot.principal * weeklyRate * (totalTimeElapsedMs / (7 * 24 * 60 * 60 * 1000));
      
      // Добавляем доход к балансу пользователя
      const MNEWallet = slot.user.wallets.find((w: Wallet) => w.currency === 'MNE');
      if (MNEWallet) {
        await prisma.$transaction([
          prisma.wallet.update({
            where: { id: MNEWallet.id },
            data: { balance: { increment: finalEarnings } },
          }),
          prisma.miningSlot.update({
            where: { id: slot.id },
            data: { 
              isActive: false,
              lastAccruedAt: now,
            },
          }),
          prisma.activityLog.create({
            data: {
              userId: slot.userId,
              type: ActivityLogType.CLAIM,
              amount: finalEarnings,
              description: `Automatic slot closure - earned ${finalEarnings.toFixed(4)} MNE from ${slot.principal} MNE investment`,
            },
          }),
        ]);

        // Отправляем уведомление пользователю (асинхронно)
        if (slot.type === 'investment') {
          sendInvestmentSlotCompletedNotification(slot.userId, slot.id, slot.principal, finalEarnings).catch(error => {
            console.error(`Failed to send investment slot notification for slot ${slot.id}:`, error);
          });
        } else {
          sendSlotClosedNotification(slot.userId, slot.id, finalEarnings).catch(error => {
            console.error(`Failed to send notification for slot ${slot.id}:`, error);
          });
        }

        // Broadcast balance update via WebSocket
        try {
          const updatedWallet = await prisma.wallet.findUnique({
            where: { id: MNEWallet.id },
            select: { balance: true, currency: true }
          });
          
          if (updatedWallet) {
            await webSocketManager.broadcastBalanceUpdate(slot.user.telegramId, {
              currency: updatedWallet.currency,
              balance: updatedWallet.balance,
              change: finalEarnings,
              timestamp: new Date().toISOString()
            });
          }
        } catch (wsError) {
          console.error(`Failed to broadcast balance update for slot ${slot.id}:`, wsError);
        }

        processed++;
      }
    } catch (error) {
      const errorMsg = `Failed to process slot ${slot.id}: ${error instanceof Error ? error.message : String(error)}`;
      errors.push(errorMsg);
      console.error(errorMsg);
    }
  }

  if (errors.length > 0) {
    console.warn(`Batch processing completed with ${errors.length} errors:`, errors);
  }

  return { processed, errors };
};

// GET /api/user/:telegramId/real-time-income
export const getRealTimeIncome = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: {
        id: true,
        miningSlots: {
          where: { isActive: true },
          select: {
            id: true,
            principal: true,
            effectiveWeeklyRate: true,
            startAt: true,
            lastAccruedAt: true,
            isLocked: true,
            type: true,
            expiresAt: true,
            accruedEarnings: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    let totalCurrentIncome = 0;
    let totalProjectedIncome = 0;
    const slotsData = user.miningSlots.map(slot => {
      // Calculate current earnings based on elapsed time (server-side only)
      const totalTimeElapsedMs = now.getTime() - slot.startAt.getTime();
      const durationMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
      const elapsed = Math.min(totalTimeElapsedMs, durationMs);
      
      // Calculate earnings: 30% over 7 days
      const weeklyRate = 0.3; // 30%
      const currentEarnings = slot.principal * weeklyRate * (elapsed / durationMs);
      const projectedIncome = slot.principal * weeklyRate;
      
      totalCurrentIncome += currentEarnings;
      totalProjectedIncome += projectedIncome;

      const timeUntilExpiry = slot.expiresAt.getTime() - now.getTime();
      const hoursUntilExpiry = Math.max(0, timeUntilExpiry / (1000 * 60 * 60));
      const isCompleted = elapsed >= durationMs;

      return {
        id: slot.id,
        principal: slot.principal,
        currentEarnings: currentEarnings,
        projectedIncome: projectedIncome,
        currentBalance: slot.principal + currentEarnings,
        isLocked: slot.isLocked,
        type: slot.type,
        hoursUntilExpiry: Math.round(hoursUntilExpiry),
        rate: 30, // Always 30% for all slots
        totalHoursElapsed: Math.round(totalTimeElapsedMs / (1000 * 60 * 60)),
        isCompleted: isCompleted,
        progress: Math.min((elapsed / durationMs) * 100, 100),
        timeLeft: Math.max(0, timeUntilExpiry),
      };
    });

    res.status(200).json({
      totalCurrentIncome,
      totalProjectedIncome,
      slots: slotsData,
      lastUpdated: now.toISOString()
    });
  } catch (error) {
    console.error(`Error fetching real-time income for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/slots/earnings - Get total accrued earnings for user
export const getUserAccruedEarnings = async (req: Request, res: Response) => {
  const { telegramId } = req.params;

  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  try {
    const totalEarnings = await earningsAccumulator.getUserAccruedEarnings(telegramId);

    res.status(200).json({
      totalAccruedEarnings: totalEarnings,
      hasEarningsToClaim: totalEarnings > 0.01,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Error fetching accrued earnings for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/slots/claim - Claim all accrued earnings
export const claimEarnings = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { slotIds } = req.body; // Optional: specific slot IDs to claim from

  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  try {
    const result = await earningsAccumulator.claimEarnings(telegramId, slotIds);

    if (result.success) {
      res.status(200).json({
        success: true,
        claimedAmount: result.claimedAmount,
        message: result.message,
        lastUpdated: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error(`Error claiming earnings for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/invest - Create new investment slot
export const createInvestmentSlot = async (req: Request, res: Response) => {
  const { telegramId, amount } = req.body;
  const ipAddress = req.ip;

  if (!telegramId || !amount || typeof amount !== 'number' || amount < MINIMUM_SLOT_INVESTMENT) {
    return res.status(400).json({ error: `Minimum investment is ${MINIMUM_SLOT_INVESTMENT} MNE` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const MNEWallet = user.wallets.find((w: Wallet) => w.currency === 'MNE');
    if (!MNEWallet || MNEWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient MNE funds' });
    }

    const now = new Date();
    const weeklyRate = 0.3; // 30% return over 7 days

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: MNEWallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.miningSlot.create({
        data: {
          userId: user.id,
          principal: amount,
          startAt: now,
          lastAccruedAt: now,
          effectiveWeeklyRate: weeklyRate,
          expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000), // 7 days
          isActive: true,
          type: 'investment',
          isLocked: true, // Locked for 7 days
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.NEW_SLOT_PURCHASE,
          amount: -amount,
          description: `Invested ${amount.toFixed(2)} MNE in investment slot (30% return over 7 days)`,
          ipAddress: ipAddress,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { 
          totalInvested: { increment: amount },
          lastSlotPurchaseAt: now,
        },
      }),
    ]);

    res.status(201).json({ 
      message: `Investment slot created successfully for ${amount.toFixed(2)} MNE. Expected return: ${(amount * 1.3).toFixed(2)} MNE in 7 days.`,
      slotId: 'created' // In real implementation, you'd return the actual slot ID
    });
  } catch (error) {
    console.error(`Error creating investment slot for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/slots/:userId - Get all slots for user
export const getUserInvestmentSlots = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: userId },
      select: {
        id: true,
        telegramId: true,
        miningSlots: {
          select: {
            id: true,
            principal: true,
            startAt: true,
            expiresAt: true,
            isActive: true,
            type: true,
            accruedEarnings: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = new Date();
    const slotsWithCalculations = user.miningSlots.map(slot => {
      const totalTimeElapsedMs = now.getTime() - slot.startAt.getTime();
      const durationMs = 7 * 24 * 60 * 60 * 1000; // 7 days
      const elapsed = Math.min(totalTimeElapsedMs, durationMs);
      
      const weeklyRate = 0.3; // 30%
      const currentEarnings = slot.principal * weeklyRate * (elapsed / durationMs);
      const isCompleted = elapsed >= durationMs;
      const timeLeft = Math.max(0, slot.expiresAt.getTime() - now.getTime());

      return {
        id: slot.id,
        principal: slot.principal,
        currentEarnings: currentEarnings,
        currentBalance: slot.principal + currentEarnings,
        isCompleted: isCompleted,
        isActive: slot.isActive,
        progress: Math.min((elapsed / durationMs) * 100, 100),
        timeLeft: timeLeft,
        startTime: slot.startAt,
        expiresAt: slot.expiresAt,
        status: isCompleted ? 'completed' : (slot.isActive ? 'active' : 'inactive'),
      };
    });

    res.status(200).json({
      userId: user.telegramId,
      slots: slotsWithCalculations,
      lastUpdated: now.toISOString()
    });
  } catch (error) {
    console.error(`Error fetching investment slots for user ${userId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/claim/:slotId - Claim completed slot
export const claimCompletedSlot = async (req: Request, res: Response) => {
  const { slotId } = req.params;
  const { telegramId } = req.body;

  if (!telegramId) {
    return res.status(400).json({ error: 'Telegram ID is required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const slot = user.miningSlots.find(s => s.id === slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (!slot.isActive) {
      return res.status(400).json({ error: 'Slot is not active' });
    }

    const now = new Date();
    const totalTimeElapsedMs = now.getTime() - slot.startAt.getTime();
    const durationMs = 7 * 24 * 60 * 60 * 1000; // 7 days
    const elapsed = Math.min(totalTimeElapsedMs, durationMs);
    
    const weeklyRate = 0.3; // 30%
    const finalEarnings = slot.principal * weeklyRate * (elapsed / durationMs);
    const totalAmount = slot.principal + finalEarnings;

    const MNEWallet = user.wallets.find((w: Wallet) => w.currency === 'MNE');
    if (!MNEWallet) {
      return res.status(400).json({ error: 'MNE wallet not found' });
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: MNEWallet.id },
        data: { balance: { increment: finalEarnings } },
      }),
      prisma.miningSlot.update({
        where: { id: slot.id },
        data: { 
          isActive: false,
          lastAccruedAt: now,
        },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.CLAIM,
          amount: finalEarnings,
          description: `Claimed investment slot - earned ${finalEarnings.toFixed(4)} MNE from ${slot.principal} MNE investment (30% return)`,
        },
      }),
    ]);

    res.status(200).json({
      success: true,
      claimedAmount: finalEarnings,
      totalAmount: totalAmount,
      message: `✅ Investment slot completed! Earned ${finalEarnings.toFixed(4)} MNE (30% return)`,
      lastUpdated: now.toISOString()
    });
  } catch (error) {
    console.error(`Error claiming slot ${slotId} for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
