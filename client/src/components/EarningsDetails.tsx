"use client";

import { useTranslation } from 'react-i18next';
import { TrendingUp, Clock, DollarSign, Target, Zap } from 'lucide-react';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useEarnings } from '@/hooks/useEarnings';
import { calculateTotalEarnings, calculateSlotEarnings, formatTime } from '@/utils/earningsCalculator';

interface EarningsDetailsProps {
  telegramId: string;
  className?: string;
}

export const EarningsDetails = ({ telegramId, className = '' }: EarningsDetailsProps) => {
  const { t } = useTranslation();
  const { data: slotsData } = useSlotsData(telegramId);
  const { totalEarnings, perSecondRate } = useEarnings();

  if (!slotsData || slotsData.length === 0) {
    return null;
  }

  const { totalDailyReturn, totalPrincipal, totalExpectedReturn, activeSlots } = calculateTotalEarnings(slotsData);

  if (activeSlots.length === 0) {
    return null;
  }

  const totalReturnPercentage = totalPrincipal > 0 ? ((totalExpectedReturn - totalPrincipal) / totalPrincipal) * 100 : 0;
  const timeToComplete = perSecondRate > 0 ? totalPrincipal * 0.3 / perSecondRate : 0; // Время до получения 30%

  return (
    <div className={`minimal-card ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 bg-primary/10 rounded-xl">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">{t('earningsDetails')}</h3>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-muted/20 rounded-xl">
          <div className="text-lg font-light text-primary mb-1">
            {totalPrincipal.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground">{t('totalInvested')}</div>
        </div>
        
        <div className="text-center p-3 bg-muted/20 rounded-xl">
          <div className="text-lg font-light text-accent mb-1">
            {totalReturnPercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">{t('expectedReturn')}</div>
        </div>
      </div>

      {/* Daily and Per-Second Rates */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{t('dailyRate')}</span>
          </div>
          <span className="text-sm font-medium text-primary">
            +{totalDailyReturn.toFixed(6)} MNE
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{t('perSecond')}</span>
          </div>
          <span className="text-sm font-medium text-primary">
            +{perSecondRate.toFixed(8)} MNE
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">{t('timeTo30')}</span>
          </div>
          <span className="text-sm font-medium text-accent">
            {formatTime(timeToComplete)}
          </span>
        </div>
      </div>

      {/* Individual Slots */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground mb-2">{t('activeSlots')}</h4>
        {activeSlots.slice(0, 3).map((slot, index) => {
          // Find the actual slot data by matching principal amount
          const slotData = slotsData.find(s => Math.abs(s.principal - slot.principal) < 0.001);
          const slotEarnings = slotData ? calculateSlotEarnings(slotData) : slot;
          
          return (
            <div key={index} className="flex items-center justify-between p-2 bg-muted/10 rounded-lg">
              <div>
                <div className="text-sm font-medium text-foreground">
                  Slot #{index + 1}
                </div>
                <div className="text-xs text-muted-foreground">
                  {slot.principal.toFixed(2)} MNE • {slot.remainingDays.toFixed(1)}d left
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-primary">
                  +{slotEarnings.perSecondRate.toFixed(6)}/s
                </div>
                <div className="text-xs text-muted-foreground">
                  {slotEarnings.principal > 0 ? ((slotEarnings.totalReturn - slotEarnings.principal) / slotEarnings.principal * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          );
        })}
        
        {activeSlots.length > 3 && (
          <div className="text-center text-xs text-muted-foreground py-2">
{t('moreSlots', { count: activeSlots.length - 3 })}
          </div>
        )}
      </div>
    </div>
  );
};
