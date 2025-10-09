"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, Wallet, TrendingUp, Clock, Zap, ChevronDown, DollarSign } from 'lucide-react';
import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useDynamicMNEEarnings } from '@/hooks/useDynamicMNEEarnings';
import { useWebSocketEarnings } from '@/hooks/useWebSocketEarnings';

interface MainCardFrontProps {
  userData: { balance: number; mneBalance: number; miningPower: number } | undefined;
  slotsData: { isActive: boolean; expiresAt: string; principal: number; effectiveWeeklyRate: number; lastAccruedAt: string; id: string; userId: string; createdAt: string; type: string; earningsPerSecond: number }[] | undefined;
  displayEarnings: number;
  telegramId: string;
}

export const MainCardFront = ({
  userData,
  slotsData,
  displayEarnings,
  telegramId
}: MainCardFrontProps) => {
  const { t } = useTranslation();
  
  // Use WebSocket earnings for real-time updates
  const { 
    isConnected: wsConnected, 
    totalEarnings: wsEarnings, 
    currentBalance: wsBalance,
    lastUpdate: wsLastUpdate 
  } = useWebSocketEarnings(telegramId);

  // Get dynamic MNE earnings
  const dynamicEarnings = useDynamicMNEEarnings(slotsData);

  // Get cached exchange rate for USD equivalent
  const { convertMNEToUSD, isStale } = useCachedExchangeRate(telegramId);
  
  // Use WebSocket earnings if available, otherwise fall back to dynamic earnings
  const currentEarnings = wsConnected && wsEarnings > 0 ? wsEarnings : dynamicEarnings.totalEarnings;
  const currentBalance = wsConnected && wsBalance > 0 ? wsBalance : userData?.balance || 0;
  
  // Calculate USD equivalents
  const mneBalanceUSD = convertMNEToUSD(userData?.mneBalance || 0);
  const dynamicEarningsUSD = convertMNEToUSD(currentEarnings);

  return (
    <Card
      className="w-full h-full min-h-[20rem] max-h-[24rem] bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 shadow-2xl flex flex-col justify-between backdrop-blur-sm relative overflow-hidden box-border"
    >
      {/* Header Section with Expand Indicator */}
      <div className="absolute top-4 right-4 z-20">
        <div className="w-6 h-6 bg-slate-700/50 rounded-full flex items-center justify-center">
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      <CardContent className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center gap-4 sm:gap-6 text-center relative z-10 overflow-hidden">
        {/* Balance Section */}
        <div className="w-full flex-grow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-200">{t('balance')}</h2>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400">+0.02%</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 bg-purple-400/20 rounded-full">
              <Coins className="w-6 h-6 text-purple-400" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-white line-clamp-1">
              {(userData?.mneBalance ?? 0).toFixed(2)} <span className="text-sm sm:text-base text-gray-300">MNE</span>
            </p>
          </div>
          {/* USD Equivalent Display with Cache Status */}
          {mneBalanceUSD > 0 && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="p-2 bg-yellow-400/20 rounded-full">
                <DollarSign className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-lg font-semibold text-yellow-400">
                {mneBalanceUSD.toFixed(4)} <span className="text-sm text-yellow-300">USD</span>
                {isStale && <span className="text-xs text-orange-400 ml-1">(cached)</span>}
              </p>
            </div>
          )}
        </div>

        {/* Dynamic MNE Earnings Section */}
        <div className="w-full flex-grow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-200">Live Earnings</h2>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400 animate-pulse" />
              <span className="text-xs font-medium text-purple-400">
                {wsConnected ? 'WebSocket' : 'Real-time'}
              </span>
              {wsConnected && (
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 bg-emerald-400/20 rounded-full">
              <Coins className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl sm:text-3xl font-bold text-white animate-pulse line-clamp-1">
                {currentEarnings.toFixed(4)} <span className="text-sm sm:text-base text-gray-300">MNE</span>
              </p>
              {/* USD Equivalent for Dynamic Earnings */}
              {dynamicEarningsUSD > 0 && (
                <p className="text-sm font-semibold text-yellow-400 mt-1">
                  {dynamicEarningsUSD.toFixed(4)} <span className="text-xs text-yellow-300">USD</span>
                  {isStale && <span className="text-xs text-orange-400 ml-1">(cached)</span>}
                </p>
              )}
              {/* Earnings Rate Indicator */}
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs font-medium text-emerald-400">
                  +{dynamicEarnings.perSecondEarnings.toFixed(6)} MNE/sec
                </span>
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Mining Stats */}
        <div className="w-full grid grid-cols-2 gap-2">
          <div className="relative bg-gradient-to-br from-cyan-900/40 to-cyan-800/30 border border-cyan-700/60 rounded-lg p-2 shadow-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-300">Power</span>
            </div>
            <p className="text-sm font-bold text-cyan-400">{((userData?.miningPower ?? 0) * 100).toFixed(2)}%</p>
          </div>
          <div className="relative bg-gradient-to-br from-emerald-900/40 to-emerald-800/30 border border-emerald-700/60 rounded-lg p-2 shadow-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-3 h-3 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">Slots</span>
            </div>
            <p className="text-sm font-bold text-emerald-400">
              {slotsData?.filter(s => s.isActive && new Date(s.expiresAt) > new Date()).length || 0}
            </p>
          </div>
        </div>

        {/* Dynamic Earnings Rate Display */}
        {dynamicEarnings.perSecondEarnings > 0 && (
          <div className="w-full mt-2">
            <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400 animate-pulse" />
                  <span className="text-sm text-emerald-300">Earnings Rate:</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-400 animate-pulse">
                    +{dynamicEarnings.perSecondEarnings.toFixed(6)} MNE/sec
                  </p>
                  <p className="text-xs text-emerald-300">
                    {dynamicEarnings.hourlyEarnings.toFixed(4)} MNE/hour
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Auto-claim info */}
      <CardFooter className="p-4 relative z-10">
        <div className="w-full bg-gradient-to-r from-blue-900/40 to-blue-800/30 border border-blue-700/60 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Auto-claim in 7 days</span>
          </div>
          <p className="text-xs text-blue-200">
            Earnings will automatically be added to your MNE balance
          </p>
        </div>
      </CardFooter>

    </Card>
  );
};
