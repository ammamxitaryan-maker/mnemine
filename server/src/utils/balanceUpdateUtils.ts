/**
 * Centralized utilities for balance updates
 * Eliminates duplication of balance update patterns across the codebase
 */

import { ActivityLogType } from '@prisma/client';
import prisma from '../prisma.js';
import { LogContext, logger } from './logger.js';

export interface BalanceUpdateOptions {
  userId: string;
  amount: number;
  currency: 'NON';
  description?: string;
  activityLogType?: ActivityLogType;
  createActivityLog?: boolean;
}

export interface BalanceUpdateResult {
  success: boolean;
  newBalance: number;
  previousBalance: number;
  changeAmount: number;
  walletId: string;
}

/**
 * Update user wallet balance with centralized logic
 * @param options Balance update configuration
 * @returns Balance update result
 */
export const updateUserBalance = async (options: BalanceUpdateOptions): Promise<BalanceUpdateResult> => {
  const {
    userId,
    amount,
    currency,
    description,
    activityLogType = ActivityLogType.CLAIM,
    createActivityLog = true
  } = options;

  try {
    // Find or create wallet
    let wallet = await prisma.wallet.findFirst({
      where: { userId, currency }
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, currency, balance: 0 }
      });
      logger.business(`Created new ${currency} wallet for user ${userId}`, { userId, currency });
    }

    const previousBalance = wallet.balance;
    const newBalance = previousBalance + amount;

    // Prevent negative balance for deductions
    if (newBalance < 0) {
      throw new Error(`Insufficient balance. Available: ${previousBalance.toFixed(2)} ${currency}, Required: ${Math.abs(amount).toFixed(2)} ${currency}`);
    }

    // Update balance
    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: newBalance }
    });

    // Create activity log if requested
    if (createActivityLog && description) {
      await prisma.activityLog.create({
        data: {
          userId,
          type: activityLogType,
          amount: Math.abs(amount),
          description
        }
      });
    }

    logger.business(`Balance updated: ${currency} ${amount > 0 ? '+' : ''}${amount}`, {
      userId,
      currency,
      previousBalance,
      newBalance,
      changeAmount: amount
    });

    return {
      success: true,
      newBalance: updatedWallet.balance,
      previousBalance,
      changeAmount: amount,
      walletId: wallet.id
    };

  } catch (error) {
    logger.error(LogContext.BUSINESS, 'Failed to update user balance', error);
    throw error;
  }
};

/**
 * Update multiple user balances in a single transaction
 * @param updates Array of balance update options
 * @returns Array of balance update results
 */
export const updateMultipleBalances = async (updates: BalanceUpdateOptions[]): Promise<BalanceUpdateResult[]> => {
  return await prisma.$transaction(async (tx) => {
    const results: BalanceUpdateResult[] = [];

    for (const update of updates) {
      // Find or create wallet
      let wallet = await tx.wallet.findFirst({
        where: { userId: update.userId, currency: update.currency }
      });

      if (!wallet) {
        wallet = await tx.wallet.create({
          data: { userId: update.userId, currency: update.currency, balance: 0 }
        });
      }

      const previousBalance = wallet.balance;
      const newBalance = previousBalance + update.amount;

      // Prevent negative balance for deductions
      if (newBalance < 0) {
        throw new Error(`Insufficient balance. Available: ${previousBalance.toFixed(2)} ${update.currency}, Required: ${Math.abs(update.amount).toFixed(2)} ${update.currency}`);
      }

      // Update balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: newBalance }
      });

      // Create activity log if requested
      if (update.createActivityLog && update.description) {
        await tx.activityLog.create({
          data: {
            userId: update.userId,
            type: update.activityLogType || ActivityLogType.CLAIM,
            amount: Math.abs(update.amount),
            description: update.description
          }
        });
      }

      results.push({
        success: true,
        newBalance: updatedWallet.balance,
        previousBalance,
        changeAmount: update.amount,
        walletId: wallet.id
      });
    }

    return results;
  });
};

/**
 * Validate balance operation before execution
 * @param currentBalance Current wallet balance
 * @param amount Amount to add/subtract
 * @returns Validation result
 */
export const validateBalanceOperation = (currentBalance: number, amount: number): {
  isValid: boolean;
  isNegative: boolean;
  newBalance: number;
} => {
  const newBalance = currentBalance + amount;
  const isNegative = newBalance < 0;
  const isValid = !isNegative && amount !== 0;

  return { isValid, isNegative, newBalance };
};

/**
 * Get user wallet balance
 * @param userId User ID
 * @param currency Currency type
 * @returns Wallet balance or 0 if not found
 */
export const getUserBalance = async (userId: string, currency: 'NON'): Promise<number> => {
  const wallet = await prisma.wallet.findFirst({
    where: { userId, currency }
  });

  return wallet?.balance || 0;
};

/**
 * Get user balances for all currencies
 * @param userId User ID
 * @returns Object with balances for each currency
 */
export const getUserBalances = async (userId: string): Promise<{ NON: number }> => {
  const wallet = await prisma.wallet.findFirst({
    where: { userId, currency: 'NON' }
  });

  return { NON: wallet?.balance || 0 };
};
