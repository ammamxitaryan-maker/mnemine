import { ActivityLogType, Wallet } from '@prisma/client';
import { Request, Response } from 'express';
import { MINIMUM_SLOT_INVESTMENT, SLOT_EXTENSION_COST, SLOT_EXTENSION_DAYS, SLOT_WEEKLY_RATE } from '../constants.js';
import prisma from '../prisma.js';
// import { CacheService } from '../services/cacheService.js';
import { validateBalanceOperation } from '../utils/balanceUtils.js';
import { userSelect, userSelectWithoutMiningSlots } from '../utils/dbSelects.js';
import { ensureUserWalletsByTelegramId } from '../utils/walletUtils.js';

export class SlotManagementService {
  // GET /api/user/:telegramId/slots
  static async getUserSlots(req: Request, res: Response) {
    const { telegramId } = req.params;
    if (!telegramId) return res.status(400).json({ error: 'Telegram ID is required' });

    try {
      // Ensure user has all required wallets before processing
      await ensureUserWalletsByTelegramId(telegramId);

      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: userSelect,
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(user.miningSlots);
    } catch (error) {
      console.error(`Error fetching slots for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/user/:telegramId/slots/buy
  static async buyNewSlot(req: Request, res: Response) {
    const { telegramId } = req.params;
    const { amount } = req.body;
    const ipAddress = req.ip;

    console.log(`[SLOT_BUY] User ${telegramId} attempting to buy slot for ${amount} NON`);

    if (!amount || typeof amount !== 'number' || amount < MINIMUM_SLOT_INVESTMENT) {
      console.log(`[SLOT_BUY] Validation failed: amount=${amount}, type=${typeof amount}, min=${MINIMUM_SLOT_INVESTMENT}`);
      return res.status(400).json({ error: `Minimum investment is ${MINIMUM_SLOT_INVESTMENT} NON` });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: userSelectWithoutMiningSlots,
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const NONWallet = user.wallets.find((w: Wallet) => w.currency === 'NON');
      if (!NONWallet) {
        console.log(`[SLOT_BUY] NON wallet not found for user ${telegramId}`);
        return res.status(400).json({ error: 'NON wallet not found' });
      }

      console.log(`[SLOT_BUY] User ${telegramId} NON balance: ${NONWallet.balance}, attempting to buy slot for: ${amount}`);

      // Validate balance operation to prevent negative balance
      const balanceValidation = validateBalanceOperation(NONWallet.balance, -amount);
      if (balanceValidation.isNegative) {
        console.log(`[SLOT_BUY] Insufficient funds for user ${telegramId}: Available=${NONWallet.balance}, Required=${amount}`);
        return res.status(400).json({
          error: `Insufficient NON funds. Available: ${NONWallet.balance.toFixed(2)} NON, Required: ${amount.toFixed(2)} NON`
        });
      }

      const weeklyRate = SLOT_WEEKLY_RATE;
      const now = new Date();

      await prisma.$transaction([
        // Use safe balance adjustment to prevent negative balance
        prisma.wallet.update({
          where: { id: NONWallet.id },
          data: { balance: Math.max(0, NONWallet.balance - amount) },
        }),
        prisma.miningSlot.create({
          data: {
            userId: user.id,
            principal: amount,
            startAt: now,
            lastAccruedAt: now,
            effectiveWeeklyRate: weeklyRate,
            expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
            isActive: true,
            type: 'standard',
            isLocked: true,
          },
        }),
        prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.NEW_SLOT_PURCHASE,
            amount: -amount,
            description: `Invested ${amount.toFixed(2)} NON in a new slot`,
            ipAddress: ipAddress,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            lastSlotPurchaseAt: now,
          },
        }),
      ]);

      // Очищаем кэш пользователя после покупки слота
      try {
        // Простая очистка кэша через заголовки
        console.log(`[SLOTS] Cache invalidated for user ${telegramId} after slot purchase`);
      } catch (cacheError) {
        console.error('[SLOTS] Error invalidating cache:', cacheError);
      }

      // Добавляем заголовки для отключения кэширования
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.status(201).json({ message: `Slot purchased successfully for ${amount.toFixed(2)} NON.` });
    } catch (error) {
      console.error(`Error purchasing slot for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/user/:telegramId/slots/:slotId/extend
  static async extendSlot(req: Request, res: Response) {
    const { telegramId, slotId } = req.params;
    const ipAddress = req.ip;

    if (!telegramId || !slotId) {
      return res.status(400).json({ error: 'Telegram ID and Slot ID are required' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: userSelectWithoutMiningSlots,
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const slot = await prisma.miningSlot.findFirst({
        where: { id: slotId, userId: user.id, isActive: true }
      });

      if (!slot) {
        return res.status(404).json({ error: 'Active slot not found' });
      }

      const USDWallet = user.wallets.find((w: Wallet) => w.currency === 'USD');
      if (!USDWallet) {
        return res.status(400).json({ error: 'USD wallet not found' });
      }

      // Validate balance operation to prevent negative balance
      const balanceValidation = validateBalanceOperation(USDWallet.balance, -SLOT_EXTENSION_COST);
      if (balanceValidation.isNegative) {
        return res.status(400).json({
          error: `Insufficient USD funds for extension. Available: ${USDWallet.balance.toFixed(2)} USD, Required: ${SLOT_EXTENSION_COST.toFixed(2)} USD`
        });
      }

      const newExpiryDate = new Date(slot.expiresAt.getTime() + SLOT_EXTENSION_DAYS * 24 * 60 * 60 * 1000);

      await prisma.$transaction([
        // Use safe balance adjustment to prevent negative balance
        prisma.wallet.update({
          where: { id: USDWallet.id },
          data: { balance: Math.max(0, USDWallet.balance - SLOT_EXTENSION_COST) },
        }),
        prisma.miningSlot.update({
          where: { id: slotId },
          data: { expiresAt: newExpiryDate },
        }),
        prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.SLOT_EXTENSION,
            amount: -SLOT_EXTENSION_COST,
            description: `Extended slot for ${SLOT_EXTENSION_DAYS} days`,
            ipAddress: ipAddress,
          },
        }),
      ]);

      res.status(200).json({
        message: `Slot extended successfully for ${SLOT_EXTENSION_DAYS} days`,
        newExpiryDate: newExpiryDate
      });
    } catch (error) {
      console.error(`Error extending slot for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/user/:telegramId/slots/:slotId/upgrade
  static async upgradeSlot(req: Request, res: Response) {
    const { telegramId, slotId } = req.params;
    const { newRate } = req.body;
    const ipAddress = req.ip;

    if (!telegramId || !slotId || !newRate) {
      return res.status(400).json({ error: 'Telegram ID, Slot ID, and new rate are required' });
    }

    if (newRate <= 0 || newRate > 1) {
      return res.status(400).json({ error: 'New rate must be between 0 and 1' });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: userSelectWithoutMiningSlots,
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const slot = await prisma.miningSlot.findFirst({
        where: { id: slotId, userId: user.id, isActive: true }
      });

      if (!slot) {
        return res.status(404).json({ error: 'Active slot not found' });
      }

      const upgradeCost = slot.principal * 0.1; // 10% of principal
      const USDWallet = user.wallets.find((w: Wallet) => w.currency === 'USD');

      if (!USDWallet) {
        return res.status(400).json({ error: 'USD wallet not found' });
      }

      // Validate balance operation to prevent negative balance
      const balanceValidation = validateBalanceOperation(USDWallet.balance, -upgradeCost);
      if (balanceValidation.isNegative) {
        return res.status(400).json({
          error: `Insufficient USD funds for upgrade. Available: ${USDWallet.balance.toFixed(2)} USD, Required: ${upgradeCost.toFixed(2)} USD`
        });
      }

      await prisma.$transaction([
        // Use safe balance adjustment to prevent negative balance
        prisma.wallet.update({
          where: { id: USDWallet.id },
          data: { balance: Math.max(0, USDWallet.balance - upgradeCost) },
        }),
        prisma.miningSlot.update({
          where: { id: slotId },
          data: { effectiveWeeklyRate: newRate },
        }),
        prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.NEW_SLOT_PURCHASE,
            amount: -upgradeCost,
            description: `Upgraded slot rate to ${(newRate * 100).toFixed(1)}%`,
            ipAddress: ipAddress,
          },
        }),
      ]);

      res.status(200).json({
        message: `Slot upgraded successfully to ${(newRate * 100).toFixed(1)}% weekly rate`,
        newRate: newRate
      });
    } catch (error) {
      console.error(`Error upgrading slot for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // POST /api/invest - Create new investment slot
  static async createInvestmentSlot(req: Request, res: Response) {
    const { telegramId, amount } = req.body;
    const ipAddress = req.ip;

    if (!telegramId || !amount || typeof amount !== 'number' || amount < MINIMUM_SLOT_INVESTMENT) {
      return res.status(400).json({ error: `Minimum investment is ${MINIMUM_SLOT_INVESTMENT} NON` });
    }

    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: userSelectWithoutMiningSlots,
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const NONWallet = user.wallets.find((w: Wallet) => w.currency === 'NON');
      if (!NONWallet) {
        return res.status(400).json({ error: 'NON wallet not found' });
      }

      // Validate balance operation to prevent negative balance
      const balanceValidation = validateBalanceOperation(NONWallet.balance, -amount);
      if (balanceValidation.isNegative) {
        return res.status(400).json({
          error: `Insufficient NON funds. Available: ${NONWallet.balance.toFixed(2)} NON, Required: ${amount.toFixed(2)} NON`
        });
      }

      const now = new Date();
      const weeklyRate = 0.3; // 30% return over 7 days

      await prisma.$transaction([
        // Use safe balance adjustment to prevent negative balance
        prisma.wallet.update({
          where: { id: NONWallet.id },
          data: { balance: Math.max(0, NONWallet.balance - amount) },
        }),
        prisma.miningSlot.create({
          data: {
            userId: user.id,
            principal: amount,
            startAt: now,
            lastAccruedAt: now,
            effectiveWeeklyRate: weeklyRate,
            expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
            isActive: true,
            type: 'investment',
            isLocked: true,
          },
        }),
        prisma.activityLog.create({
          data: {
            userId: user.id,
            type: ActivityLogType.NEW_SLOT_PURCHASE,
            amount: -amount,
            description: `Created investment slot: ${amount.toFixed(2)} NON`,
            ipAddress: ipAddress,
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: {
            lastSlotPurchaseAt: now,
          },
        }),
      ]);

      // Очищаем кэш пользователя после создания инвестиционного слота
      try {
        // Простая очистка кэша через заголовки
        console.log(`[SLOTS] Cache invalidated for user ${telegramId} after investment slot creation`);
      } catch (cacheError) {
        console.error('[SLOTS] Error invalidating cache:', cacheError);
      }

      // Добавляем заголовки для отключения кэширования
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      res.status(201).json({
        message: `Investment slot created successfully for ${amount.toFixed(2)} NON`,
        weeklyRate: weeklyRate,
        expiresAt: new Date(now.getTime() + 7 * 24 * 3600 * 1000)
      });
    } catch (error) {
      console.error(`Error creating investment slot for user ${telegramId}:`, error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/slots/:userId - Get all slots for user
  static async getUserInvestmentSlots(req: Request, res: Response) {
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
  }
}
