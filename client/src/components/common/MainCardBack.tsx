"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MiningSlot } from '@/hooks/useSlotsData'; // Use the unified MiningSlot interface
import { Loader2, Server, TrendingUp, DollarSign, Clock, BarChart3 } from 'lucide-react';
import { AuthenticatedUser } from '@/types/telegram'; // Import AuthenticatedUser
import { useCountdown } from '@/hooks/useCountdown'; // Import useCountdown

interface MainCardBackProps {
  user: AuthenticatedUser; // Use AuthenticatedUser type
  slots: MiningSlot[] | undefined;
  isLoading: boolean;
}

const SlotCountdown = ({ expiresAt }: { expiresAt: string }) => {
  const { days, hours, minutes, seconds, totalSeconds } = useCountdown(expiresAt);

  if (totalSeconds <= 0) {
    return <span className="text-red-400 text-xs">Expired</span>;
  }

  return (
    <span className="font-mono text-accent text-xs inline-flex items-center">
      {days}d {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
    </span>
  );
};

export const MainCardBack = ({ user, slots, isLoading }: MainCardBackProps) => {
  const { t } = useTranslation();
  const activeSlots = slots?.filter(s => s.isActive && new Date(s.expiresAt) > new Date());
  
  // Calculate total investment and daily earnings
  const totalInvestment = activeSlots?.reduce((sum, slot) => sum + slot.principal, 0) || 0;
  const totalDailyEarnings = activeSlots?.reduce((sum, slot) => {
    const dailyRate = slot.effectiveWeeklyRate / 7;
    return sum + (slot.principal * dailyRate);
  }, 0) || 0;
  return (
    <Card className="w-full h-full min-h-[20rem] max-h-[24rem] bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 shadow-2xl flex flex-col backdrop-blur-sm relative overflow-hidden">
      <CardHeader className="pb-3 text-center relative z-10">
        <CardTitle className="text-base font-bold flex items-center justify-center gap-2">
          <div className="p-1.5 bg-purple-400/20 rounded-full">
            <BarChart3 className="w-4 h-4 text-purple-400" />
          </div>
          {t('mainCardBack.activeMiningSlots')}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-grow px-4 py-2 overflow-y-auto custom-scrollbar relative z-10">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
              <p className="text-sm text-gray-300">Loading mining data...</p>
            </div>
          </div>
        ) : activeSlots && activeSlots.length > 0 ? (
          <div className="space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="relative bg-gradient-to-br from-emerald-900/40 to-emerald-800/30 border border-emerald-700/60 rounded-lg p-3 shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Server className="w-3 h-3 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-300">Invested</span>
                </div>
                <p className="text-sm font-bold text-emerald-400">{totalInvestment.toFixed(2)} <span className="text-xs text-gray-300">MNE</span></p>
              </div>
              <div className="relative bg-gradient-to-br from-cyan-900/40 to-cyan-800/30 border border-cyan-700/60 rounded-lg p-3 shadow-lg">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-medium text-cyan-300">Daily</span>
                </div>
                <p className="text-sm font-bold text-cyan-400">{totalDailyEarnings.toFixed(4)} <span className="text-xs text-gray-300">MNE</span></p>
              </div>
            </div>
            
            {/* Active Slots */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-300 text-center">Active Mining Slots</h3>
              {activeSlots.slice(0, 2).map(slot => (
                <div key={slot.id} className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-slate-600/50 rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lg font-bold text-white">{slot.principal.toFixed(2)} <span className="text-sm text-gray-300">MNE</span></span>
                    <span className="text-emerald-400 font-semibold">{(slot.effectiveWeeklyRate * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Time Left:</span>
                    </div>
                    <SlotCountdown expiresAt={slot.expiresAt} />
                  </div>
                </div>
              ))}
              {activeSlots.length > 2 && (
                <div className="text-center">
                  <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 rounded-xl p-3">
                    <p className="text-sm font-medium text-purple-300">+{activeSlots.length - 2} more active slots</p>
                    <p className="text-xs text-gray-400 mt-1">{t('mainCardBack.clickToViewAll')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="p-4 bg-gray-700/50 rounded-full w-fit mx-auto mb-4">
              <Server className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-semibold text-white mb-2">{t('mainCardBack.noActiveSlots')}</p>
            <p className="text-sm text-gray-300">{t('mainCardBack.goToSlotsPage')}</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-4 mt-auto relative z-10">
        <Link to="/slots" className="w-full" onClick={(e) => e.stopPropagation()}>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full border-2 border-purple-500 text-purple-300 hover:bg-purple-500/10 hover:text-purple-200 font-semibold py-2 rounded-xl transition-all duration-200"
          >
            {t('mainCardBack.manageSlots')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
