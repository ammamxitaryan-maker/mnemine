import { ActivityLogType } from '@prisma/client';
import prisma from '../prisma.js';
import { updateUserBalance } from './balanceUpdateUtils.js';
import { ensureUserWallets } from './walletUtils.js';

// Processor for handling expired slots and automatic earnings claiming
export class SlotExpirationProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PROCESS_INTERVAL = 60 * 1000; // Check every 1 minute

  async start() {
    if (this.isRunning) {
      console.log('[SLOTS] Expiration processor already running');
      return;
    }

    this.isRunning = true;
    console.log('[SLOTS] Starting slot expiration processor...');

    // Process immediately
    await this.processExpiredSlots();

    // Then process every minute
    this.intervalId = setInterval(async () => {
      await this.processExpiredSlots();
    }, this.PROCESS_INTERVAL);

    console.log('[SLOTS] Slot expiration processor started - running every 1 minute');
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[SLOTS] Slot expiration processor stopped');
  }

  private async processExpiredSlots() {
    try {
      const now = new Date();

      // Find all expired slots that are still marked as active
      const expiredSlots = await prisma.miningSlot.findMany({
        where: {
          isActive: true,
          expiresAt: {
            lte: now
          }
        },
        include: {
          user: {
            include: {
              wallets: true
            }
          }
        }
      });

      if (expiredSlots.length === 0) {
        return;
      }

      console.log(`[SLOTS] Processing ${expiredSlots.length} expired slots`);

      // Process each expired slot with error tracking
      let processedCount = 0;
      let errorCount = 0;

      for (const slot of expiredSlots) {
        try {
          await this.processExpiredSlot(slot);
          processedCount++;
        } catch (error) {
          errorCount++;
          console.error(`[SLOTS] Failed to process expired slot ${slot.id}:`, error);
        }
      }

      if (errorCount > 0) {
        console.warn(`[SLOTS] Completed processing: ${processedCount} successful, ${errorCount} failed`);
      } else {
        console.log(`[SLOTS] Successfully processed ${processedCount} expired slots`);
      }

    } catch (error) {
      console.error('[SLOTS] Critical error processing expired slots:', error);
    }
  }

  private async processExpiredSlot(slot: any) {
    try {
      const now = new Date();
      let NONWallet = slot.user.wallets.find((w: any) => w.currency === 'NON');

      if (!NONWallet) {
        console.log(`[SLOTS] No NON wallet found for user ${slot.userId}, creating one...`);
        try {
          await ensureUserWallets(slot.userId);
          // Refetch the user with wallets to get the newly created NON wallet
          const updatedUser = await prisma.user.findUnique({
            where: { id: slot.userId },
            include: { wallets: true }
          });
          NONWallet = updatedUser?.wallets.find((w: any) => w.currency === 'NON');

          if (!NONWallet) {
            console.error(`[SLOTS] Failed to create NON wallet for user ${slot.userId}`);
            return;
          }
          console.log(`[SLOTS] Successfully created NON wallet for user ${slot.userId}`);
        } catch (error) {
          console.error(`[SLOTS] Error creating NON wallet for user ${slot.userId}:`, error);
          return;
        }
      }

      // Calculate final earnings (30% of principal)
      const totalTimeElapsedMs = now.getTime() - slot.startAt.getTime();
      const weeklyRate = 0.3; // Always 30% for all slots
      const finalEarnings = slot.principal * weeklyRate * (totalTimeElapsedMs / (7 * 24 * 60 * 60 * 1000));

      // Ensure we don't exceed 30% of principal
      const maxEarnings = slot.principal * 0.3;
      const actualEarnings = Math.min(finalEarnings, maxEarnings);

      // Update wallet balance with centralized utility
      await updateUserBalance({
        userId: slot.userId,
        amount: actualEarnings,
        currency: 'NON',
        description: `Slot expired - earned ${actualEarnings.toFixed(4)} NON from ${slot.principal} NON investment (30% return)`,
        activityLogType: ActivityLogType.CLAIM,
        createActivityLog: true
      });

      // Deactivate the slot
      await prisma.miningSlot.update({
        where: { id: slot.id },
        data: {
          isActive: false,
          lastAccruedAt: now
        }
      });

      console.log(`[SLOTS] Processed expired slot ${slot.id}: earned ${actualEarnings.toFixed(4)} NON`);

    } catch (error) {
      console.error(`[SLOTS] Error processing expired slot ${slot.id}:`, error);
    }
  }
}

// Global instance
export const slotExpirationProcessor = new SlotExpirationProcessor();

// Health check function
export async function checkSlotProcessingHealth(): Promise<{
  isHealthy: boolean;
  expiredSlotsCount: number;
  activeSlotsCount: number;
  lastProcessedAt?: Date;
}> {
  try {
    const now = new Date();

    const [expiredSlotsCount, activeSlotsCount] = await Promise.all([
      prisma.miningSlot.count({
        where: {
          isActive: true,
          expiresAt: { lte: now }
        }
      }),
      prisma.miningSlot.count({
        where: { isActive: true }
      })
    ]);

    return {
      isHealthy: expiredSlotsCount < 100, // Consider unhealthy if more than 100 expired slots pending
      expiredSlotsCount,
      activeSlotsCount,
      lastProcessedAt: new Date()
    };
  } catch (error) {
    console.error('[HEALTH_CHECK] Error checking slot processing health:', error);
    return {
      isHealthy: false,
      expiredSlotsCount: -1,
      activeSlotsCount: -1
    };
  }
}
