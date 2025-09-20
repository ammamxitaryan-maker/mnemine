import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { AdvancedAnalytics } from '@/components/AdvancedAnalytics';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData } from '@/hooks/useUserData';
import { useReferralData } from '@/hooks/useReferralData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { Loader2 } from 'lucide-react';

const AnalyticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);
  const { data: referralData, isLoading: referralDataLoading } = useReferralData(user?.telegramId);
  const { data: slotsData, isLoading: slotsLoading } = useSlotsData(user?.telegramId);

  const isLoading = authLoading || userDataLoading || referralDataLoading || slotsLoading;

  if (isLoading || !user || !userData || !referralData || !slotsData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  const activeSlotsCount = slotsData.filter(slot => slot.isActive).length;

  return (
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="analytics.title" backTo="/" />
      <AdvancedAnalytics
        userData={{
          balance: userData.balance,
          totalInvested: userData.totalInvested,
          totalEarnings: userData.accruedEarnings,
          activeSlots: activeSlotsCount,
          referrals: referralData.referralCount,
        }}
      />
    </div>
  );
};

export default AnalyticsPage;