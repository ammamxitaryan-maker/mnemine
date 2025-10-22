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
  const { data: _userData } = useUserData(telegramId);
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
    <div className={`relative bg-gradient-to-br from-card to-card/80 rounded-xl p-4 border border-border/50 shadow-lg ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl opacity-30" />

      <div className="relative z-10 grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center mb-2">
            <div className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
          </div>
          <div className="text-xl font-light text-primary mb-1 tracking-tight">
            30.0%
          </div>
          <div className="text-xs text-muted-foreground font-semibold">{t('miningPower')}</div>
        </div>
        <div className="text-center p-3 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg border border-secondary/20 hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-center mb-2">
            <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg">
              <Server className="w-4 h-4 text-secondary" />
            </div>
          </div>
          <div className="text-xl font-light text-secondary mb-1 tracking-tight">
            {activeSlots.length}
          </div>
          <div className="text-xs text-muted-foreground font-semibold">{t('activeSlots')}</div>
        </div>
      </div>

      {/* Compact referral income section - Non-clickable */}
      {referralIncomePercentage !== null && referralIncomePercentage > 0 && (
        <div className="relative z-10 mt-3 pt-3 border-t border-border/30">
          <div className="text-center p-3 bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg border border-accent/20 hover:scale-105 transition-transform duration-300">
            <div className="text-xl font-light text-accent mb-1 tracking-tight">
              +{referralIncomePercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground font-semibold mb-1">{t('referralIncome')}</div>
            <div className="text-xs text-muted-foreground">
              {referralStats?.activeReferralsCount || 0} {t('activeReferrals')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
