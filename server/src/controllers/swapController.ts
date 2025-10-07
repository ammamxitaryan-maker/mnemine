import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { MINIMUM_CONVERSION_AMOUNT, MINIMUM_WITHDRAWAL_MNE, EXCHANGE_RATE_VARIATION_MIN, EXCHANGE_RATE_VARIATION_MAX, MNE_CURRENCY } from '../constants.js';
import { Wallet, ActivityLogType } from '@prisma/client';
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

// POST /api/user/:telegramId/swap/USD-to-MNE
export const swapMNEoMNE = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip;

  if (!amount || typeof amount !== 'number' || amount < MINIMUM_CONVERSION_AMOUNT) {
    return res.status(400).json({ error: `Minimum conversion amount is ${MINIMUM_CONVERSION_AMOUNT} USD` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const USDWallet = user.wallets.find((w: Wallet) => w.currency === 'USD');
    const MNEWallet = user.wallets.find((w: Wallet) => w.currency === MNE_CURRENCY);

    if (!USDWallet || USDWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient USD balance' });
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
    const MNEAmount = amount * currentRate;

    await prisma.$transaction(async (tx) => {
      // Обновляем USD баланс
      await tx.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Обновляем или создаем MNE кошелек
      if (MNEWallet) {
        await tx.wallet.update({
          where: { id: MNEWallet.id },
          data: { balance: { increment: MNEAmount } },
        });
      } else {
        await tx.wallet.create({
          data: {
            userId: user.id,
            currency: MNE_CURRENCY,
            balance: MNEAmount,
          },
        });
      }

      // Логируем транзакцию
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.SWAP_USD_TO_MNE,
          amount: -amount,
          description: `Converted ${amount.toFixed(4)} USD to ${MNEAmount.toFixed(4)} MNE at rate ${currentRate.toFixed(4)}`,
          ipAddress: ipAddress,
        },
      });
    });

    res.status(200).json({
      message: `Successfully converted ${amount.toFixed(4)} USD to ${MNEAmount.toFixed(4)} MNE`,
      USDAmount: -amount,
      MNEAmount: MNEAmount,
      rate: currentRate,
    });
  } catch (error) {
    console.error(`Error converting USD to MNE for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/swap/MNE-to-USD
export const swapMNEToUSD = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip;

  if (!amount || typeof amount !== 'number' || amount < MINIMUM_CONVERSION_AMOUNT) {
    return res.status(400).json({ error: `Minimum conversion amount is ${MINIMUM_CONVERSION_AMOUNT} MNE` });
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
        error: 'You must invest in mining slots before converting MNE tokens. This prevents immediate withdrawal of welcome bonus tokens.' 
      });
    }

    const USDWallet = user.wallets.find((w: Wallet) => w.currency === 'USD');
    const MNEWallet = user.wallets.find((w: Wallet) => w.currency === MNE_CURRENCY);

    if (!MNEWallet || MNEWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient MNE balance' });
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
    const USDAmount = amount / currentRate;

    await prisma.$transaction(async (tx) => {
      // Обновляем MNE баланс
      await tx.wallet.update({
        where: { id: MNEWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Обновляем USD кошелек
      await tx.wallet.update({
        where: { id: USDWallet!.id },
        data: { balance: { increment: USDAmount } },
      });

      // Логируем транзакцию
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.SWAP_USD_TO_MNE,
          amount: USDAmount,
          description: `Converted ${amount.toFixed(4)} MNE to ${USDAmount.toFixed(4)} USD at rate ${currentRate.toFixed(4)}`,
          ipAddress: ipAddress,
        },
      });
    });

    res.status(200).json({
      message: `Successfully converted ${amount.toFixed(4)} MNE to ${USDAmount.toFixed(4)} USD`,
      USDAmount: USDAmount,
      MNEAmount: -amount,
      rate: currentRate,
    });
  } catch (error) {
    console.error(`Error converting MNE to USD for user ${telegramId}:`, error);
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
        type: ActivityLogType.SWAP_USD_TO_MNE,
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

