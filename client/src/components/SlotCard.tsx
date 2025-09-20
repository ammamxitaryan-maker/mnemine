"use client";

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { DollarSign, Calendar, CheckCircle, XCircle, TrendingUp, ChevronsUp, Clock, Loader2 } from 'lucide-react';
import { MiningSlot } from '@/hooks/useSlotsData';
import { formatExpirationDate, getRemainingTime } from '@/utils/date';
import ProgressBar from './ProgressBar';
import { Button } from './ui/button';
import { useSlotActions } from '@/hooks/useSlotActions';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { SLOT_EXTENSION_COST } from 'shared';

interface SlotCardProps {
  slot: MiningSlot;
  onUpgradeClick: (slot: MiningSlot) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, onUpgradeClick }) => {
  const { t } = useTranslation();
  const [remaining, setRemaining] = useState(getRemainingTime(slot.expiresAt));
  const { user } = useTelegramAuth();
  const { extend, isExtending } = useSlotActions();

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(getRemainingTime(slot.expiresAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [slot.expiresAt]);

  const handleExtend = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      extend({ telegramId: user.telegramId, slotId: slot.id });
    }
  };

  const isExpired = remaining.totalSeconds <= 0;
  const statusText = isExpired ? t('slots.status.expired') : t('slots.status.active');
  const statusIcon = isExpired ? <XCircle className="w-4 h-4 text-red-500 mr-1" /> : <CheckCircle className="w-4 h-4 text-green-500 mr-1" />;
  const statusColor = isExpired ? 'text-red-400' : 'text-green-400';
  const profitPercentage = slot.effectiveWeeklyRate * 100;
  const totalDurationSeconds = (new Date(slot.expiresAt).getTime() - new Date(slot.createdAt).getTime()) / 1000;
  const elapsedSeconds = totalDurationSeconds - remaining.totalSeconds;
  const progress = totalDurationSeconds > 0 ? (elapsedSeconds / totalDurationSeconds) * 100 : 0;

  return (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-primary text-white flex flex-col">
      <div className="p-4 flex-grow">
        <CardHeader className="p-0 pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-bold flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-primary" />
            {t('slots.investment')}
          </CardTitle>
          <div className={`flex items-center text-sm font-medium ${statusColor}`}>
            {statusIcon}
            {statusText}
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-2">
          <p className="text-2xl font-extrabold text-gold">{slot.principal.toFixed(4)} CFM</p>
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
      {!isExpired && (
        <CardFooter className="p-2 bg-black/20 grid grid-cols-2 gap-2">
          <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10" onClick={() => onUpgradeClick(slot)}>
            <ChevronsUp className="w-4 h-4 mr-2" />
            {t('slots.upgradeButton')}
          </Button>
          <Button variant="outline" className="border-accent text-accent hover:bg-accent/10" onClick={handleExtend} disabled={isExtending}>
            {isExtending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Clock className="w-4 h-4 mr-2" /> {t('slots.extendButton', { amount: SLOT_EXTENSION_COST.toFixed(2) })}</>}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default SlotCard;