"use client";

import { useReferralStats } from '@/hooks/useReferralStats';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useUserData } from '@/hooks/useUserData';
import { Server, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SimpleStatsProps {
  telegramId: string;
  className?: string;
}

export const SimpleStats = ({ telegramId, className = '' }: SimpleStatsProps) => {
  const { t } = useTranslation();
  const { data: userData } = useUserData(telegramId);
  const { data: slotsData } = useSlotsData(telegramId);
  const { data: referralStats } = useReferralStats(telegramId);

  const activeSlots = slotsData?.filter(slot =>
    slot.isActive && new Date(slot.expiresAt) > new Date()
  ) || [];

  // Calculate referral income percentage based on active referrals
  const getReferralIncomePercentage = () => {
    if (!referralStats?.activeReferralsCount || referralStats.activeReferralsCount === 0) {
      return null;
    }

    // L1 referrals get 25%, L2 referrals get 15%
    const l1Percentage = (referralStats.referralsByLevel?.l1 || 0) * 25;
    const l2Percentage = (referralStats.referralsByLevel?.l2 || 0) * 15;

    return l1Percentage + l2Percentage;
  };

  const referralIncomePercentage = getReferralIncomePercentage();

  return (
    <div className={`bg-muted/20 rounded-lg p-3 border border-border/30 ${className}`}>
      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-2 bg-background/50 rounded-md border border-border/20">
          <div className="flex items-center justify-center mb-1">
            <div className="p-1 bg-primary/10 rounded">
              <TrendingUp className="w-3 h-3 text-primary" />
            </div>
          </div>
          <div className="text-lg font-light text-primary mb-1 tracking-tight">
            30.0%
          </div>
          <div className="text-xs text-muted-foreground font-medium">{t('miningPower')}</div>
        </div>
        <div className="text-center p-2 bg-background/50 rounded-md border border-border/20">
          <div className="flex items-center justify-center mb-1">
            <div className="p-1 bg-secondary/10 rounded">
              <Server className="w-3 h-3 text-secondary" />
            </div>
          </div>
          <div className="text-lg font-light text-secondary mb-1 tracking-tight">
            {activeSlots.length}
          </div>
          <div className="text-xs text-muted-foreground font-medium">{t('activeSlots')}</div>
        </div>
      </div>

      {/* Enhanced referral income section - Non-clickable */}
      {referralIncomePercentage !== null && referralIncomePercentage > 0 && (
        <div className="mt-3 pt-3 border-t border-border/30">
          <div className="text-center p-2 bg-background/50 rounded-md border border-border/20">
            <div className="text-lg font-light text-accent mb-1 tracking-tight">
              +{referralIncomePercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground font-medium mb-1">{t('referralIncome')}</div>
            <div className="text-xs text-muted-foreground">
              {referralStats?.activeReferralsCount || 0} {t('activeReferrals')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
