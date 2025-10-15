"use client";

import { TrendingUp, Server } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useSlotsData } from '@/hooks/useSlotsData';

interface SimpleStatsProps {
  telegramId: string;
  className?: string;
}

export const SimpleStats = ({ telegramId, className = '' }: SimpleStatsProps) => {
  const { data: userData } = useUserData(telegramId);
  const { data: slotsData } = useSlotsData(telegramId);

  const activeSlots = slotsData?.filter(slot => 
    slot.isActive && new Date(slot.expiresAt) > new Date()
  ) || [];

  return (
    <div className={`minimal-card ${className}`}>
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-2xl font-light text-primary mb-1">
            {((userData?.miningPower ?? 0) * 100).toFixed(1)}%
          </div>
          <div className="text-xs text-muted-foreground">Mining Power</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light text-primary mb-1">
            {activeSlots.length}
          </div>
          <div className="text-xs text-muted-foreground">Active Slots</div>
        </div>
      </div>
    </div>
  );
};
