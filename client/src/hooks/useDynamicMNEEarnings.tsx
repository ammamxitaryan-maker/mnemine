import { useState, useEffect, useMemo } from 'react';
import { MiningSlot } from './useSlotsData';

interface DynamicEarningsData {
  totalEarnings: number;
  dailyEarnings: number;
  hourlyEarnings: number;
  perSecondEarnings: number;
  lastUpdate: number;
}

export const useDynamicMNEEarnings = (slots: MiningSlot[] | undefined) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every second for dynamic display
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const earningsData = useMemo((): DynamicEarningsData => {
    if (!slots || slots.length === 0) {
      console.log('[DynamicEarnings] No slots data provided');
      return {
        totalEarnings: 0,
        dailyEarnings: 0,
        hourlyEarnings: 0,
        perSecondEarnings: 0,
        lastUpdate: currentTime
      };
    }

    const activeSlots = slots.filter(slot => 
      slot.isActive && new Date(slot.expiresAt) > new Date()
    );

    console.log('[DynamicEarnings] Active slots:', activeSlots.length, 'out of', slots.length);

    if (activeSlots.length === 0) {
      console.log('[DynamicEarnings] No active slots found');
      return {
        totalEarnings: 0,
        dailyEarnings: 0,
        hourlyEarnings: 0,
        perSecondEarnings: 0,
        lastUpdate: currentTime
      };
    }

    let totalEarnings = 0;
    let totalDailyEarnings = 0;
    let totalHourlyEarnings = 0;
    let totalPerSecondEarnings = 0;

    activeSlots.forEach((slot, index) => {
      const now = new Date(currentTime);
      const lastAccruedTime = new Date(slot.lastAccruedAt || slot.createdAt);
      const timeElapsedMs = now.getTime() - lastAccruedTime.getTime();
      
      console.log(`[DynamicEarnings] Slot ${index}:`, {
        principal: slot.principal,
        effectiveWeeklyRate: slot.effectiveWeeklyRate,
        lastAccruedAt: slot.lastAccruedAt,
        createdAt: slot.createdAt,
        timeElapsedMs: timeElapsedMs,
        timeElapsedHours: timeElapsedMs / (1000 * 60 * 60)
      });
      
      if (timeElapsedMs > 0) {
        // Calculate earnings since last accrual (not slot creation)
        const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
        const earnings = earningsPerSecond * (timeElapsedMs / 1000);
        
        // Cap earnings at 30% of principal (the maximum possible earnings)
        const maxEarnings = slot.principal * slot.effectiveWeeklyRate;
        const cappedEarnings = Math.min(earnings, maxEarnings);
        
        console.log(`[DynamicEarnings] Slot ${index} earnings:`, {
          earningsPerSecond,
          earnings,
          maxEarnings,
          cappedEarnings
        });
        
        totalEarnings += cappedEarnings;
        totalPerSecondEarnings += earningsPerSecond;
        totalHourlyEarnings += earningsPerSecond * 3600;
        totalDailyEarnings += earningsPerSecond * 86400;
      }
    });

    console.log('[DynamicEarnings] Final calculation:', {
      totalEarnings,
      perSecondEarnings: totalPerSecondEarnings,
      hourlyEarnings: totalHourlyEarnings,
      dailyEarnings: totalDailyEarnings
    });

    return {
      totalEarnings,
      dailyEarnings: totalDailyEarnings,
      hourlyEarnings: totalHourlyEarnings,
      perSecondEarnings: totalPerSecondEarnings,
      lastUpdate: currentTime
    };
  }, [slots, currentTime]);

  return earningsData;
};
