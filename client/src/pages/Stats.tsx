import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTranslation } from 'react-i18next';
import { useStatsData } from '@/hooks/useStatsData';
import { StatCard } from '@/components/common/StatCard';
import { Loader2, Users, DollarSign, TrendingUp, Zap, Server, CheckSquare } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Stats = () => {
  const { user } = useTelegramAuth();
  const { t } = useTranslation();
  const { data: statsData, isLoading: statsLoading, error } = useStatsData(user?.telegramId);

  const statItems = [
    { key: 'totalEarnings', label: t('totalEarnings'), icon: DollarSign, unit: 'USD', colorClass: 'text-emerald' },
    { key: 'totalInvested', label: t('totalInvested'), icon: TrendingUp, unit: 'USD', colorClass: 'text-cyan' },
    { key: 'referralCount', label: t('referralCount'), icon: Users, colorClass: 'text-secondary' },
    { key: 'activeReferralCount', label: t('activeReferrals'), icon: Users, colorClass: 'text-secondary' },
    { key: 'slotsOwned', label: t('slotsOwned'), icon: Server, colorClass: 'text-gold' },
    { key: 'tasksCompleted', label: t('tasksCompleted'), icon: CheckSquare, colorClass: 'text-accent' },
    { key: 'boostersPurchased', label: t('boostersPurchased'), icon: Zap, colorClass: 'text-accent' },
  ];

  if (error) {
    console.error(`[Stats] Error fetching stats for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load statistics.</p>;
  }

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
      <PageHeader titleKey="stats.title" backTo="/profile" />
      
      {statsLoading ? (
        <div className="flex justify-center pt-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : statsData ? (
        <Card className="w-full bg-gray-900/80 border-primary">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-300">{t('statistics')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-3">
              {statItems.map(item => (
                <StatCard
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  value={statsData ? (statsData as any)[item.key] : null}
                  isLoading={statsLoading}
                  unit={item.unit}
                  colorClass={item.colorClass}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-gray-500">No statistics available.</p>
      )}
      </div>
    </div>
  );
};

export default Stats;
