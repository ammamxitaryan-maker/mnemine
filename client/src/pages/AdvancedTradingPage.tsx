import React from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/PageHeader';
import { AdvancedTrading } from '@/components/AdvancedTrading';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData } from '@/hooks/useUserData';
import { Loader2 } from 'lucide-react';

const AdvancedTradingPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);

  if (authLoading || userDataLoading || !user || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="advancedTrading.title" backTo="/" />
      <AdvancedTrading userBalance={userData.balance} />
    </div>
  );
};

export default AdvancedTradingPage;