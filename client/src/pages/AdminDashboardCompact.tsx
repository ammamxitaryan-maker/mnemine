import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import { showError, showSuccess } from '@/utils/toast';
import { ArrowLeftRight, DollarSign, Gift, Loader2, Trash2, TrendingUp, Users, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  users: { total: number; active: number; frozen: number; newThisWeek: number; };
  finances: { totalInvested: number; totalEarnings: number; };
  today: { payouts: { amount: number; users: number; status: string; } | null; };
  activity: { weeklyLogs: number; };
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

const AdminDashboardCompact = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [inactiveUsers, setInactiveUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRate, setCurrentRate] = useState<number>(1.0);
  const [newRate, setNewRate] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, activeRes, inactiveRes, rateRes] = await Promise.all([
        api.get('/admin/dashboard-stats'),
        api.get('/admin/active-users'),
        api.get('/admin/inactive-users'),
        api.get('/exchange/rate')
      ]);
      setStats(statsRes.data.data);
      setActiveUsers(activeRes.data.data.users || []);
      setInactiveUsers(inactiveRes.data.data.users || []);
      setCurrentRate(rateRes.data.rate);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || t('admin.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSetRate = async () => {
    const rate = parseFloat(newRate);
    if (!rate || rate <= 0) return showError(t('admin.exchangeRate.invalidRate'));
    if (!window.confirm(t('admin.exchangeRate.confirmSet', { rate: rate.toFixed(4) }))) return;

    try {
      await api.post('/exchange/set-rate', { rate });
      showSuccess(t('admin.exchangeRate.success', { rate: rate.toFixed(4) }));
      setNewRate('');
      setCurrentRate(rate);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(t('admin.exchangeRate.error', { error: error.response?.data?.error || '' }));
    }
  };

  const handleFreeze = async (userId: string) => {
    if (!window.confirm(t('admin.userManagement.confirmFreeze'))) return;
    try {
      await api.post('/admin/freeze-accounts', { userIds: [userId], reason: 'INACTIVITY', adminId: 'ADMIN' });
      showSuccess(t('admin.userManagement.freezeSuccess'));
      fetchData();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || t('admin.error'));
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.prompt(t('admin.userManagement.confirmDelete')) !== 'DELETE') return;
    try {
      const response = await api.delete(`/admin/delete-user/${userId}`, { data: { adminId: 'ADMIN' } });

      if (response.data.success) {
        showSuccess(t('admin.userManagement.deleteSuccess'));
        await fetchData(); // Обновляем данные только после успешного удаления
      } else {
        showError(response.data.error || t('admin.error'));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || t('admin.error'));
    }
  };

  const handleDeleteAllUsers = async () => {
    const confirmText = 'DELETE ALL USERS';
    const userInput = prompt(
      `⚠️ CRITICAL ACTION ⚠️\n\n` +
      `This will permanently delete ALL users and their data.\n` +
      `This action CANNOT be undone!\n\n` +
      `Type "${confirmText}" to confirm:`
    );

    if (userInput !== confirmText) {
      showError('Action cancelled. You must type the exact confirmation text.');
      return;
    }

    const reason = prompt('Enter reason for deleting all users:');
    if (!reason) {
      showError('Reason is required for this action.');
      return;
    }

    try {
      const response = await api.delete('/admin/delete-all-users', {
        data: { reason: reason }
      });

      if (response.data.success) {
        showSuccess('All users have been successfully deleted.');
        await fetchData(); // Обновляем данные только после успешного удаления
      } else {
        showError(response.data.error || t('admin.error'));
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showError(error.response?.data?.error || t('admin.error'));
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="page-container text-white">
      <div className="page-content max-w-6xl mx-auto px-3">
        <PageHeader titleKey="admin.title" backTo="/admin" />

        {/* Compact Stats - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Card className="bg-gray-900 border-gray-700 p-2">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-400" />
              <div>
                <div className="text-xs text-gray-400">{t('admin.totalUsers')}</div>
                <div className="text-lg font-bold">{stats?.users.total || 0}</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-400" />
              <div>
                <div className="text-xs text-gray-400">{t('admin.activeUsers')}</div>
                <div className="text-lg font-bold text-green-400">{stats?.users.active || 0}</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-gold" />
              <div>
                <div className="text-xs text-gray-400">{t('admin.totalInvested')}</div>
                <div className="text-base font-bold text-gold">{(stats?.finances.totalInvested || 0).toFixed(0)}</div>
              </div>
            </div>
          </Card>

          <Card className="bg-gray-900 border-gray-700 p-2">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-purple-400" />
              <div>
                <div className="text-xs text-gray-400">{t('admin.todayPayouts')}</div>
                <div className="text-base font-bold text-purple-400">{(stats?.today.payouts?.amount || 0).toFixed(0)}</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Compact Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button onClick={() => navigate('/admin/lottery')} size="sm" className="bg-purple-600 h-9 text-xs">
            {t('admin.lottery.title')}
          </Button>
          <Button onClick={() => navigate('/admin/staff')} size="sm" className="bg-blue-600 h-9 text-xs">
            {t('admin.staff')}
          </Button>
          <Button onClick={fetchData} size="sm" variant="outline" className="border-gray-600 h-9 text-xs">
            {t('admin.refreshData')}
          </Button>
        </div>

        {/* Compact Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-gray-800 h-9">
            <TabsTrigger value="overview" className="text-xs">{t('admin.userManagement.activeUsers')}</TabsTrigger>
            <TabsTrigger value="inactive" className="text-xs">{t('admin.userManagement.inactiveUsers')}</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs">{t('admin.settings')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm">{t('admin.userManagement.activeUsers')} ({activeUsers.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-2 max-h-80 overflow-y-auto">
                {activeUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-4 text-sm">{t('admin.userManagement.noActiveUsers')}</p>
                ) : (
                  <div className="space-y-1">
                    {activeUsers.map((user) => (
                      <div key={user.id} className="flex justify-between items-center p-2 bg-gray-800 rounded text-sm hover:bg-gray-750 cursor-pointer" onClick={() => navigate(`/admin/user/${user.id}`)}>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {user.firstName || user.username || user.telegramId}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t('admin.userManagement.activityScore', { score: user.activityScore.toFixed(1) })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-gold font-mono text-sm">{user.totalInvested.toFixed(0)}</div>
                          <div className="text-xs text-gray-500">{user.hasMadeDeposit ? t('admin.userManagement.deposited') : t('admin.userManagement.noDeposit')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inactive" className="mt-3">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="py-2 px-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm">{t('admin.userManagement.inactiveUsers')} ({inactiveUsers.length})</CardTitle>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={handleDeleteAllUsers}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-2 max-h-80 overflow-y-auto">
                {inactiveUsers.length === 0 ? (
                  <p className="text-center text-gray-400 py-4 text-sm">{t('admin.userManagement.noInactiveUsers')}</p>
                ) : (
                  <div className="space-y-1">
                    {inactiveUsers.map((user) => (
                      <div key={user.id} className="flex justify-between items-center p-2 bg-gray-800 rounded text-sm">
                        <div className="flex-1">
                          <div className="font-medium text-white text-xs">{user.firstName || user.username || user.telegramId}</div>
                          <div className="text-xs text-gray-500">{t('admin.userManagement.lastActive', { date: user.lastActivityAt ? new Date(user.lastActivityAt).toLocaleDateString() : 'Never' })}</div>
                        </div>
                        <div className="flex gap-1">
                          {!user.isFrozen && (
                            <Button size="sm" variant="outline" className="h-7 text-xs border-yellow-600" onClick={() => handleFreeze(user.id)}>
                              <UserX className="h-3 w-3" />
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="h-7 text-xs border-red-600" onClick={() => handleDelete(user.id)}>
                            {t('admin.userManagement.delete')}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="mt-3">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader className="py-2 px-3">
                <CardTitle className="text-sm flex items-center">
                  <ArrowLeftRight className="h-4 w-4 mr-2 text-blue-400" />
                  {t('admin.exchangeRate.title')}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-3">
                <div className="bg-gray-800 p-2 rounded">
                  <div className="text-xs text-gray-400">{t('admin.exchangeRate.current')}</div>
                  <div className="text-lg font-bold text-gold">1 USD = {currentRate.toFixed(4)} NON</div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white text-xs">{t('admin.exchangeRate.setNew')}</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.0001"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="0.95"
                      className="bg-gray-800 border-gray-600 text-white h-9 text-sm"
                    />
                    <Button onClick={handleSetRate} disabled={!newRate} className="bg-blue-600 h-9 text-xs">
                      {t('admin.exchangeRate.setRate')}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">{t('admin.exchangeRate.recommended')}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboardCompact;


