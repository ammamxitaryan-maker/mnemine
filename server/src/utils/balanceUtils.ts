import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Safely updates a wallet balance, ensuring it never goes negative
 * @param walletId - The wallet ID to update
 * @param newBalance - The new balance amount
 * @param operation - The operation being performed (for logging)
 * @returns The updated wallet with the new balance
 */
export async function safeUpdateWalletBalance(
  walletId: string,
  newBalance: number,
  operation: string = 'BALANCE_UPDATE'
) {
  // Ensure balance is never negative
  const safeBalance = Math.max(0, newBalance);

  const updatedWallet = await prisma.wallet.update({
    where: { id: walletId },
    data: { balance: safeBalance }
  });

  console.log(`[BALANCE_UTILS] ${operation}: Wallet ${walletId} balance updated to ${safeBalance}`);

  return updatedWallet;
}

/**
 * Safely updates a wallet balance with increment/decrement operations
 * @param walletId - The wallet ID to update
 * @param amount - The amount to add (positive) or subtract (negative)
 * @param operation - The operation being performed (for logging)
 * @returns The updated wallet with the new balance
 */
export async function safeAdjustWalletBalance(
  walletId: string,
  amount: number,
  operation: string = 'BALANCE_ADJUSTMENT'
) {
  // Get current balance
  const currentWallet = await prisma.wallet.findUnique({
    where: { id: walletId }
  });

  if (!currentWallet) {
    throw new Error(`Wallet with ID ${walletId} not found`);
  }

  const newBalance = Math.max(0, currentWallet.balance + amount);

  const updatedWallet = await prisma.wallet.update({
    where: { id: walletId },
    data: { balance: newBalance }
  });

  console.log(`[BALANCE_UTILS] ${operation}: Wallet ${walletId} balance adjusted by ${amount} (${currentWallet.balance} -> ${newBalance})`);

  return updatedWallet;
}

/**
 * Safely updates multiple wallet balances in a transaction
 * @param updates - Array of wallet updates
 * @param operation - The operation being performed (for logging)
 * @returns Array of updated wallets
 */
export async function safeUpdateMultipleWalletBalances(
  updates: Array<{ walletId: string; newBalance: number }>,
  operation: string = 'BULK_BALANCE_UPDATE'
) {
  return await prisma.$transaction(async (tx) => {
    const results = [];

    for (const update of updates) {
      const safeBalance = Math.max(0, update.newBalance);

      const updatedWallet = await tx.wallet.update({
        where: { id: update.walletId },
        data: { balance: safeBalance }
      });

      results.push(updatedWallet);
    }

    console.log(`[BALANCE_UTILS] ${operation}: Updated ${updates.length} wallet balances`);

    return results;
  });
}

/**
 * Validates that a balance operation won't result in a negative balance
 * @param currentBalance - Current wallet balance
 * @param amount - Amount to add/subtract
 * @returns Object with validation result and safe amount
 */
export function validateBalanceOperation(currentBalance: number, amount: number) {
  const newBalance = currentBalance + amount;
  const isNegative = newBalance < 0;
  const safeAmount = isNegative ? -currentBalance : amount; // Adjust amount to prevent negative
  const finalBalance = Math.max(0, newBalance);

  return {
    isValid: !isNegative,
    isNegative,
    safeAmount,
    finalBalance,
    originalAmount: amount
  };
}

/**
 * Gets or creates a wallet for a user with a specific currency
 * @param userId - User ID
 * @param currency - Currency type (e.g., 'MNE', 'USD')
 * @param initialBalance - Initial balance for new wallets (default: 0)
 * @returns The wallet (existing or newly created)
 */
export async function getOrCreateWallet(userId: string, currency: string, initialBalance: number = 0) {
  let wallet = await prisma.wallet.findFirst({
    where: {
      userId: userId,
      currency: currency
    }
  });

  if (!wallet) {
    // For new MNE wallets, give 3 MNE as welcome bonus
    const balance = currency === 'MNE' ? 3 : initialBalance;

    wallet = await prisma.wallet.create({
      data: {
        userId: userId,
        currency: currency,
        balance: balance
      }
    });
    console.log(`[BALANCE_UTILS] Created new ${currency} wallet for user ${userId} with balance ${balance}`);
  }

  return wallet;
}
