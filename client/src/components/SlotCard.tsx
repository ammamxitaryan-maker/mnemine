"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Calendar, CheckCircle, XCircle, TrendingUp, Clock, Coins, Download } from 'lucide-react';
import { MiningSlot } from '@/hooks/useSlotsData';
import { formatExpirationDate, getRemainingTime } from '@/utils/date';
import ProgressBar from './ProgressBar';
import { api } from '@/lib/api';

interface SlotCardProps {
  slot: MiningSlot;
  telegramId?: string;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, telegramId }) => {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(getRemainingTime(slot.expiresAt));

  // Get real-time earnings data from server
  const [realTimeSlotData, setRealTimeSlotData] = useState<any>(null);
  const [isLoadingRealTime, setIsLoadingRealTime] = useState(false);

  // Fetch real-time slot data from server
  const fetchRealTimeSlotData = async () => {
    if (!telegramId) return;
    
    setIsLoadingRealTime(true);
    try {
      const response = await api.get(`/user/${telegramId}/real-time-income`);
      const slotData = response.data.slots?.find((s: any) => s.id === slot.id);
      setRealTimeSlotData(slotData);
    } catch (error) {
      console.error('Error fetching real-time slot data:', error);
    } finally {
      setIsLoadingRealTime(false);
    }
  };

  useEffect(() => {
    if (telegramId && slot.isActive) {
      fetchRealTimeSlotData();
      // Update every 3 seconds for real-time effect
      const interval = setInterval(fetchRealTimeSlotData, 3000);
      return () => clearInterval(interval);
    }
  }, [telegramId, slot.id, slot.isActive]);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemainingTime(slot.expiresAt));
    }, 1000); // Update remaining time every second

    return () => clearInterval(timer);
  }, [slot.expiresAt]);

  // Use server-calculated real-time earnings
  const currentEarnings = realTimeSlotData?.currentEarnings || slot.accruedEarnings || 0;
  const currentBalance = realTimeSlotData?.currentBalance || (slot.principal + currentEarnings);
  const progress = realTimeSlotData?.progress || 0;
  const isCompleted = realTimeSlotData?.isCompleted || false;
  const [isClaiming, setIsClaiming] = useState(false);

  // Claim completed slot
  const handleClaimSlot = async () => {
    if (!telegramId || !slot.id) return;
    
    setIsClaiming(true);
    try {
      const response = await api.post(`/user/${telegramId}/claim/${slot.id}`, {
        telegramId: telegramId
      });
      
      if (response.data.success) {
        // Show success message
        console.log('Slot claimed successfully:', response.data.message);
        // Refresh the slot data
        fetchRealTimeSlotData();
      }
    } catch (error) {
      console.error('Error claiming slot:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const isExpired = remaining.totalSeconds <= 0 || isCompleted;
  const statusText = isCompleted ? 'Completed' : (isExpired ? t('slots.status.expired') : t('slots.status.active'));
  const statusIcon = isCompleted ? <CheckCircle className="w-4 h-4 text-gold mr-1" /> : 
                     (isExpired ? <XCircle className="w-4 h-4 text-red-500 mr-1" /> : 
                      <CheckCircle className="w-4 h-4 text-green-500 mr-1" />);
  const statusColor = isCompleted ? 'text-gold' : (isExpired ? 'text-red-400' : 'text-green-400');
  const profitPercentage = slot.effectiveWeeklyRate * 100;
  
  // Calculate final result (principal + accumulated earnings)
  const finalResult = currentBalance;

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
                {currentBalance.toFixed(2)} MNE
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
                  {realTimeSlotData ? 'Live Earnings:' : 'Accumulated Earnings:'}
                </span>
                {realTimeSlotData && !isLoadingRealTime && (
                  <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <span className={`text-lg font-bold ${realTimeSlotData ? 'text-emerald-400 animate-pulse' : 'text-emerald-300'}`}>
                +{currentEarnings.toFixed(4)} MNE
              </span>
            </div>
            {!realTimeSlotData && (
              <p className="text-xs text-gray-400 mt-1">Updates every 3 seconds</p>
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
                {finalResult.toFixed(4)} MNE
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {isCompleted ? 'Ready to claim!' : 'You will receive this amount at the end of the week'}
            </p>
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
              {isCompleted ? 'COMPLETED' : (isExpired ? '00d 00h 00m 00s' : `${remaining.days}d ${String(remaining.hours).padStart(2, '0')}h ${String(remaining.minutes).padStart(2, '0')}m ${String(remaining.seconds).padStart(2, '0')}s`)}
            </p>
          </div>
        </CardContent>
        
        {/* Claim button for completed slots */}
        {isCompleted && slot.isActive && (
          <CardFooter className="p-3 pt-0">
            <Button
              onClick={handleClaimSlot}
              disabled={isClaiming}
              className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
            >
              {isClaiming ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                  Claiming...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Claim {finalResult.toFixed(4)} MNE
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </div>
    </Card>
  );
};

export default SlotCard;
