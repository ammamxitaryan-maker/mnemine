"use client";

import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useEarnings } from '@/hooks/useEarnings';
import { useMainBalance } from '@/hooks/useMainBalance';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { TrendingUp, Wallet, Zap, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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

  // Check for data inconsistency
  const hasDataInconsistency = (totalInvested || 0) > (totalBalance || 0);

  return (
    <div className={`minimal-card ${className}`}>
      {/* Data Inconsistency Warning */}
      {hasDataInconsistency && (
        <div className="mb-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <span className="text-sm font-medium text-red-500">Data Inconsistency</span>
          </div>
          <div className="text-xs text-red-500">
            Invested amount ({totalInvested?.toFixed(3)} MNE) exceeds total balance ({totalBalance?.toFixed(3)} MNE)
          </div>
        </div>
      )}

      {/* Main Available Balance - Compact Header */}
      <div className="text-center mb-4">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Wallet className="w-4 h-4 text-primary" />
          <h2 className="text-base font-medium text-foreground">{t('availableBalance')}</h2>
        </div>
        <div className={`text-3xl font-light mb-1 ${hasDataInconsistency ? 'text-red-500' : 'text-primary'}`}>
          {(availableBalance || 0).toFixed(3)} MNE
        </div>
        {usdEquivalent > 0 && (
          <div className="text-sm text-accent">
            ≈ ${usdEquivalent.toFixed(2)} USD
          </div>
        )}
        
        {/* Investment Button */}
        {(availableBalance || 0) > 0 && (
          <div className="mt-3">
            <Link to="/slots">
              <Button 
                size="mobile"
                className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 touch-manipulation"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                <span className="font-medium">{t('investNow')}</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <div className="mt-2 text-xs text-muted-foreground">
              {t('earn30PercentIn7Days')}
            </div>
          </div>
        )}
      </div>

      {/* Live Earnings - Compact Display */}
      {isActive && (liveEarnings || 0) > 0 && (
        <div className="text-center mb-4 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
            <h3 className="text-sm font-medium text-yellow-500">{t('liveEarnings')}</h3>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              <span className="text-xs text-yellow-500">{t('live')}</span>
            </div>
          </div>
          <div className="text-2xl font-light text-yellow-500 mb-1">
            +{(liveEarnings || 0).toFixed(6)} MNE
          </div>
          {convertMNEToUSD(liveEarnings || 0) > 0 && (
            <div className="text-xs text-muted-foreground">
              ≈ +${convertMNEToUSD(liveEarnings || 0).toFixed(2)} USD
            </div>
          )}
        </div>
      )}

      {/* Details Section - Compact Grid */}
      {showDetails && (
        <div className="grid grid-cols-1 gap-3">
          {/* Invested in Slots */}
          <div className="p-3 bg-muted/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{t('investedInSlots')}</span>
            </div>
            <div className="text-sm font-medium text-foreground">
              {(totalInvested || 0).toFixed(3)} MNE
            </div>
            <div className="text-xs text-muted-foreground">
              {activeSlotsCount} {activeSlotsCount !== 1 ? t('activeSlots') : t('activeSlot')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
