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
            <div className="text-sm text-muted-foreground">
              ≈ ${usdEquivalent.toFixed(4)} USD
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
