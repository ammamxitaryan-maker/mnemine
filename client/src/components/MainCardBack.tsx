"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
import { MiningSlot } from '@/hooks/useSlotsData'; // Use the unified MiningSlot interface
import { Loader2, Server } from 'lucide-react';
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
    return <span className="text-red-400">Expired</span>;
  }
  return (
    <span className="font-mono text-accent">
      {days}d {String(hours).padStart(2, '0')}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
    </span>
  );
};

export const MainCardBack = ({ slots, isLoading }: MainCardBackProps) => {
  // BUG FIX: Removed unused user parameter to fix TypeScript warning
  const { t } = useTranslation();
  const activeSlots = slots?.filter(s => s.isActive && new Date(s.expiresAt) > new Date());

  return (
    <Card className="w-full h-full bg-gray-900/80 backdrop-blur-sm border-purple-500 flex flex-col shimmer-effect">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-lg">{t('mainCardBack.activeMiningSlots')}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow px-2 py-1 overflow-y-auto custom-scrollbar">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : activeSlots && activeSlots.length > 0 ? (
          <div className="space-y-2">
            {activeSlots.map(slot => (
              <div key={slot.id} className="text-xs text-left p-2 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{slot.principal.toFixed(2)} CFM</span>
                  <span className="text-emerald">{(slot.effectiveWeeklyRate * 100).toFixed(2)}% / {t('slots.termInfo').split(':')[0].trim()}</span>
                </div>
                <div className="text-gray-400 mt-1 flex items-center justify-between">
                  <span>{t('slots.expires')}:</span>
                  <SlotCountdown expiresAt={slot.expiresAt} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 pt-4">
            <Server className="w-10 h-10 mx-auto mb-2 text-gray-600" />
            <p className="text-lg font-semibold">{t('mainCardBack.noActiveSlots')}</p>
            <p className="text-sm text-gray-400 mt-1">{t('mainCardBack.goToSlotsPage')}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="p-2 mt-auto">
        <Link to="/slots" className="w-full" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
            {t('mainCardBack.manageSlots')}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};