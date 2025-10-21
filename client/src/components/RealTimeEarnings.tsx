"use client";

import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useEarnings } from '@/hooks/useEarnings';
import { useSmoothEarnings, useSmoothUSD } from '@/hooks/useSmoothNumber';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface RealTimeEarningsProps {
  className?: string;
}

export const RealTimeEarnings = ({ className = '' }: RealTimeEarningsProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useTelegramAuth();
  const { convertNONToUSD } = useCachedExchangeRate(user?.telegramId || '');
  const { totalEarnings, perSecondRate, isActive } = useEarnings();

  // Use smooth animations for both NON and USD values
  const smoothEarnings = useSmoothEarnings(totalEarnings);
  const usdEquivalent = convertNONToUSD(totalEarnings);
  const smoothUSD = useSmoothUSD(usdEquivalent);

  if (!isActive || perSecondRate === 0) {
    return null;
  }

  return (
    <div className={`minimal-card transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
            <div className="absolute inset-0 w-4 h-4 bg-yellow-500/20 rounded-full animate-ping" />
          </div>
          <span className="text-sm font-medium text-foreground">Live Earnings</span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">live</span>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-medium text-yellow-500 transition-all duration-200 ${
            smoothEarnings.isAnimating ? 'scale-105' : 'scale-100'
          }`}>
            +{smoothEarnings.formatted} NON
          </div>
          {smoothUSD.value > 0 && (
            <div className={`text-xs text-muted-foreground transition-all duration-200 ${
              smoothUSD.isAnimating ? 'opacity-80' : 'opacity-100'
            }`}>
              ≈ +${smoothUSD.formatted} USD
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

