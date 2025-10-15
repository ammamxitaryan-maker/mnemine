"use client";

import { useTranslation } from 'react-i18next';
import { Wallet, Zap, TrendingUp } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData } from '@/hooks/useUserData';
import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useEarnings } from '@/contexts/EarningsContext';

interface CombinedBalanceEarningsProps {
  className?: string;
}

export const CombinedBalanceEarnings = ({ className = '' }: CombinedBalanceEarningsProps) => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { data: userData } = useUserData(user?.telegramId);
  const { convertMNEToUSD } = useCachedExchangeRate(user?.telegramId || '');
  const { totalEarnings, perSecondRate, isActive } = useEarnings();

  // Получаем основной баланс из userData
  const mainBalance = userData?.mneBalance || 0;
  const totalBalance = mainBalance + totalEarnings;
  const balanceUsd = convertMNEToUSD(totalBalance);
  const earningsUsd = convertMNEToUSD(totalEarnings);

  return (
    <div className={`minimal-card ${className}`}>
      {/* Основной баланс */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Your Balance</h2>
        </div>
        <div className="text-3xl font-light text-primary mb-1">
          {totalBalance.toFixed(6)} MNE
        </div>
        {balanceUsd > 0 && (
          <div className="text-sm text-accent">
            ≈ ${balanceUsd.toFixed(2)} USD
          </div>
        )}
      </div>

      {/* Live Earnings */}
      {isActive && perSecondRate > 0 && (
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary animate-pulse" />
              <h3 className="text-sm font-semibold text-foreground">Live Earnings</h3>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs text-primary">Live</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-xl font-light text-primary mb-1">
              +{totalEarnings.toFixed(6)} MNE
            </div>
            {earningsUsd > 0 && (
              <div className="text-sm text-accent">
                ≈ ${earningsUsd.toFixed(2)} USD
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
