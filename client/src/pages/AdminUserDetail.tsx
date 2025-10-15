import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Loader2, User, Wallet, TrendingUp, History } from 'lucide-react'; // Changed Server to TrendingUp
import { PageHeader } from '@/components/PageHeader';
import { useAdminUserDetail } from '@/hooks/useAdminUserDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActivityCard } from '@/components/common/ActivityCard';
import { StatCard } from '@/components/common/StatCard';

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const { t } = useTranslation();
  const { data: user, isLoading, error } = useAdminUserDetail(userId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center p-4">Failed to load user details.</p>;
  }

  if (!user) {
    return <p className="text-center p-4">User not found.</p>;
  }

  const USDWallet = user.wallets.find(w => w.currency === 'USD');

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
      <PageHeader titleKey="admin.userDetail.title" backTo="/admin" />

      <div className="space-y-6">
        <Card className="bg-gray-900/80 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="text-purple-400" />
                {user.firstName || user.username}
              </div>
              {user.isSuspicious && <Badge variant="destructive">Suspicious</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Username:</strong> @{user.username || 'N/A'}</p>
            <p><strong>Telegram ID:</strong> {user.telegramId}</p>
            <p><strong>Joined:</strong> {format(new Date(user.createdAt), 'MMM d, yyyy')}</p>
            <p><strong>Referred By:</strong> {user.referredBy?.firstName || user.referredBy?.username || 'N/A'}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
            <StatCard 
              icon={Wallet}
              label="Balance (USD)"
              value={USDWallet?.balance.toFixed(4) ?? '0.0000'}
              isLoading={isLoading}
              colorClass="text-gold"
            />
            <StatCard 
              icon={TrendingUp}
              label="Total Invested"
              value={user.totalInvested.toFixed(4)}
              isLoading={isLoading}
              colorClass="text-cyan"
            />
        </div>

        <Card className="bg-gray-900/80 border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="text-purple-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {user.activityLogs.length > 0 ? (
              user.activityLogs.map(activity => <ActivityCard key={activity.id} activity={activity} />)
            ) : (
              <p className="text-center text-gray-500 py-4">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
