import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Users, DollarSign, TrendingUp, AlertTriangle, UserX, Gift, Ticket, ArrowLeftRight } from 'lucide-react';

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

interface User {
  id: string;
  telegramId: string;
  firstName: string | null;
  username: string | null;
  totalInvested: number;
  hasMadeDeposit: boolean;
  activityScore: number;
  lastActivityAt: Date | null;
  isFrozen: boolean;
}

const AdminDashboardNew = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // FIX: Add exchange rate management
  const [currentRate, setCurrentRate] = useState<number>(1.0);
  const [newRate, setNewRate] = useState<string>('');
  const [settingRate, setSettingRate] = useState(false);

  useEffect(() => {
    fetchDashboardData();
    fetchCurrentRate();
  }, []);

  const fetchCurrentRate = async () => {
    try {
      const response = await api.get('/exchange/rate');
      setCurrentRate(response.data.rate);
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
    }
  };

  const handleSetExchangeRate = async () => {
    const rateValue = parseFloat(newRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      alert(t('admin.exchangeRate.invalidRate'));
      return;
    }

    if (!window.confirm(t('admin.exchangeRate.confirmSet', { rate: rateValue.toFixed(4) }))) return;

    try {
      setSettingRate(true);
      await api.post('/exchange/set-rate', { rate: rateValue });
      alert(t('admin.exchangeRate.success', { rate: rateValue.toFixed(4) }));
      setNewRate('');
      fetchCurrentRate();
    } catch (err: any) {
      alert(t('admin.exchangeRate.error', { error: err.response?.data?.error || t('admin.error') }));
    } finally {
      setSettingRate(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard stats
      const statsResponse = await api.get('/admin/dashboard-stats');
      setStats(statsResponse.data.data);

      // Fetch active and inactive users
      const [activeResponse, inactiveResponse] = await Promise.all([
        api.get('/admin/active-users'),
        api.get('/admin/inactive-users')
      ]);

      setActiveUsers(activeResponse.data.data.users || []);
      setInactiveUsers(inactiveResponse.data.data.users || []);
    } catch (err: any) {
      console.error('Error fetching admin data:', err);
      setError(err.response?.data?.error || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleFreezeAccount = async (userId: string) => {
    if (!window.confirm(t('admin.userManagement.confirmFreeze'))) return;

    try {
      await api.post('/admin/freeze-accounts', {
        userIds: [userId],
        reason: 'INACTIVITY',
        adminId: 'ADMIN'
      });
      
      alert(t('admin.userManagement.freezeSuccess'));
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || t('admin.error'));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmation = window.prompt(t('admin.userManagement.confirmDelete'));
    
    if (confirmation !== 'DELETE') return;

    try {
      await api.delete(`/admin/delete-user/${userId}`, {
        data: {
          adminId: 'ADMIN',
          reason: 'Admin deletion'
        }
      });
      
      alert(t('admin.userManagement.deleteSuccess'));
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || t('admin.error'));
    }
  };

  const handleProcessPayouts = async () => {
    if (!window.confirm(t('admin.payouts.confirmProcess'))) return;

    try {
      const response = await api.post('/admin/process-today-payouts');
      alert(response.data.message);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || t('admin.error'));
    }
  };

  if (loading && !stats) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <PageHeader titleKey="admin.title" backTo="/profile" />
        <div className="text-center text-red-500 p-6">
          <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
          <p className="text-sm">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-3 text-sm">
            {t('admin.retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-6xl mx-auto">
        <PageHeader titleKey="admin.title" backTo="/profile" />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {stats?.users.total || 0}
              </div>
              <p className="text-xs text-green-400">
                +{stats?.users.newThisWeek || 0} this week
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Active Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {stats?.users.active || 0}
              </div>
              <p className="text-xs text-gray-400">
                {stats?.users.frozen || 0} frozen
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Total Invested
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold">
                {(stats?.finances.totalInvested || 0).toFixed(2)} USD
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-400 flex items-center">
                <Gift className="h-4 w-4 mr-2" />
                Today's Payouts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {(stats?.today.payouts?.amount || 0).toFixed(2)} USD
              </div>
              <p className="text-xs text-gray-400">
                {stats?.today.payouts?.users || 0} users
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
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
            onClick={handleProcessPayouts}
            className="bg-green-600 hover:bg-green-700"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Process Payouts
          </Button>
          <Button
            onClick={fetchDashboardData}
            variant="outline"
            className="border-gray-600"
          >
            Refresh Data
          </Button>
        </div>

        {/* Tabs for different views */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="overview">Active Users</TabsTrigger>
            <TabsTrigger value="inactive">Inactive Users</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Active Users ({activeUsers.length})</CardTitle>
                <CardDescription>Users active in the last 7 days</CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {activeUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No active users</p>
                ) : (
                  <div className="space-y-2">
                    {activeUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex justify-between items-center p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer"
                        onClick={() => navigate(`/admin/user/${user.id}`)}
                      >
                        <div>
                          <div className="font-medium text-white">
                            {user.firstName || user.username || `User ${user.telegramId}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            Activity Score: {user.activityScore.toFixed(1)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gold font-mono">
                            {user.totalInvested.toFixed(2)} USD
                          </div>
                          <div className="text-xs text-gray-400">
                            {user.hasMadeDeposit ? '✓ Deposited' : '○ No deposit'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactive" className="space-y-4">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Inactive Users ({inactiveUsers.length})</CardTitle>
                <CardDescription>Users inactive for 10+ days</CardDescription>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                {inactiveUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">No inactive users</p>
                ) : (
                  <div className="space-y-2">
                    {inactiveUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex justify-between items-center p-3 bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-white">
                            {user.firstName || user.username || `User ${user.telegramId}`}
                          </div>
                          <div className="text-sm text-gray-400">
                            Last active: {user.lastActivityAt 
                              ? new Date(user.lastActivityAt).toLocaleDateString()
                              : 'Never'}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {!user.isFrozen && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-yellow-600 text-yellow-500"
                              onClick={() => handleFreezeAccount(user.id)}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-500"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            {/* Exchange Rate Management */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ArrowLeftRight className="h-5 w-5 mr-2 text-blue-400" />
                  USD ⇄ MNE Exchange Rate Management
                </CardTitle>
                <CardDescription>Set the base exchange rate for USD to MNE conversion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-800 p-4 rounded-lg">
                  <div className="text-sm text-gray-400 mb-1">Current Exchange Rate</div>
                  <div className="text-3xl font-bold text-gold">
                    1 USD = {currentRate.toFixed(4)} MNE
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    * Actual rate varies by ±5% per transaction
                  </div>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="newRate" className="text-white">
                    Set New Base Rate
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="newRate"
                      type="number"
                      step="0.0001"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="e.g. 0.95"
                      className="bg-gray-800 border-gray-600 text-white"
                      disabled={settingRate}
                    />
                    <Button
                      onClick={handleSetExchangeRate}
                      disabled={settingRate || !newRate}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {settingRate ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Set Rate'
                      )}
                    </Button>
                  </div>
                  <div className="text-xs text-gray-400">
                    Recommended range: 0.8 - 1.2
                    <br />
                    Current: {currentRate.toFixed(4)}
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-700 p-3 rounded text-sm text-blue-300">
                  <strong>Note:</strong> The exchange rate affects all USD ⇄ MNE swaps.
                  Each swap gets a rate variation of 0-5% added to the base rate.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardNew;


