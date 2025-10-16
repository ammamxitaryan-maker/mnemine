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

  // Debug: Always show component to test
  if (!isActive || perSecondRate === 0) {
    return (
      <div className={`minimal-card ${className}`}>
        <div className="text-center text-xs text-gray-500">
          Debug: No active earnings | isActive: {isActive ? 'Yes' : 'No'} | Rate: {perSecondRate.toFixed(8)} | Total: {totalEarnings.toFixed(6)} | Lang: {i18n.language}
        </div>
        <div className="text-center text-xs text-blue-500 mt-2">
          WebSocket: Check console for connection status
        </div>
      </div>
    );
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
      {/* Debug info - remove in production */}
      <div className="text-xs text-gray-500 mt-2 text-center">
        Debug: {totalEarnings.toFixed(8)} MNE | Rate: {perSecondRate.toFixed(10)}/sec | Active: {isActive ? 'Yes' : 'No'} | Lang: {i18n.language}
      </div>
    </div>
  );
};

