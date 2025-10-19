import { Request, Response } from 'express';
import {
  DEFAULT_EXCHANGE_RATE,
  MAX_EXCHANGE_RATE,
  MIN_EXCHANGE_RATE,
  NON_CURRENCY
} from '../constants.js';
import prisma from '../prisma.js';
// Middleware import removed - using Request directly

// Get current exchange rate
export const getCurrentExchangeRate = async (req: Request, res: Response) => {
  try {
    const exchangeRate = await prisma.exchangeRate.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const rate = exchangeRate?.rate || DEFAULT_EXCHANGE_RATE;

    res.json({
      success: true,
      rate,
      currency: NON_CURRENCY,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Exchange] Error getting current rate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get exchange rate'
    });
  }
};

// Set exchange rate (admin only)
export const setExchangeRate = async (req: Request, res: Response) => {
  try {
    const { rate } = req.body;

    if (!rate || typeof rate !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Rate is required and must be a number'
      });
    }

    if (rate < MIN_EXCHANGE_RATE || rate > MAX_EXCHANGE_RATE) {
      return res.status(400).json({
        success: false,
        error: `Rate must be between ${MIN_EXCHANGE_RATE} and ${MAX_EXCHANGE_RATE}`
      });
    }

    const exchangeRate = await prisma.exchangeRate.create({
      data: {
        rate,
        createdBy: 'system'
      }
    });

    res.json({
      success: true,
      rate: exchangeRate.rate,
      timestamp: exchangeRate.createdAt
    });
  } catch (error) {
    console.error('[Exchange] Error setting rate:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set exchange rate'
    });
  }
};

// Get exchange rate history
export const getExchangeRateHistory = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const history = await prisma.exchangeRate.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      history: history.map((rate: any) => ({
        rate: rate.rate,
        createdBy: rate.createdBy,
        timestamp: rate.createdAt
      }))
    });
  } catch (error) {
    console.error('[Exchange] Error getting rate history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get exchange rate history'
    });
  }
};

// Swap USD to NON
export const swapNONoNON = async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.params;
    const { amount } = req.body;

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount is required and must be a positive number'
      });
    }

    // Get current exchange rate
    const exchangeRate = await prisma.exchangeRate.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const rate = exchangeRate?.rate || DEFAULT_EXCHANGE_RATE;
    const NONAmount = amount * rate;

    // Check if user has enough USD balance
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        wallets: {
          where: { currency: 'USD' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet || USDWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient USD balance'
      });
    }

    // Perform the swap
    await prisma.$transaction(async (tx: any) => {
      // Deduct USD from user wallet
      await tx.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: Math.max(0, USDWallet.balance - amount) }
      });

      // Create swap transaction record
      await tx.swapTransaction.create({
        data: {
          userId: user.id,
          USDAmount: amount,
          NONAmount: NONAmount,
          exchangeRate: rate
        }
      });
    });

    res.json({
      success: true,
      USDAmount: amount,
      NONAmount: NONAmount,
      rate,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Exchange] Error swapping USD to NON:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform swap'
    });
  }
};

// Get user swap history
export const getUserSwapHistory = async (req: Request, res: Response) => {
  try {
    const { telegramId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const swaps = await prisma.swapTransaction.findMany({
      where: {
        userId: user.id
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      swaps: swaps.map((swap: any) => ({
        USDAmount: swap.USDAmount,
        NONAmount: swap.NONAmount,
        exchangeRate: swap.exchangeRate,
        timestamp: swap.createdAt
      }))
    });
  } catch (error) {
    console.error('[Exchange] Error getting user swap history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get swap history'
    });
  }
};

