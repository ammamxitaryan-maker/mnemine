import { Request, Response } from 'express';
import prisma from '../prisma';
import { MIN_EXCHANGE_RATE, MAX_EXCHANGE_RATE, DEFAULT_EXCHANGE_RATE, CFMT_CURRENCY } from '../constants';
import { ActivityLogType } from '@prisma/client';

// GET /api/exchange/rate - Get current exchange rate
export const getCurrentExchangeRate = async (req: Request, res: Response) => {
  try {
    const currentRate = await prisma.exchangeRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const rate = currentRate ? currentRate.rate : DEFAULT_EXCHANGE_RATE;
    res.status(200).json({ rate, rateId: currentRate?.id });
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/exchange/rate - Set new exchange rate (Admin only)
export const setExchangeRate = async (req: Request, res: Response) => {
  const { rate } = req.body;
  const adminUserId = (req as any).user?.id; // Assuming admin auth middleware sets this

  // Validate rate
  if (typeof rate !== 'number' || rate < MIN_EXCHANGE_RATE || rate > MAX_EXCHANGE_RATE) {
    return res.status(400).json({ 
      error: `Exchange rate must be between ${MIN_EXCHANGE_RATE * 100}% and ${MAX_EXCHANGE_RATE * 100}%` 
    });
  }

  try {
    // Deactivate current rate
    await prisma.exchangeRate.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create new rate
    const newRate = await prisma.exchangeRate.create({
      data: {
        rate,
        isActive: true,
        createdBy: adminUserId || 'system',
      },
    });

    // Log the change
    await prisma.activityLog.create({
      data: {
        userId: adminUserId || 'system',
        type: ActivityLogType.EXCHANGE_RATE_CHANGE,
        amount: rate,
        description: `Exchange rate changed to ${(rate * 100).toFixed(3)}%`,
      },
    });

    res.status(200).json({ 
      message: 'Exchange rate updated successfully',
      rate: newRate.rate,
      rateId: newRate.id 
    });
  } catch (error) {
    console.error('Error setting exchange rate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/exchange/rate/history - Get exchange rate history
export const getExchangeRateHistory = async (req: Request, res: Response) => {
  try {
    const history = await prisma.exchangeRate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50, // Last 50 changes
      select: {
        id: true,
        rate: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(200).json(history);
  } catch (error) {
    console.error('Error fetching exchange rate history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/swap - Swap CFM to CFMT
export const swapCFMToCFMT = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { amount } = req.body;

  // Validate amount
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid swap amount' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallets: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get current exchange rate
    const currentRate = await prisma.exchangeRate.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    const rate = currentRate ? currentRate.rate : DEFAULT_EXCHANGE_RATE;
    const cfmtAmount = amount * rate;

    // Check CFM balance
    const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
    if (!cfmWallet || cfmWallet.balance < amount) {
      return res.status(400).json({ error: 'Insufficient CFM balance' });
    }

    // Get or create CFMT wallet
    let cfmtWallet = user.wallets.find(w => w.currency === CFMT_CURRENCY);
    
    await prisma.$transaction(async (tx) => {
      // Deduct CFM
      await tx.wallet.update({
        where: { id: cfmWallet.id },
        data: { balance: { decrement: amount } },
      });

      // Add CFMT
      if (cfmtWallet) {
        await tx.wallet.update({
          where: { id: cfmtWallet.id },
          data: { balance: { increment: cfmtAmount } },
        });
      } else {
        cfmtWallet = await tx.wallet.create({
          data: {
            userId: user.id,
            currency: CFMT_CURRENCY,
            balance: cfmtAmount,
          },
        });
      }

      // Record swap transaction
      await tx.swapTransaction.create({
        data: {
          userId: user.id,
          cfmAmount: amount,
          cfmtAmount,
          exchangeRate: rate,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.SWAP_CFM_TO_CFMT,
          amount: -amount, // Negative because CFM is deducted
          description: `Swapped ${amount.toFixed(4)} CFM to ${cfmtAmount.toFixed(4)} CFMT (rate: ${(rate * 100).toFixed(3)}%)`,
        },
      });
    });

    res.status(200).json({
      message: 'Swap completed successfully',
      cfmAmount: amount,
      cfmtAmount,
      exchangeRate: rate,
      newCFMBalance: cfmWallet.balance - amount,
      newCFMTBalance: cfmtAmount,
    });
  } catch (error) {
    console.error(`Error swapping CFM to CFMT for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// GET /api/user/:telegramId/swap/history - Get user's swap history
export const getUserSwapHistory = async (req: Request, res: Response) => {
  const { telegramId } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const swapHistory = await prisma.swapTransaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20, // Last 20 swaps
    });

    res.status(200).json(swapHistory);
  } catch (error) {
    console.error(`Error fetching swap history for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
