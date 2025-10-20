import { PrismaClient } from '@prisma/client';
import { WELCOME_BONUS_AMOUNT } from '../constants.js';

const prisma = new PrismaClient();

/**
 * Ensures that a user has NON wallet
 * Creates missing wallet automatically
 */
export async function ensureUserWallets(userId: string): Promise<void> {
  try {
    // Get existing wallets for the user
    const existingWallets = await prisma.wallet.findMany({
      where: { userId },
      select: { currency: true }
    });

    const existingCurrencies = existingWallets.map(w => w.currency);
    const walletsToCreate = [];

    // Check if NON wallet exists (only currency needed)
    if (!existingCurrencies.includes('NON')) {
      walletsToCreate.push({
        userId,
        currency: 'NON',
        balance: WELCOME_BONUS_AMOUNT // Give welcome bonus for NON wallet
      });
    }

    // Create missing wallets
    if (walletsToCreate.length > 0) {
      await prisma.wallet.createMany({
        data: walletsToCreate
      });

      console.log(`[WALLET_UTILS] Created ${walletsToCreate.length} missing wallets for user ${userId}:`,
        walletsToCreate.map(w => w.currency).join(', '));
    }

  } catch (error) {
    console.error(`[WALLET_UTILS] Error ensuring wallets for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Ensures wallets exist for a user by telegramId
 */
export async function ensureUserWalletsByTelegramId(telegramId: string): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true }
    });

    if (!user) {
      throw new Error(`User with telegramId ${telegramId} not found`);
    }

    await ensureUserWallets(user.id);
  } catch (error) {
    console.error(`[WALLET_UTILS] Error ensuring wallets for telegramId ${telegramId}:`, error);
    throw error;
  }
}

/**
 * Gets user with wallets, ensuring all wallets exist
 */
export async function getUserWithWallets(telegramId: string) {
  // First ensure wallets exist
  await ensureUserWalletsByTelegramId(telegramId);

  // Then get user with wallets
  return await prisma.user.findUnique({
    where: { telegramId },
    include: {
      wallets: true,
      miningSlots: {
        where: { isActive: true }
      }
    }
  });
}
