"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Coins, Wallet, TrendingUp, Clock, Zap } from 'lucide-react';

interface MainCardFrontProps {
  userData: { balance: number; miningPower: number } | undefined;
  slotsData: { isActive: boolean; expiresAt: string }[] | undefined;
  displayEarnings: number;
  onClaim: () => void;
  isClaiming: boolean;
}

export const MainCardFront = ({
  userData,
  slotsData,
  displayEarnings,
  onClaim,
  isClaiming
}: MainCardFrontProps) => {
  const { t } = useTranslation();

  return (
    <Card
      className="w-full max-w-[95vw] min-h-[16rem] max-h-[24rem] bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 shadow-2xl flex flex-col justify-between backdrop-blur-sm relative overflow-hidden box-border"
    >
      <CardContent className="p-8 flex flex-col items-center justify-center gap-6 text-center relative z-10 overflow-hidden">
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
            <div className="p-3 bg-yellow-400/20 rounded-full">
              <Wallet className="w-6 h-6 text-yellow-400" />
            </div>
            <p className="text-3xl font-bold text-white line-clamp-1">
              {(userData?.balance ?? 0).toFixed(4)} <span className="text-base text-gray-300">CFM</span>
            </p>
          </div>
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
            <p className="text-3xl font-bold text-white animate-pulse line-clamp-1">
              {displayEarnings.toFixed(8)} <span className="text-base text-gray-300">CFM</span>
            </p>
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

      <CardFooter className="p-4 relative z-10">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onClaim();
          }}
          disabled={isClaiming || displayEarnings < 0.000001}
          className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold py-2 rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : t('claim')}
        </Button>
      </CardFooter>

    </Card>
  );
};