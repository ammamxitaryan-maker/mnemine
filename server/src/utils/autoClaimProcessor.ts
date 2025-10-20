import { ActivityLogType } from '@prisma/client';
import prisma from '../prisma.js';
import { webSocketManager } from '../websocket/WebSocketManager.js';
import { updateUserBalance } from './balanceUpdateUtils.js';
import { ensureUserWallets } from './walletUtils.js';

// interface AutoClaimData { // Unused interface removed
//   userId: string;
//   telegramId: string;
//   totalEarnings: number;
//   slotsToUpdate: { id: string; lastAccruedAt: Date }[];
// }

export class AutoClaimProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PROCESS_INTERVAL = 24 * 60 * 60 * 1000; // Check every 24 hours

  async start() {
    if (this.isRunning) {
      console.log('[AUTO_CLAIM] Processor already running');
      return;
    }

    this.isRunning = true;
    console.log('[AUTO_CLAIM] Starting auto-claim processor...');

    // Process immediately
    await this.processAutoClaims();

    // Then process every 24 hours
    this.intervalId = setInterval(async () => {
      await this.processAutoClaims();
    }, this.PROCESS_INTERVAL);

    console.log('[AUTO_CLAIM] Auto-claim processor started - running every 24 hours');
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[AUTO_CLAIM] Auto-claim processor stopped');
  }

  private async processAutoClaims() {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      console.log('[AUTO_CLAIM] Processing auto-claims for slots older than 7 days...');

      // Get all active slots that are older than 7 days
      const eligibleSlots = await prisma.miningSlot.findMany({
        where: {
          isActive: true,
          startAt: {
            lte: sevenDaysAgo
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

      if (eligibleSlots.length === 0) {
        console.log('[AUTO_CLAIM] No eligible slots found for auto-claim');
        return;
      }

      console.log(`[AUTO_CLAIM] Found ${eligibleSlots.length} eligible slots for auto-claim`);

      // Group slots by user
      const userSlotsMap = new Map<string, any[]>();
      for (const slot of eligibleSlots) {
        if (!userSlotsMap.has(slot.userId)) {
          userSlotsMap.set(slot.userId, []);
        }
        userSlotsMap.get(slot.userId)!.push(slot);
      }

      // Process each user's slots with error tracking
      let processedUsers = 0;
      let errorUsers = 0;

      for (const [userId, slots] of userSlotsMap) {
        try {
          await this.processUserAutoClaim(userId, slots, now);
          processedUsers++;
        } catch (error) {
          errorUsers++;
          console.error(`[AUTO_CLAIM] Failed to process auto-claim for user ${userId}:`, error);
        }
      }

      if (errorUsers > 0) {
        console.warn(`[AUTO_CLAIM] Completed processing: ${processedUsers} successful, ${errorUsers} failed`);
      } else {
        console.log(`[AUTO_CLAIM] Successfully processed auto-claims for ${processedUsers} users`);
      }

    } catch (error) {
      console.error('[AUTO_CLAIM] Error processing auto-claims:', error);
    }
  }

  private async processUserAutoClaim(userId: string, slots: any[], now: Date) {
    try {
      const user = slots[0].user;
      let NONWallet = user.wallets.find((w: any) => w.currency === 'NON');

      if (!NONWallet) {
        console.log(`[AUTO_CLAIM] No NON wallet found for user ${userId}, creating one...`);
        try {
          await ensureUserWallets(userId);
          // Refetch the user with wallets to get the newly created NON wallet
          const updatedUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { wallets: true }
          });
          NONWallet = updatedUser?.wallets.find((w: any) => w.currency === 'NON');

          if (!NONWallet) {
            console.error(`[AUTO_CLAIM] Failed to create NON wallet for user ${userId}`);
            return;
          }
          console.log(`[AUTO_CLAIM] Successfully created NON wallet for user ${userId}`);
        } catch (error) {
          console.error(`[AUTO_CLAIM] Error creating NON wallet for user ${userId}:`, error);
          return;
        }
      }

      let totalEarnings = 0;
      const slotsToUpdate: { id: string; lastAccruedAt: Date }[] = [];

      // Calculate earnings for each slot
      for (const slot of slots) {
        const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
        if (timeElapsedMs > 0) {
          const earnings = slot.principal * slot.effectiveWeeklyRate * (timeElapsedMs / (7 * 24 * 60 * 60 * 1000));
          totalEarnings += earnings;
          slotsToUpdate.push({
            id: slot.id,
            lastAccruedAt: now
          });
        }
      }

      if (totalEarnings < 0.000001) {
        console.log(`[AUTO_CLAIM] No significant earnings for user ${userId}`);
        return;
      }

      // Update NON wallet balance with centralized utility
      await updateUserBalance({
        userId,
        amount: totalEarnings,
        currency: 'NON',
        description: `Auto-claim: ${totalEarnings.toFixed(4)} NON added to balance after 7 days`,
        activityLogType: ActivityLogType.CLAIM,
        createActivityLog: true
      });

      // Update slot timestamps
      for (const slotUpdate of slotsToUpdate) {
        await prisma.miningSlot.update({
          where: { id: slotUpdate.id },
          data: { lastAccruedAt: slotUpdate.lastAccruedAt }
        });
      }

      console.log(`[AUTO_CLAIM] Auto-claimed ${totalEarnings.toFixed(4)} NON for user ${userId}`);

      // Broadcast balance update via WebSocket
      try {
        const updatedWallet = await prisma.wallet.findUnique({
          where: { id: NONWallet.id },
          select: { balance: true, currency: true }
        });

        if (updatedWallet) {
          await webSocketManager.broadcastBalanceUpdate(user.telegramId, {
            currency: updatedWallet.currency,
            balance: updatedWallet.balance,
            change: totalEarnings,
            timestamp: new Date().toISOString()
          });
        }
      } catch (wsError) {
        console.error(`[AUTO_CLAIM] Failed to broadcast balance update for user ${userId}:`, wsError);
      }

    } catch (error) {
      console.error(`[AUTO_CLAIM] Error processing auto-claim for user ${userId}:`, error);
    }
  }
}

// Global instance
export const autoClaimProcessor = new AutoClaimProcessor();
