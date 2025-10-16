"use client";

import { useTranslation } from 'react-i18next';
import { TrendingUp } from 'lucide-react';
import { useSlotsData } from '@/hooks/useSlotsData';
import { calculateTotalEarnings, calculateSlotEarnings, formatTime } from '@/utils/earningsCalculator';

interface EarningsDetailsProps {
  telegramId: string;
  className?: string;
}

export const EarningsDetails = ({ telegramId, className = '' }: EarningsDetailsProps) => {
  const { t } = useTranslation();
  const { data: slotsData } = useSlotsData(telegramId);

  if (!slotsData || slotsData.length === 0) {
    return null;
  }

  const { activeSlots } = calculateTotalEarnings(slotsData);

  if (activeSlots.length === 0) {
    return null;
  }

  return (
    <div className={`minimal-card ${className}`}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-primary" />
        <h3 className="font-medium text-foreground">{t('earningsDetails')}</h3>
      </div>


      {/* Individual Slots */}
      <div className="space-y-2">
        {activeSlots.slice(0, 3).map((slot, index) => {
          // Find the actual slot data by matching principal amount
          const slotData = slotsData.find(s => Math.abs(s.principal - slot.principal) < 0.001);
          const slotEarnings = slotData ? calculateSlotEarnings(slotData) : slot;
          const expectedReturn = slot.principal * 1.3; // 30% return
          const timeLeft = slotEarnings.remainingSeconds;
          
          return (
            <div key={index} className="p-2 bg-muted/10 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium text-foreground">
                  Slot #{index + 1}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatTime(timeLeft)} left
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="text-xs text-muted-foreground">Invested</div>
                <div className="text-xs text-muted-foreground">Current</div>
                <div className="text-xs text-muted-foreground">Final</div>
                <div className="text-sm font-medium text-foreground">
                  {slot.principal.toFixed(2)}
                </div>
                <div className="text-sm font-medium text-primary">
                  {slotEarnings.totalReturn.toFixed(2)}
                </div>
                <div className="text-sm font-medium text-accent">
                  {expectedReturn.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
        
        {activeSlots.length > 3 && (
          <div className="text-center text-xs text-muted-foreground py-1">
            +{activeSlots.length - 3} more slots
          </div>
        )}
      </div>
    </div>
  );
};

