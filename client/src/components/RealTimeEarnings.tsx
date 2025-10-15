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
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { convertMNEToUSD } = useCachedExchangeRate(user?.telegramId || '');
  const { totalEarnings, perSecondRate, isActive } = useEarnings();

  const usdEquivalent = convertMNEToUSD(totalEarnings);

  if (!isActive || perSecondRate === 0) {
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
                 +{totalEarnings.toFixed(6)} MNE
               </div>
               {usdEquivalent > 0 && (
                 <div className="text-sm text-accent">
                   ≈ ${usdEquivalent.toFixed(2)} USD
                 </div>
               )}
             </div>
    </div>
  );
};
