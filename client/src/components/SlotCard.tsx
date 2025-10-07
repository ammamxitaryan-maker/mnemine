"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, CheckCircle, XCircle, TrendingUp, Clock } from 'lucide-react';
import { MiningSlot } from '@/hooks/useSlotsData';
import { formatExpirationDate, getRemainingTime } from '@/utils/date';
import ProgressBar from './ProgressBar';

interface SlotCardProps {
  slot: MiningSlot;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot }) => {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(getRemainingTime(slot.expiresAt));
  
  // Animated earnings instead of real-time calculation
  const [dynamicEarnings, setDynamicEarnings] = useState(0);
  const [animationStartTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemainingTime(slot.expiresAt));
      
      // Animated earnings - just for visual effect
      const now = Date.now();
      const elapsed = (now - animationStartTime) / 1000; // seconds since mount
      const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
      const animatedEarnings = earningsPerSecond * elapsed;
      
      setDynamicEarnings(animatedEarnings);
    }, 200); // Update every 200ms for smooth animation
    
    return () => clearInterval(timer);
  }, [slot.expiresAt, slot.principal, slot.effectiveWeeklyRate, animationStartTime]);

  const isExpired = remaining.totalSeconds <= 0;
  const statusText = isExpired ? t('slots.status.expired') : t('slots.status.active');
  const statusIcon = isExpired ? <XCircle className="w-4 h-4 text-red-500 mr-1" /> : <CheckCircle className="w-4 h-4 text-green-500 mr-1" />;
  const statusColor = isExpired ? 'text-red-400' : 'text-green-400';
  const profitPercentage = slot.effectiveWeeklyRate * 100;
  const totalDurationSeconds = (new Date(slot.expiresAt).getTime() - new Date(slot.createdAt).getTime()) / 1000;
  const elapsedSeconds = totalDurationSeconds - remaining.totalSeconds;
  const progress = totalDurationSeconds > 0 ? (elapsedSeconds / totalDurationSeconds) * 100 : 0;
  
  // Calculate final result (principal + 30% profit)
  const finalResult = slot.principal * 1.3;
  const currentTotal = slot.principal + dynamicEarnings;

  return (
    <Card className="bg-gray-900/80 border-primary text-white flex flex-col">
      <div className="p-4 flex-grow">
        <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center">
            <Coins className="w-5 h-5 mr-2 text-purple-400" />
            {t('slots.investment')}
          </CardTitle>
          <div className={`flex items-center text-sm font-medium ${statusColor}`}>
            {statusIcon}
            {statusText}
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-2xl font-extrabold text-purple-400">{slot.principal.toFixed(2)} MNE</p>
            <div className="text-right">
              <p className="text-lg font-bold text-emerald-400 animate-pulse">
                {currentTotal.toFixed(2)} MNE
              </p>
              <p className="text-xs text-gray-400">Current Total</p>
            </div>
          </div>
          
          {/* Dynamic earnings display */}
          <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                <span className="text-sm text-emerald-300">Dynamic Earnings:</span>
              </div>
              <span className="text-lg font-bold text-emerald-400 animate-pulse">
                +{dynamicEarnings.toFixed(4)} MNE
              </span>
            </div>
          </div>
          
          {/* Final result display */}
          <div className="bg-gradient-to-r from-gold/20 to-yellow-500/10 border border-gold/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-gold" />
                <span className="text-sm text-gold">Final Result:</span>
              </div>
              <span className="text-lg font-bold text-gold">
                {finalResult.toFixed(4)} USD
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">You will receive this amount at the end of the week</p>
          </div>
          
          <div className="flex items-center text-sm text-gray-300">
            <TrendingUp className="w-4 h-4 mr-1 text-green-400" />
            <span>{t('slots.profit')}: <span className="font-semibold text-green-400">{profitPercentage.toFixed(2)}%</span></span>
          </div>
          <div className="flex items-center text-sm text-gray-300">
            <Calendar className="w-4 h-4 mr-1 text-gray-400" />
            <span>{t('slots.expires')}: {formatExpirationDate(slot.expiresAt)}</span>
          </div>
          <div className="pt-2">
            <p className="text-xs text-gray-400 mb-1">{t('slots.remainingTime')}</p>
            <ProgressBar progress={progress} />
            <p className="text-center text-sm font-mono text-accent mt-1">
              {isExpired ? '00d 00h 00m 00s' : `${remaining.days}d ${String(remaining.hours).padStart(2, '0')}h ${String(remaining.minutes).padStart(2, '0')}m ${String(remaining.seconds).padStart(2, '0')}s`}
            </p>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default SlotCard;
