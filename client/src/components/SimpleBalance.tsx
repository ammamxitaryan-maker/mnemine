"use client";

import { useTranslation } from 'react-i18next';
import { Coins } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';

interface SimpleBalanceProps {
  telegramId: string;
  className?: string;
}

export const SimpleBalance = ({ telegramId, className = '' }: SimpleBalanceProps) => {
  const { t } = useTranslation();
  const { data: userData } = useUserData(telegramId);
  const { convertMNEToUSD } = useCachedExchangeRate(telegramId);

  const mneBalance = userData?.mneBalance || 0;
  const usdEquivalent = convertMNEToUSD(mneBalance);

  return (
    <div className={`minimal-card ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Your Balance</span>
        </div>
        <div className="text-right">
          <div className="text-xl font-medium text-primary">
            {mneBalance.toFixed(2)} MNE
          </div>
          {usdEquivalent > 0 && (
            <div className="text-sm text-muted-foreground">
              ≈ ${usdEquivalent.toFixed(2)} USD
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
