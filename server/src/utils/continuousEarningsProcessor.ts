import prisma from '../prisma.js';

interface SlotEarnings {
  slotId: string;
  userId: string;
  earnings: number;
  timeElapsed: number;
}

// Continuous earnings processor that runs 24/7
export class ContinuousEarningsProcessor {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private readonly PROCESS_INTERVAL = 60 * 1000; // Process every 1 minute
  private readonly PERSIST_INTERVAL = 5 * 60 * 1000; // Persist every 5 minutes
  private lastPersistTime = Date.now();

  async start() {
    if (this.isRunning) {
      console.log('[EARNINGS] Processor already running');
      return;
    }

    this.isRunning = true;
    console.log('[EARNINGS] Starting continuous earnings processor...');

    // Process immediately
    await this.processEarnings();

    // Then process every minute
    this.intervalId = setInterval(async () => {
      await this.processEarnings();
    }, this.PROCESS_INTERVAL);

    console.log('[EARNINGS] Continuous earnings processor started - running every 1 minute');
  }

  async stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[EARNINGS] Continuous earnings processor stopped');
  }

  private async processEarnings() {
    try {
      const now = new Date();
      const currentTime = now.getTime();

      // Get all active slots
      const activeSlots = await prisma.miningSlot.findMany({
        where: {
          isActive: true,
          expiresAt: {
            gt: now
          }
        },
        select: {
          id: true,
          userId: true,
          principal: true,
          effectiveWeeklyRate: true,
          lastAccruedAt: true,
          startAt: true
        }
      });

      if (activeSlots.length === 0) {
        return;
      }

      const slotEarnings: SlotEarnings[] = [];
      const slotsToUpdate: { id: string; lastAccruedAt: Date }[] = [];

      // Calculate earnings for each slot
      for (const slot of activeSlots) {
        const timeElapsedMs = currentTime - slot.lastAccruedAt.getTime();
        
        if (timeElapsedMs > 0) {
          const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
          const earnings = earningsPerSecond * (timeElapsedMs / 1000);
          
          slotEarnings.push({
            slotId: slot.id,
            userId: slot.userId,
            earnings,
            timeElapsed: timeElapsedMs
          });

          // Update lastAccruedAt to current time
          slotsToUpdate.push({
            id: slot.id,
            lastAccruedAt: now
          });
        }
      }

      // Persist earnings by updating lastAccruedAt timestamps and user balances
      if (slotsToUpdate.length > 0) {
        // Group earnings by user
        const userEarnings = new Map<string, number>();
        for (const slot of slotEarnings) {
          const current = userEarnings.get(slot.userId) || 0;
          userEarnings.set(slot.userId, current + slot.earnings);
        }

        // Update user balances with earned amounts
        for (const [userId, totalEarnings] of userEarnings) {
          if (totalEarnings > 0) {
            await prisma.wallet.updateMany({
              where: {
                userId: userId,
                currency: 'USD'
              },
              data: {
                balance: {
                  increment: totalEarnings
                }
              }
            });

            // Log the earnings activity
            await prisma.activityLog.create({
              data: {
                userId: userId,
                type: 'EARNINGS',
                amount: totalEarnings,
                description: `Earnings from mining slots: ${totalEarnings.toFixed(6)} USD`
              }
            });
          }
        }

        // Update slot timestamps
        await Promise.all(slotsToUpdate.map(update => 
          prisma.miningSlot.update({
            where: { id: update.id },
            data: { lastAccruedAt: update.lastAccruedAt }
          })
        ));

        const totalEarnings = slotEarnings.reduce((sum, slot) => sum + slot.earnings, 0);
        console.log(`[EARNINGS] Processed and persisted earnings for ${slotsToUpdate.length} slots, total: ${totalEarnings.toFixed(6)} USD`);
      }

      // Additional persistence every 5 minutes for safety
      if (currentTime - this.lastPersistTime > this.PERSIST_INTERVAL) {
        await this.forcePersistAllSlots();
        this.lastPersistTime = currentTime;
      }

    } catch (error) {
      console.error('[EARNINGS] Error processing continuous earnings:', error);
    }
  }

  private async forcePersistAllSlots() {
    try {
      const now = new Date();
      
      // Force update all active slots to current time
      const result = await prisma.miningSlot.updateMany({
        where: {
          isActive: true,
          expiresAt: {
            gt: now
          }
        },
        data: {
          lastAccruedAt: now
        }
      });

      console.log(`[EARNINGS] Force persisted ${result.count} active slots`);
    } catch (error) {
      console.error('[EARNINGS] Error force persisting slots:', error);
    }
  }

  // Get current earnings for a specific user (for API responses)
  async getUserEarnings(telegramId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: {
          miningSlots: {
            where: {
              isActive: true,
              expiresAt: {
                gt: new Date()
              }
            },
            select: {
              principal: true,
              effectiveWeeklyRate: true,
              lastAccruedAt: true
            }
          }
        }
      });

      if (!user) return 0;

      const now = new Date();
      let totalEarnings = 0;

      for (const slot of user.miningSlots) {
        const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
        if (timeElapsedMs > 0) {
          const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
          const earnings = earningsPerSecond * (timeElapsedMs / 1000);
          totalEarnings += earnings;
        }
      }

      return totalEarnings;
    } catch (error) {
      console.error('[EARNINGS] Error getting user earnings:', error);
      return 0;
    }
  }
}

// Global instance
export const continuousEarningsProcessor = new ContinuousEarningsProcessor();
