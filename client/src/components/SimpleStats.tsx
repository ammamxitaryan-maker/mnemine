"use client";

import { useTranslation } from 'react-i18next';
import { TrendingUp, Server } from 'lucide-react';
import { useUserData } from '@/hooks/useUserData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useReferralStats } from '@/hooks/useReferralStats';

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
    <div className={`minimal-card ${className}`}>
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <div className="text-2xl font-light text-primary mb-1">
            30.0%
          </div>
          <div className="text-xs text-muted-foreground">{t('miningPower')}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-light text-primary mb-1">
            {activeSlots.length}
          </div>
          <div className="text-xs text-muted-foreground">{t('activeSlots')}</div>
        </div>
      </div>
      
      {/* Show referral income percentage when user has referrals */}
      {referralIncomePercentage !== null && referralIncomePercentage > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="text-center">
            <div className="text-2xl font-light text-accent mb-1">
              +{referralIncomePercentage.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">{t('referralIncome')}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {referralStats?.activeReferralsCount || 0} {t('activeReferrals')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
