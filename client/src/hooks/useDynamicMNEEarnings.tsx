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

    if (activeSlots.length === 0) {
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

    activeSlots.forEach(slot => {
      const now = new Date(currentTime);
      const lastAccruedAt = new Date(slot.lastAccruedAt);
      const timeElapsedMs = now.getTime() - lastAccruedAt.getTime();
      
      if (timeElapsedMs > 0) {
        // Calculate earnings since last accrual
        const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
        const earnings = earningsPerSecond * (timeElapsedMs / 1000);
        
        totalEarnings += earnings;
        totalPerSecondEarnings += earningsPerSecond;
        totalHourlyEarnings += earningsPerSecond * 3600;
        totalDailyEarnings += earningsPerSecond * 86400;
      }
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
