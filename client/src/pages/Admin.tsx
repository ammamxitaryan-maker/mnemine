import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminUsers } from '@/hooks/useAdminData';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { api } from '@/lib/api';
import { AdminUser } from '@/types/admin';
import { DollarSign, Loader2, Settings, Ticket, TrendingUp, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    frozen: number;
    newThisWeek: number;
  };
  finances: {
    totalInvested: number;
    totalEarnings: number;
  };
  today: {
    payouts: {
      amount: number;
      users: number;
      status: string;
    } | null;
  };
  activity: {
    weeklyLogs: number;
  };
}

const Admin = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { data: adminData, isLoading: usersLoading, error: usersError } = useAdminUsers();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Admin access check - allow users with Telegram IDs in admin list
  const ADMIN_TELEGRAM_IDS = ['6760298907'];

  // Check if user is admin (moved before conditional returns)
  const isAdmin = user ? ADMIN_TELEGRAM_IDS.includes(user.telegramId) : false;

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await api.get('/admin/dashboard-stats');
      setStats(response.data.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Check if user exists
  if (!user) {
    console.log('[ADMIN] No user data, redirecting to main app');
    return <Navigate to="/" replace />;
  }

  // If user is NOT admin, redirect to main app
  if (!isAdmin) {
    console.log('[ADMIN] Access denied for user:', user.telegramId, '- not admin');
    return <Navigate to="/" replace />;
  }

  // Only admin users can see this component
  console.log('[ADMIN] Admin access granted for user:', user.telegramId);

  const users = adminData?.data || [];
  const onlineCount = 0; // This would need to be fetched separately

  const isLoading = usersLoading || statsLoading;

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-6xl mx-auto">
        <PageHeader titleKey="admin.title" backTo="/profile" />

        {/* Stats Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Users className="h-4 w-4 mr-2 text-blue-400" />
                  <span className="text-gray-400">Total Users</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {stats.users.total}
                </div>
                <p className="text-xs text-green-400">
                  +{stats.users.newThisWeek} this week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2 text-green-400" />
                  <span className="text-gray-400">Active</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">
                  {stats.users.active}
                </div>
                <p className="text-xs text-red-400">
                  {stats.users.frozen} frozen
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-gold" />
                  <span className="text-gray-400">Invested</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-gold">
                  {stats.finances.totalInvested.toFixed(2)}
                </div>
                <p className="text-xs text-gray-400">USD</p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center">
                  <Users className="h-4 w-4 mr-2 text-purple-400" />
                  <span className="text-gray-400">Online</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-400">
                  {onlineCount}
                </div>
                <p className="text-xs text-gray-400">now</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
          <Button
            onClick={() => navigate('/admin/lottery')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Ticket className="h-4 w-4 mr-2" />
            Lottery
          </Button>
          <Button
            onClick={() => navigate('/admin/staff')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Users className="h-4 w-4 mr-2" />
            Staff
          </Button>
          <Button
            onClick={() => navigate('/admin/dashboard')}
            className="bg-green-600 hover:bg-green-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            Full Dashboard
          </Button>
        </div>

        {/* Users List */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Users ({users.length})</span>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>Click on a user to view details</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
                <p className="text-gray-400">Loading users...</p>
              </div>
            ) : usersError ? (
              <div className="text-center text-red-500 py-8">
                <p>Error loading users</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <p>No users found</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-2">
                {users.map((user: AdminUser) => (
                  <div
                    key={user.id}
                    className="p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer flex justify-between items-center transition-colors"
                    onClick={() => navigate(`/admin/user/${user.id}`)}
                  >
                    <div>
                      <div className="text-white font-medium flex items-center">
                        {user.firstName || user.username || `User ${user.telegramId}`}
                        {user.isOnline && <span className="ml-2 text-green-400 text-xl">●</span>}
                      </div>
                      <div className="text-sm text-gray-400">
                        {new Date(user.createdAt).toLocaleDateString()} • {user._count.referrals} refs
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-gold font-mono font-bold">
                        {user.wallets.find(w => w.currency === 'USD')?.balance.toFixed(2) ?? '0.00'}
                      </div>
                      <div className="text-xs text-gray-400">USD</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
