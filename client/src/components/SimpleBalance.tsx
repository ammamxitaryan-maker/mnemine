"use client";

import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useUserData } from '@/hooks/useUserData';
import { Coins } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SimpleBalanceProps {
  telegramId: string;
  className?: string;
}

export const SimpleBalance = ({ telegramId, className = '' }: SimpleBalanceProps) => {
  const { t: _t } = useTranslation();
  const { data: userData } = useUserData(telegramId);
  const { convertNONToUSD } = useCachedExchangeRate(telegramId);

  const mneBalance = userData?.balance || 0;
  const usdEquivalent = convertNONToUSD(mneBalance);

  return (
    <div className={`minimal-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Your Balance</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-medium text-primary">
            {mneBalance.toFixed(2)} NON
          </div>
          {usdEquivalent > 0 && (
            <div className="relative">
              <div className="flex items-center gap-1 mb-1">
                <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-green-400 font-medium uppercase tracking-wider">USD</span>
              </div>
              <div className="text-sm font-bold text-green-500 drop-shadow-sm relative">
                <span className="relative z-10">${usdEquivalent.toFixed(2)}</span>
                <div className="absolute inset-0 text-green-500/20 blur-sm">${usdEquivalent.toFixed(2)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
