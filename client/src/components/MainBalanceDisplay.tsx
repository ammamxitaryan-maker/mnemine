"use client";

import { Button } from '@/components/ui/button';
import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useEarnings } from '@/hooks/useEarnings';
import { useMainBalance } from '@/hooks/useMainBalance';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { ArrowRight, TrendingUp, Wallet, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface MainBalanceDisplayProps {
  className?: string;
  showDetails?: boolean;
}

export const MainBalanceDisplay = ({
  className = '',
  showDetails = true
}: MainBalanceDisplayProps) => {
  const { t, i18n } = useTranslation();
  const { user } = useTelegramAuth();
  const { totalEarnings: liveEarnings, perSecondRate, isActive } = useEarnings();
  const { convertNONToUSD } = useCachedExchangeRate(user?.telegramId || '');
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
          <p className="text-muted-foreground">{t('loadingBalance')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`minimal-card ${className}`}>
        <div className="text-center">
          <p className="text-destructive">{t('failedToLoadBalance')}</p>
        </div>
      </div>
    );
  }

  // Check for data inconsistency - this should not happen with the new logic
  const hasDataInconsistency = false; // Removed since we now prevent negative balances

  return (
    <div className={`relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-4 shadow-lg ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-50" />

      {/* Main Available Balance - Compact Design */}
      <div className="relative z-10 text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-1.5 bg-primary/10 rounded-lg">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <h2 className="text-base font-semibold text-foreground">{t('availableBalance')}</h2>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-center gap-2 mb-1">
            <div className="text-3xl font-light text-primary tracking-tight">
              {(availableBalance || 0).toFixed(3)} NON
            </div>
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <div className="absolute inset-0 w-2 h-2 bg-green-500/30 rounded-full animate-ping" />
            </div>
          </div>
          {usdEquivalent > 0 && (
            <div className="text-sm text-accent font-medium">
              ≈ ${usdEquivalent.toFixed(4)} USD
            </div>
          )}
        </div>

        {/* Investment Button - Compact */}
        {(availableBalance || 0) > 0 && (
          <div className="mt-3">
            <Link to="/slots">
              <Button
                size="mobile"
                className="w-full bg-gradient-to-r from-primary via-primary to-accent hover:from-primary/90 hover:via-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 active:scale-95 touch-manipulation rounded-lg py-3 text-sm font-semibold"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="font-semibold">{t('investNow')}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <div className="mt-2 text-xs text-muted-foreground font-medium">
              {t('earn30PercentIn7Days')}
            </div>
          </div>
        )}
      </div>

      {/* Live Earnings - Compact Display */}
      {isActive && (liveEarnings || 0) > 0 && (
        <div className="relative z-10 text-center mb-3 p-3 bg-gradient-to-r from-yellow-500/10 to-yellow-600/5 rounded-lg border border-yellow-500/30 shadow-lg">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="relative">
              <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 w-4 h-4 bg-yellow-500/30 rounded-full animate-ping" />
            </div>
            <h3 className="text-sm font-semibold text-yellow-500">{t('liveEarnings')}</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs text-yellow-500 font-medium">{t('live')}</span>
            </div>
          </div>
          <div className="text-2xl font-light text-yellow-500 mb-1 tracking-tight">
            +{(liveEarnings || 0).toFixed(6)} NON
          </div>
          {convertNONToUSD(liveEarnings || 0) > 0 && (
            <div className="text-xs text-muted-foreground font-medium">
              ≈ +${convertNONToUSD(liveEarnings || 0).toFixed(4)} USD
            </div>
          )}
        </div>
      )}

    </div>
  );
};
