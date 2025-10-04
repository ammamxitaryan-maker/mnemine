import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { MINIMUM_CONVERSION_AMOUNT, MINIMUM_WITHDRAWAL_CFMT, EXCHANGE_RATE_VARIATION_MIN, EXCHANGE_RATE_VARIATION_MAX, CFMT_CURRENCY } from '../constants.js';
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

// POST /api/user/:telegramId/swap/cfm-to-cfmt
export const swapCfmToCfmt = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip;

  if (!amount || typeof amount !== 'number' || amount < MINIMUM_CONVERSION_AMOUNT) {
    return res.status(400).json({ error: `Minimum conversion amount is ${MINIMUM_CONVERSION_AMOUNT} CFM` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    const cfmtWallet = user.wallets.find((w: Wallet) => w.currency === CFMT_CURRENCY);

    if (!cfmWallet || cfmWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient CFM balance' });
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
    const cfmtAmount = amount * currentRate;

    await prisma.$transaction(async (tx) => {
      // Обновляем CFM баланс
      await tx.wallet.update({
        where: { id: cfmWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Обновляем или создаем CFMT кошелек
      if (cfmtWallet) {
        await tx.wallet.update({
          where: { id: cfmtWallet.id },
          data: { balance: { increment: cfmtAmount } },
        });
      } else {
        await tx.wallet.create({
          data: {
            userId: user.id,
            currency: CFMT_CURRENCY,
            balance: cfmtAmount,
          },
        });
      }

      // Логируем транзакцию
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.SWAP_CFM_TO_CFMT,
          amount: -amount,
          description: `Converted ${amount.toFixed(4)} CFM to ${cfmtAmount.toFixed(4)} CFMT at rate ${currentRate.toFixed(4)}`,
          ipAddress: ipAddress,
        },
      });
    });

    res.status(200).json({
      message: `Successfully converted ${amount.toFixed(4)} CFM to ${cfmtAmount.toFixed(4)} CFMT`,
      cfmAmount: -amount,
      cfmtAmount: cfmtAmount,
      rate: currentRate,
    });
  } catch (error) {
    console.error(`Error converting CFM to CFMT for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/swap/cfmt-to-cfm
export const swapCfmtToCfm = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;
  const ipAddress = req.ip;

  if (!amount || typeof amount !== 'number' || amount < MINIMUM_CONVERSION_AMOUNT) {
    return res.status(400).json({ error: `Minimum conversion amount is ${MINIMUM_CONVERSION_AMOUNT} CFMT` });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: userSelectWithoutMiningSlots,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const cfmWallet = user.wallets.find((w: Wallet) => w.currency === 'CFM');
    const cfmtWallet = user.wallets.find((w: Wallet) => w.currency === CFMT_CURRENCY);

    if (!cfmtWallet || cfmtWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient CFMT balance' });
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
    const cfmAmount = amount / currentRate;

    await prisma.$transaction(async (tx) => {
      // Обновляем CFMT баланс
      await tx.wallet.update({
        where: { id: cfmtWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Обновляем CFM кошелек
      await tx.wallet.update({
        where: { id: cfmWallet!.id },
        data: { balance: { increment: cfmAmount } },
      });

      // Логируем транзакцию
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.SWAP_CFM_TO_CFMT,
          amount: cfmAmount,
          description: `Converted ${amount.toFixed(4)} CFMT to ${cfmAmount.toFixed(4)} CFM at rate ${currentRate.toFixed(4)}`,
          ipAddress: ipAddress,
        },
      });
    });

    res.status(200).json({
      message: `Successfully converted ${amount.toFixed(4)} CFMT to ${cfmAmount.toFixed(4)} CFM`,
      cfmAmount: cfmAmount,
      cfmtAmount: -amount,
      rate: currentRate,
    });
  } catch (error) {
    console.error(`Error converting CFMT to CFM for user ${telegramId}:`, error);
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
        type: ActivityLogType.SWAP_CFM_TO_CFMT,
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
