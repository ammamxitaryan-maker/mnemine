import { Link } from 'react-router-dom';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTranslation } from 'react-i18next';
import { useStatsData } from '@/hooks/useStatsData';
import { Loader2, Shield, Award, Gift, BarChart3, Settings, User as UserIcon } from 'lucide-react';
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

  const displayName = user?.firstName || user?.username || "User";

  return (
    <div className="flex flex-col min-h-screen text-white p-4">
      <div className="w-full max-w-md mx-auto z-10">
        <PageHeader titleKey="profile.title" backTo="/" />
        
        <main className="flex flex-col items-center gap-6 w-full">
          {statsLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : statsData ? (
            <>
              <Card className="w-full bg-gray-900/80 backdrop-blur-sm border border-gray-700">
                <CardContent className="p-4 flex flex-col items-center">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Profile" className="w-24 h-24 rounded-full border-2 border-primary" />
                  ) : (
                    <div className="w-24 h-24 rounded-full border-2 border-primary bg-gray-700 flex items-center justify-center">
                      <UserIcon className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                  <h2 className="text-xl font-bold mt-2">{displayName}</h2>
                  {user?.username && <p className="text-sm text-gray-400">@{user.username}</p>}
                </CardContent>
              </Card>

              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="w-full">
                  <Button variant="outline" className="w-full border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive/80">
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                </Link>
              )}

              <Card className="w-full bg-gray-900/80 backdrop-blur-sm border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-300">{t('accountStatus.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <AccountStatusCard isEligible={statsData.isEligible} isSuspicious={statsData.isSuspicious} />
                </CardContent>
              </Card>

              <RankCard stats={statsData} />

              <div className="w-full space-y-3">
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