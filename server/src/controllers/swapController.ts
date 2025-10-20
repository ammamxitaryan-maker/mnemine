import { ActivityLogType, Wallet } from '@prisma/client';
import { Request, Response } from 'express';
import { EXCHANGE_RATE_VARIATION_MAX, EXCHANGE_RATE_VARIATION_MIN, MINIMUM_CONVERSION_AMOUNT, NON_CURRENCY } from '../constants.js';
import prisma from '../prisma.js';
import { userSelectWithoutMiningSlots } from '../utils/dbSelects.js';

// GET /api/user/:telegramId/swap/rate
export const getExchangeRate = async (req: Request, res: Response) => {
  try {
    // Получаем базовый курс из базы данных
    const baseRate = await prisma.exchangeRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!baseRate) {
      return res.status(404).json({ error: 'Exchange rate not configured' });
    }

    // Добавляем случайное отклонение от 0 до 5%
    const variation = Math.random() * (EXCHANGE_RATE_VARIATION_MAX - EXCHANGE_RATE_VARIATION_MIN) + EXCHANGE_RATE_VARIATION_MIN;
    const currentRate = baseRate.rate * (1 + variation);

    res.status(200).json({
      rate: currentRate,
      baseRate: baseRate.rate,
      variation: variation * 100, // В процентах
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/swap/USD-to-NON
export const swapNONoNON = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip;

  if (!amount || typeof amount !== 'number' || amount < MINIMUM_CONVERSION_AMOUNT) {
    return res.status(400).json({ error: `Minimum conversion amount is ${MINIMUM_CONVERSION_AMOUNT} NON` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const NONWallet = user.wallets.find((w: Wallet) => w.currency === NON_CURRENCY);

    if (!NONWallet || NONWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient NON balance' });
    }

    // Получаем текущий курс
    const baseRate = await prisma.exchangeRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!baseRate) {
      return res.status(400).json({ error: 'Exchange rate not configured' });
    }

    const variation = Math.random() * (EXCHANGE_RATE_VARIATION_MAX - EXCHANGE_RATE_VARIATION_MIN) + EXCHANGE_RATE_VARIATION_MIN;
    const currentRate = baseRate.rate * (1 + variation);
    const USDEquivalent = amount / currentRate;

    await prisma.$transaction(async (tx) => {
      // Обновляем NON баланс
      await tx.wallet.update({
        where: { id: NONWallet.id },
        data: { balance: Math.max(0, NONWallet.balance - amount) },
      });

      // Логируем транзакцию
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.EXCHANGE_RATE_CHANGE,
          amount: -amount,
          description: `Converted ${amount.toFixed(4)} NON to USD equivalent ${USDEquivalent.toFixed(4)} at rate ${currentRate.toFixed(4)}`,
          ipAddress: ipAddress,
        },
      });
    });

    res.status(200).json({
      message: `Successfully converted ${amount.toFixed(4)} NON to USD equivalent ${USDEquivalent.toFixed(4)}`,
      NONAmount: -amount,
      USDEquivalent: USDEquivalent,
      rate: currentRate,
    });
  } catch (error) {
    console.error(`Error converting NON to USD equivalent for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/swap/NON-to-USD
export const swapNONToUSD = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip;

  if (!amount || typeof amount !== 'number' || amount < MINIMUM_CONVERSION_AMOUNT) {
    return res.status(400).json({ error: `Minimum conversion amount is ${MINIMUM_CONVERSION_AMOUNT} NON` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Проверяем, есть ли у пользователя активные слоты
    const userWithSlots = await prisma.user.findUnique({
      where: { telegramId },
      include: { miningSlots: { where: { isActive: true } } }
    });

    if (!userWithSlots || userWithSlots.miningSlots.length === 0) {
      return res.status(400).json({
        error: 'You must invest in mining slots before converting NON tokens. This prevents immediate withdrawal of welcome bonus tokens.'
      });
    }

    const NONWallet = user.wallets.find((w: Wallet) => w.currency === NON_CURRENCY);

    if (!NONWallet || NONWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient NON balance' });
    }

    // Получаем текущий курс
    const baseRate = await prisma.exchangeRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!baseRate) {
      return res.status(400).json({ error: 'Exchange rate not configured' });
    }

    const variation = Math.random() * (EXCHANGE_RATE_VARIATION_MAX - EXCHANGE_RATE_VARIATION_MIN) + EXCHANGE_RATE_VARIATION_MIN;
    const currentRate = baseRate.rate * (1 + variation);
    const USDEquivalent = amount / currentRate;

    await prisma.$transaction(async (tx) => {
      // Обновляем NON баланс
      await tx.wallet.update({
        where: { id: NONWallet.id },
        data: { balance: Math.max(0, NONWallet.balance - amount) },
      });

      // Логируем транзакцию
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.EXCHANGE_RATE_CHANGE,
          amount: -amount,
          description: `Converted ${amount.toFixed(4)} NON to USD equivalent ${USDEquivalent.toFixed(4)} at rate ${currentRate.toFixed(4)}`,
          ipAddress: ipAddress,
        },
      });
    });

    res.status(200).json({
      message: `Successfully converted ${amount.toFixed(4)} NON to USD equivalent ${USDEquivalent.toFixed(4)}`,
      USDEquivalent: USDEquivalent,
      NONAmount: -amount,
      rate: currentRate,
    });
  } catch (error) {
    console.error(`Error converting NON to USD equivalent for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/swap/history
export const getSwapHistory = async (req: Request, res: Response) => {
  const { telegramId } = req.params;

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const swapHistory = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        type: ActivityLogType.EXCHANGE_RATE_CHANGE,
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Последние 50 транзакций
    });

    res.status(200).json(swapHistory);
  } catch (error) {
    console.error(`Error fetching swap history for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

