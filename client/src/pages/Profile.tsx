import { Link } from 'react-router-dom';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTranslation } from 'react-i18next';
import { useStatsData } from '@/hooks/useStatsData';
import { Loader2, Award, Gift, BarChart3, Settings, User as UserIcon } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { RankCard } from '@/components/RankCard';
import { AccountStatusCard } from '@/components/AccountStatusCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProfileLinkCard } from '@/components/ProfileLinkCard'; // Import the new component

const Profile = () => {
  const { user } = useTelegramAuth();
  const { t } = useTranslation();
  const { data: statsData, isLoading: statsLoading, error } = useStatsData(user?.telegramId);

  if (error) {
    console.error(`[Profile] Error fetching stats for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load profile data.</p>;
  }

  const displayName = user?.firstName || user?.username || t('profile.user');

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="profile.title" backTo="/" />
        
        <main className="flex flex-col items-center gap-3 w-full">
          {statsLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : statsData ? (
            <>
              <Card className="w-full bg-gray-900/80 border-primary">
                <CardContent className="p-3 flex flex-col items-center">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={t('profile.avatar')} className="w-20 h-20 rounded-full border-2 border-primary" />
                  ) : (
                    <div className="w-20 h-20 rounded-full border-2 border-primary bg-gray-700 flex items-center justify-center">
                      <UserIcon className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <h2 className="text-lg font-bold mt-2">{displayName}</h2>
                  {user?.username && <p className="text-xs text-gray-400">@{user.username}</p>}
                </CardContent>
              </Card>


              <Card className="w-full bg-gray-900/80 border-primary">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-gray-300">{t('accountStatus.title')}</CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <AccountStatusCard isEligible={statsData.isEligible} isSuspicious={statsData.isSuspicious} />
                </CardContent>
              </Card>

              <RankCard stats={statsData} />

              <div className="w-full grid grid-cols-1 gap-2">
                <ProfileLinkCard to="/stats" icon={BarChart3} title={t('stats.title')} />
                <ProfileLinkCard to="/achievements" icon={Award} title={t('achievements.title')} />
                <ProfileLinkCard to="/bonuses" icon={Gift} title={t('bonuses.title')} />
                <ProfileLinkCard to="/settings" icon={Settings} title={t('settings.title')} />
              </div>
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default Profile;