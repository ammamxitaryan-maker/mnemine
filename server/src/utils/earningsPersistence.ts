import prisma from '../prisma.js';

// Background job to persist earnings for all active slots
export const persistEarnings = async () => {
  try {
    const now = new Date();
    
    // Get all active slots that need earnings persistence
    const activeSlots = await prisma.miningSlot.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: now
        }
      },
      select: {
        id: true,
        lastAccruedAt: true,
        principal: true,
        effectiveWeeklyRate: true
      }
    });

    const slotUpdates: { id: string; lastAccruedAt: Date }[] = [];
    
    for (const slot of activeSlots) {
      const timeElapsedMs = now.getTime() - slot.lastAccruedAt.getTime();
      
      // Persist earnings every 5 minutes or if significant time has passed
      if (timeElapsedMs > 5 * 60 * 1000) { // 5 minutes
        slotUpdates.push({
          id: slot.id,
          lastAccruedAt: now
        });
      }
    }

    // Update all slots that need persistence
    if (slotUpdates.length > 0) {
      await Promise.all(slotUpdates.map(update => 
        prisma.miningSlot.update({
          where: { id: update.id },
          data: { lastAccruedAt: update.lastAccruedAt }
        })
      ));
      
      console.log(`[EARNINGS] Persisted earnings for ${slotUpdates.length} slots`);
    }
    
  } catch (error) {
    console.error('[EARNINGS] Error persisting earnings:', error);
  }
};

// Run earnings persistence every 5 minutes
export const startEarningsPersistence = () => {
  // Run immediately
  persistEarnings();
  
  // Then every 5 minutes
  setInterval(persistEarnings, 5 * 60 * 1000);
  
  console.log('[EARNINGS] Earnings persistence started - running every 5 minutes');
};
