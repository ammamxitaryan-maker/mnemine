"use client";

import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useEarnings } from '@/hooks/useEarnings';
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

  const usdEquivalent = convertNONToUSD(totalEarnings);

  if (!isActive || perSecondRate === 0) {
    return null;
  }

  return (
    <div className={`minimal-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
          <span className="text-sm font-medium text-foreground">Live Earnings</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-yellow-500">
            +{totalEarnings.toFixed(6)} NON
          </div>
          {usdEquivalent > 0 && (
            <div className="text-xs text-muted-foreground">
              ≈ ${usdEquivalent.toFixed(4)} USD
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

