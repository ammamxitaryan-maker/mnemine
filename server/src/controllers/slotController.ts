import { Request, Response } from 'express';
import prisma from '../prisma';
import { SLOT_EXTENSION_COST, SLOT_EXTENSION_DAYS, BASE_STANDARD_SLOT_WEEKLY_RATE, SLOT_PURCHASE_DAILY_LIMIT, RANK_SLOT_RATE_BONUS_PERCENTAGE, REINVESTMENT_BONUS_PERCENTAGE, REINVESTMENT_AMOUNT } from '../constants';
import { Wallet, MiningSlot, ActivityLogType } from '@prisma/client';
import { isUserEligible } from '../utils/helpers';
import { userSelect, userSelectWithoutMiningSlots } from '../utils/dbSelects'; // Import userSelect

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

  if (!amount || typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid investment amount' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots, // Use the reusable userSelect
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    if (!cfmWallet || cfmWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSlotPurchases = await prisma.activityLog.count({
      where: {
        userId: user.id,
        type: ActivityLogType.NEW_SLOT_PURCHASE,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (recentSlotPurchases >= SLOT_PURCHASE_DAILY_LIMIT) {
      return res.status(400).json({ error: `You can only purchase ${SLOT_PURCHASE_DAILY_LIMIT} slots per day.` });
    }

    let weeklyRate = BASE_STANDARD_SLOT_WEEKLY_RATE;
    if (user.rank) {
      weeklyRate += RANK_SLOT_RATE_BONUS_PERCENTAGE;
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: cfmWallet.id },
        data: { balance: { decrement: amount } },
      }),
      prisma.miningSlot.create({
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
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.NEW_SLOT_PURCHASE,
          amount: -amount,
          description: `Invested ${amount.toFixed(2)} CFM in a new slot`,
          ipAddress: ipAddress,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { 
          totalInvested: { increment: amount },
          lastSlotPurchaseAt: new Date(),
        },
      }),
    ]);

    res.status(201).json({ message: `Slot purchased successfully for ${amount.toFixed(2)} CFM.` });
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

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    if (!cfmWallet || cfmWallet.balance < SLOT_EXTENSION_COST) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const slot = user.miningSlots.find((s: MiningSlot) => s.id === slotId); // Find the specific slot
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
        where: { id: cfmWallet.id },
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

// POST /api/user/:telegramId/buy-booster
export const buyBooster = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { boosterId } = req.body;
  const ipAddress = req.ip;
  
  try {
    const booster = await prisma.booster.findUnique({ where: { boosterId } });
    if (!booster) return res.status(404).json({ error: 'Booster not found' });

    const user = await prisma.user.findUnique({ 
      where: { telegramId }, 
      select: userSelect, // Use the reusable userSelect
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    if (!cfmWallet || cfmWallet.balance < booster.price) return res.status(400).json({ error: 'Insufficient funds' });

    // Find the first active slot to apply the booster
    const activeSlot = user.miningSlots.find((s: MiningSlot) => s.isActive && new Date(s.expiresAt) > new Date());
    if (!activeSlot) return res.status(400).json({ error: 'No active mining slot found to apply booster.' });

    let powerIncrease = booster.powerIncrease;
    if (user.rank) {
      powerIncrease += RANK_SLOT_RATE_BONUS_PERCENTAGE;
    }

    await prisma.$transaction([
      prisma.wallet.update({ where: { id: cfmWallet.id }, data: { balance: { decrement: booster.price } } }),
      prisma.miningSlot.update({ where: { id: activeSlot.id }, data: { effectiveWeeklyRate: { increment: powerIncrease } } }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.BOOSTER_PURCHASE,
          amount: -booster.price,
          description: `Purchased booster: ${booster.name}`,
          ipAddress: ipAddress,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { totalInvested: { increment: booster.price } },
      }),
    ]);
    res.status(200).json({ message: 'Booster purchased successfully' });
  } catch (error) {
    console.error(`Error purchasing booster for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/reinvest
export const reinvestEarnings = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const ipAddress = req.ip;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelect, // Use the reusable userSelect
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    if (!cfmWallet) {
      return res.status(400).json({ error: 'CFM wallet not found' });
    }

    if (cfmWallet.balance < REINVESTMENT_AMOUNT) {
      return res.status(400).json({ error: `Insufficient funds for reinvestment. Requires ${REINVESTMENT_AMOUNT} CFM.` });
    }

    // Find the first active slot for reinvestment
    const targetSlot = user.miningSlots.find((s: MiningSlot) => s.isActive && new Date(s.expiresAt) > new Date());
    if (!targetSlot) {
      return res.status(400).json({ error: 'No active mining slot found for reinvestment.' });
    }

    let bonusRateIncrease = REINVESTMENT_BONUS_PERCENTAGE;
    if (user.rank) {
      bonusRateIncrease += RANK_SLOT_RATE_BONUS_PERCENTAGE;
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: cfmWallet.id },
        data: { balance: { decrement: REINVESTMENT_AMOUNT } },
      }),
      prisma.miningSlot.update({
        where: { id: targetSlot.id },
        data: { effectiveWeeklyRate: { increment: bonusRateIncrease } },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.REINVESTMENT,
          amount: -REINVESTMENT_AMOUNT,
          description: `Reinvested ${REINVESTMENT_AMOUNT} CFM into mining slot for +${(bonusRateIncrease * 100).toFixed(2)}% weekly rate.`,
          ipAddress: ipAddress,
        },
      }),
    ]);

    res.status(200).json({ message: `Successfully reinvested ${REINVESTMENT_AMOUNT} CFM.` });
  } catch (error) {
    console.error(`Error reinvesting earnings for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

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

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    if (!cfmWallet || cfmWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const slot = user.miningSlots.find((s: MiningSlot) => s.id === slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found or not active' });
    }

    if (!slot.isActive || new Date(slot.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Cannot upgrade an inactive or expired slot' });
    }

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: cfmWallet.id },
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
          description: `Upgraded slot principal with ${amount.toFixed(2)} CFM.`,
          ipAddress: ipAddress,
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { totalInvested: { increment: amount } },
      }),
    ]);

    res.status(200).json({ message: `Slot upgraded successfully with ${amount.toFixed(2)} CFM.` });
  } catch (error) {
    console.error(`Error upgrading slot for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};