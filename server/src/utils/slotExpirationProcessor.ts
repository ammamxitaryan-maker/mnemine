import prisma from '../prisma.js';

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
              wallets: {
                where: { currency: 'USD' }
              }
            }
          }
        }
      });

      if (expiredSlots.length === 0) {
        return;
      }

      console.log(`[SLOTS] Processing ${expiredSlots.length} expired slots`);

      // Process each expired slot
      for (const slot of expiredSlots) {
        await this.processExpiredSlot(slot);
      }

    } catch (error) {
      console.error('[SLOTS] Error processing expired slots:', error);
    }
  }

  private async processExpiredSlot(slot: any) {
    try {
      const now = new Date();
      const USDWallet = slot.user.wallets[0];
      
      if (!USDWallet) {
        console.error(`[SLOTS] No USD wallet found for user ${slot.userId}`);
        return;
      }

      // Calculate final earnings (30% of principal)
      const totalTimeElapsedMs = now.getTime() - slot.startAt.getTime();
      const weeklyRate = 0.3; // Always 30% for all slots
      const finalEarnings = slot.principal * weeklyRate * (totalTimeElapsedMs / (7 * 24 * 60 * 60 * 1000));
      
      // Ensure we don't exceed 30% of principal
      const maxEarnings = slot.principal * 0.3;
      const actualEarnings = Math.min(finalEarnings, maxEarnings);

      await prisma.$transaction(async (tx) => {
        // Update wallet balance
        await tx.wallet.update({
          where: { id: USDWallet.id },
          data: { balance: { increment: actualEarnings } }
        });

        // Deactivate the slot
        await tx.miningSlot.update({
          where: { id: slot.id },
          data: { 
            isActive: false,
            lastAccruedAt: now
          }
        });

        // Create activity log
        await tx.activityLog.create({
          data: {
            userId: slot.userId,
            type: 'CLAIM',
            amount: actualEarnings,
            description: `Slot expired - earned ${actualEarnings.toFixed(4)} USD from ${slot.principal} USD investment (30% return)`
          }
        });
      });

      console.log(`[SLOTS] Processed expired slot ${slot.id}: earned ${actualEarnings.toFixed(4)} USD`);

    } catch (error) {
      console.error(`[SLOTS] Error processing expired slot ${slot.id}:`, error);
    }
  }
}

// Global instance
export const slotExpirationProcessor = new SlotExpirationProcessor();
