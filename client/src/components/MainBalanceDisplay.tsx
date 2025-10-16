"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Wallet, TrendingUp, DollarSign, Coins, Zap } from 'lucide-react';
import { useMainBalance } from '@/hooks/useMainBalance';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useEarnings } from '@/hooks/useEarnings';
import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';

interface MainBalanceDisplayProps {
  className?: string;
  showDetails?: boolean;
}

export const MainBalanceDisplay = ({ 
  className = '', 
  showDetails = true 
}: MainBalanceDisplayProps) => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { totalEarnings: liveEarnings, perSecondRate, isActive } = useEarnings();
  const { convertMNEToUSD } = useCachedExchangeRate(user?.telegramId || '');
  const {
    availableBalance,
    totalInvested,
    totalBalance,
    activeSlotsCount,
    totalEarnings,
    usdEquivalent,
    totalUsdEquivalent,
    earningsUsd,
    isLoading,
    error
  } = useMainBalance(user?.telegramId);

  if (isLoading) {
    return (
      <div className={`minimal-card ${className}`}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading balance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`minimal-card ${className}`}>
        <div className="text-center">
          <p className="text-destructive">Failed to load balance</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`minimal-card ${className}`}>
      {/* Main Available Balance */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Wallet className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Available Balance</h2>
        </div>
        <div className="text-4xl font-light text-primary mb-1">
          {(availableBalance || 0).toFixed(3)} MNE
        </div>
        {usdEquivalent > 0 && (
          <div className="text-sm text-accent">
            ≈ ${usdEquivalent.toFixed(2)} USD
          </div>
        )}
      </div>

      {/* Live Earnings - Prominent Display */}
      {isActive && (liveEarnings || 0) > 0 && (
        <div className="text-center mb-6 p-4 bg-accent/10 rounded-xl border border-accent/20">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-accent animate-pulse" />
            <h3 className="text-lg font-medium text-accent">{t('liveEarnings')}</h3>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="text-xs text-accent">Live</span>
            </div>
          </div>
          <div className="text-3xl font-light text-accent mb-1">
            +{(liveEarnings || 0).toFixed(4)} MNE
          </div>
          <div className="text-sm text-muted-foreground mb-1">
            {perSecondRate.toFixed(6)} MNE/sec
          </div>
          {convertMNEToUSD(liveEarnings || 0) > 0 && (
            <div className="text-sm text-muted-foreground">
              ≈ +${convertMNEToUSD(liveEarnings || 0).toFixed(2)} USD
            </div>
          )}
        </div>
      )}

      {/* Details Section */}
      {showDetails && (
        <div className="space-y-4">
          {/* Total Balance */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Balance</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {(totalBalance || 0).toFixed(3)} MNE
              </div>
              {totalUsdEquivalent > 0 && (
                <div className="text-xs text-muted-foreground">
                  ≈ ${totalUsdEquivalent.toFixed(2)} USD
                </div>
              )}
            </div>
          </div>

          {/* Invested in Slots */}
          <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Invested in Slots</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-foreground">
                {(totalInvested || 0).toFixed(3)} MNE
              </div>
              <div className="text-xs text-muted-foreground">
                {activeSlotsCount} active slot{activeSlotsCount !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
