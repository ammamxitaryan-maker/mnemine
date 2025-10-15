"use client";

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, TrendingUp } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';

interface RealTimeEarningsProps {
  telegramId: string;
  className?: string;
}

export const RealTimeEarnings = ({ telegramId, className = '' }: RealTimeEarningsProps) => {
  const { t } = useTranslation();
  const { data: userData } = useUserData(telegramId);
  const { data: slotsData } = useSlotsData(telegramId);
  const { convertMNEToUSD } = useCachedExchangeRate(telegramId);
  
  const [currentEarnings, setCurrentEarnings] = useState(0);
  const [perSecondRate, setPerSecondRate] = useState(0);

  // Calculate real-time earnings
  useEffect(() => {
    if (!slotsData || !userData) return;

    const activeSlots = slotsData.filter(slot => 
      slot.isActive && new Date(slot.expiresAt) > new Date()
    );

    if (activeSlots.length === 0) {
      setCurrentEarnings(0);
      setPerSecondRate(0);
      return;
    }

    // Calculate total earnings per second
    const totalPerSecond = activeSlots.reduce((total, slot) => {
      const dailyRate = slot.effectiveWeeklyRate / 7;
      const perSecond = (slot.principal * dailyRate) / (24 * 60 * 60);
      return total + perSecond;
    }, 0);

    setPerSecondRate(totalPerSecond);

    // Start real-time counter
    const interval = setInterval(() => {
      setCurrentEarnings(prev => prev + totalPerSecond);
    }, 1000);

    return () => clearInterval(interval);
  }, [slotsData, userData]);

  const usdEquivalent = convertMNEToUSD(currentEarnings);

  if (perSecondRate === 0) {
    return null;
  }

  return (
    <div className={`minimal-card ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Zap className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <span className="text-sm font-medium text-foreground">Live Earnings</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-xs text-primary">Live</span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-light text-primary mb-1">
          +{currentEarnings.toFixed(6)} MNE
        </div>
        {usdEquivalent > 0 && (
          <div className="text-sm text-accent mb-2">
            ≈ {usdEquivalent.toFixed(4)} USD
          </div>
        )}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span>+{perSecondRate.toFixed(8)} MNE/sec</span>
        </div>
      </div>
    </div>
  );
};
