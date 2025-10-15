"use client";

import { useTranslation } from 'react-i18next';
import { Coins, DollarSign } from 'lucide-react';
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
    <div className={`minimal-card text-center ${className}`}>
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <Coins className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Your Balance</p>
          <div className="text-3xl font-light text-primary">
            {mneBalance.toFixed(2)} MNE
          </div>
        </div>
      </div>
      
      {usdEquivalent > 0 && (
        <div className="flex items-center justify-center gap-2 text-lg text-accent">
          <DollarSign className="w-4 h-4" />
          <span className="font-medium">≈ {usdEquivalent.toFixed(2)} USD</span>
        </div>
      )}
    </div>
  );
};
