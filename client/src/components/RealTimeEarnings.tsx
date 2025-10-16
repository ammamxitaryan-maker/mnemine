"use client";

import { useTranslation } from 'react-i18next';
import { Zap, TrendingUp } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useEarnings } from '@/hooks/useEarnings';

interface RealTimeEarningsProps {
  className?: string;
}

export const RealTimeEarnings = ({ className = '' }: RealTimeEarningsProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useTelegramAuth();
  const { convertMNEToUSD } = useCachedExchangeRate(user?.telegramId || '');
  const { totalEarnings, perSecondRate, isActive } = useEarnings();

  const usdEquivalent = convertMNEToUSD(totalEarnings);

  if (!isActive || perSecondRate === 0) {
    return null;
  }

  return (
    <div className={`minimal-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-sm font-medium text-foreground">Live Earnings</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-medium text-primary">
            +{totalEarnings.toFixed(6)} MNE
          </div>
          {usdEquivalent > 0 && (
            <div className="text-xs text-muted-foreground">
              ≈ ${usdEquivalent.toFixed(2)} USD
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

