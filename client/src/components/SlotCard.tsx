"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, CheckCircle, XCircle, TrendingUp, Clock, Coins } from 'lucide-react';
import { MiningSlot } from '@/hooks/useSlotsData';
import { formatExpirationDate, getRemainingTime } from '@/utils/date';
import ProgressBar from './ProgressBar';
import { useWebSocketEarnings } from '@/hooks/useWebSocketEarnings';

interface SlotCardProps {
  slot: MiningSlot;
  telegramId?: string;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, telegramId }) => {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(getRemainingTime(slot.expiresAt));

  // Get real-time earnings data
  const { totalEarnings, slotsData, isConnected } = useWebSocketEarnings(telegramId);

  // Find current slot data from WebSocket updates
  const currentSlotData = slotsData.find(s => s.id === slot.id);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemainingTime(slot.expiresAt));
    }, 1000); // Update remaining time every second

    return () => clearInterval(timer);
  }, [slot.expiresAt]);

  // Use accumulated earnings from database (most accurate)
  // WebSocket data is used only for real-time status, not for earnings calculation
  const currentEarnings = slot.accruedEarnings || 0;

  const isExpired = remaining.totalSeconds <= 0;
  const statusText = isExpired ? t('slots.status.expired') : t('slots.status.active');
  const statusIcon = isExpired ? <XCircle className="w-4 h-4 text-red-500 mr-1" /> : <CheckCircle className="w-4 h-4 text-green-500 mr-1" />;
  const statusColor = isExpired ? 'text-red-400' : 'text-green-400';
  const profitPercentage = slot.effectiveWeeklyRate * 100;
  const totalDurationSeconds = (new Date(slot.expiresAt).getTime() - new Date(slot.createdAt).getTime()) / 1000;
  const elapsedSeconds = totalDurationSeconds - remaining.totalSeconds;
  const progress = totalDurationSeconds > 0 ? (elapsedSeconds / totalDurationSeconds) * 100 : 0;
  
  // Calculate final result (principal + accumulated earnings)
  const finalResult = slot.principal + currentEarnings;
  const currentTotal = slot.principal + currentEarnings;

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
          
          {/* Real-time earnings display */}
          <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                <span className="text-sm text-emerald-300">
                  {isConnected ? 'Live Earnings:' : 'Accumulated Earnings:'}
                </span>
                {isConnected && (
                  <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className={`text-lg font-bold ${isConnected ? 'text-emerald-400 animate-pulse' : 'text-emerald-300'}`}>
                +{currentEarnings.toFixed(4)} MNE
              </span>
            </div>
            {!isConnected && (
              <p className="text-xs text-gray-400 mt-1">Updates every 10 seconds</p>
            )}
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
