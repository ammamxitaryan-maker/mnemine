"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, Wallet, TrendingUp, Clock, Zap, ChevronDown, DollarSign } from 'lucide-react';
import { useExchangeRate } from '@/hooks/useSwap';

interface MainCardFrontProps {
  userData: { balance: number; mneBalance: number; miningPower: number } | undefined;
  slotsData: { isActive: boolean; expiresAt: string }[] | undefined;
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
  
  // Get exchange rate for USD equivalent calculation
  const { data: rateData } = useExchangeRate(telegramId);
  const usdEquivalent = rateData && userData?.mneBalance ? userData.mneBalance * rateData.rate : 0;

  return (
    <Card
      className="w-full max-w-[95vw] min-h-[18rem] max-h-[28rem] sm:min-h-[22rem] sm:max-h-[32rem] bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 shadow-2xl flex flex-col justify-between backdrop-blur-sm relative overflow-hidden box-border"
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
          {/* USD Equivalent Display */}
          {usdEquivalent > 0 && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="p-2 bg-yellow-400/20 rounded-full">
                <DollarSign className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-lg font-semibold text-yellow-400">
                {usdEquivalent.toFixed(4)} <span className="text-sm text-yellow-300">USD</span>
              </p>
            </div>
          )}
        </div>

        {/* Accrued Earnings Section */}
        <div className="w-full flex-grow">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-200">{t('accruedEarnings')}</h2>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-purple-400">Live</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 bg-yellow-400/20 rounded-full">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div className="flex flex-col items-center">
              <p className="text-2xl sm:text-3xl font-bold text-white animate-pulse line-clamp-1">
                {(() => {
                  // Check if user has purchased slots (has active slots)
                  const hasActiveSlots = slotsData && slotsData.some(slot => slot.isActive && new Date(slot.expiresAt) > new Date());
                  
                  if (hasActiveSlots) {
                    // Show 30% bonus visually only - multiply by 1.3 for display
                    const displayWithBonus = displayEarnings * 1.3;
                    return displayWithBonus.toFixed(8);
                  } else {
                    // Show normal earnings if no slots
                    return displayEarnings.toFixed(8);
                  }
                })()} <span className="text-sm sm:text-base text-gray-300">USD</span>
              </p>
              {/* Show bonus indicator if user has slots */}
              {slotsData && slotsData.some(slot => slot.isActive && new Date(slot.expiresAt) > new Date()) && (
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs font-medium text-emerald-400">+30% Bonus</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
              )}
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
