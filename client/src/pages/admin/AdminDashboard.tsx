"use client";

import { LoadingSpinner } from '@/components/admin/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  DollarSign,
  RefreshCw,
  Ticket,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  users: {
    total: number;
    active: number;
    frozen: number;
    newThisWeek: number;
    online: number;
  };
  finances: {
    totalInvested: number;
    totalEarnings: number;
    todayPayouts: number;
    pendingWithdrawals: number;
  };
  system: {
    uptime: string;
    lastBackup: string;
    alerts: number;
  };
  activity: {
    weeklyLogs: number;
    dailyActiveUsers: number;
    transactionsToday: number;
  };
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResetDatabase = () => {
    setShowResetDialog(true);
  };

  const confirmResetDatabase = async () => {
    setIsResetting(true);
    setShowResetDialog(false);

    try {
      const response = await api.post('/admin/reset-database');

      if (response.data.success) {
        alert('✅ База данных успешно сброшена!\n\nВсе данные клиентов удалены. Админ-пользователь пересоздан.');
        // Обновляем статистику
        await fetchDashboardData();
      } else {
        throw new Error(response.data.error || 'Ошибка сброса базы данных');
      }
    } catch (error: any) {
      console.error('Ошибка сброса базы данных:', error);
      alert(`❌ Ошибка сброса базы данных: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsResetting(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard-stats');
      const data = response.data.data;

      // Ensure system data exists with defaults
      if (data && !data.system) {
        data.system = {
          uptime: '24/7',
          lastBackup: new Date().toISOString(),
          alerts: 0
        };
      }

      setStats(data);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchDashboardData} variant="outline" size="mobile" className="min-h-[44px] touch-manipulation">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Professional Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 border-b border-blue-800/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-sm text-blue-200 mt-1">
                System administration and monitoring panel
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-slate-300">System Status</div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 font-medium">Online</span>
                </div>
              </div>
              <div className="h-8 w-px bg-blue-700"></div>
              <div className="text-right">
                <div className="text-sm text-slate-300">Uptime</div>
                <div className="text-blue-400 font-medium">{stats?.system?.uptime || '24/7'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Toolbar */}
      <div className="bg-slate-900/50 border-b border-slate-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="flex items-center space-x-2">
            <Button
              onClick={fetchDashboardData}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Action Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <Button
            onClick={() => navigate('/admin/users')}
            className="h-20 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center space-y-2"
          >
            <Users className="h-6 w-6" />
            <span className="text-sm font-medium">Users</span>
          </Button>
          <Button
            onClick={() => navigate('/admin/transactions')}
            className="h-20 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center space-y-2"
          >
            <DollarSign className="h-6 w-6" />
            <span className="text-sm font-medium">Transactions</span>
          </Button>
          <Button
            onClick={() => navigate('/admin/lottery')}
            className="h-20 bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center space-y-2"
          >
            <Ticket className="h-6 w-6" />
            <span className="text-sm font-medium">Lottery</span>
          </Button>
          <Button
            onClick={() => navigate('/admin/analytics')}
            className="h-20 bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center justify-center space-y-2"
          >
            <BarChart3 className="h-6 w-6" />
            <span className="text-sm font-medium">Analytics</span>
          </Button>
          <Button
            onClick={handleResetDatabase}
            disabled={isResetting}
            className="h-20 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 flex flex-col items-center justify-center space-y-2"
          >
            <Database className="h-6 w-6" />
            <span className="text-sm font-medium">
              {isResetting ? 'Resetting...' : 'Reset DB'}
            </span>
          </Button>
        </div>
      </div>

      {/* Professional Stats Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Users Stats */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">Users</span>
              </div>
              <div className="text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">Total</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-white">{stats?.users.total || 0}</div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">{stats?.users.active || 0} Active</span>
                <span className="text-red-400">{stats?.users.frozen || 0} Frozen</span>
              </div>
              <div className="text-xs text-blue-400 bg-blue-900/20 px-2 py-1 rounded">
                +{stats?.users.newThisWeek || 0} this week
              </div>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">Finances</span>
              </div>
              <div className="text-xs text-slate-400">USD</div>
            </div>
            <div className="space-y-2">
              <div className="text-xl font-bold text-green-400">
                ${(stats?.finances.totalInvested || 0).toFixed(0)}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">
                  ${(stats?.finances.totalEarnings || 0).toFixed(0)} Earned
                </span>
                <span className="text-blue-400">
                  ${(stats?.finances.todayPayouts || 0).toFixed(0)} Today
                </span>
              </div>
            </div>
          </div>

          {/* Activity Stats */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-600/20 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-purple-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">Activity</span>
              </div>
              <div className="text-xs text-slate-400">DAU</div>
            </div>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-400">
                {stats?.activity.dailyActiveUsers || 0}
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-400">
                  {stats?.activity.transactionsToday || 0} Transactions
                </span>
                <span className="text-green-400">
                  {stats?.activity.weeklyLogs || 0} Logs
                </span>
              </div>
            </div>
          </div>

          {/* System Stats */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </div>
                <span className="text-sm font-medium text-slate-300">System</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400">Online</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-slate-300">
                Uptime: {stats?.system?.uptime || '24/7'}
              </div>
              <div className="text-xs text-slate-400">
                Last Backup: {stats?.system?.lastBackup ? new Date(stats.system.lastBackup).toLocaleDateString() : 'N/A'}
              </div>
              {stats?.system?.alerts && stats.system.alerts > 0 && (
                <div className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded">
                  {stats.system.alerts} Alerts
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Activity & Alerts Section */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent Activity */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-slate-300">System backup completed</span>
                </div>
                <span className="text-xs text-slate-400">2h ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-sm text-slate-300">New user registration</span>
                </div>
                <span className="text-xs text-slate-400">4h ago</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm text-slate-300">Transaction processed</span>
                </div>
                <span className="text-xs text-slate-400">6h ago</span>
              </div>
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-yellow-600/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              </div>
              <h3 className="text-lg font-semibold text-white">System Alerts</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-yellow-300">High transaction volume</span>
                </div>
                <span className="text-xs text-yellow-400 bg-yellow-900/30 px-2 py-1 rounded">Warning</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-green-300">All systems operational</span>
                </div>
                <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded">Info</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Database Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-400 text-lg">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Database Reset Confirmation
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              This action will permanently delete ALL user data from the database:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-3 text-sm">
              <div className="flex items-center text-red-400 p-2 bg-red-900/20 rounded-lg">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                All users will be deleted
              </div>
              <div className="flex items-center text-red-400 p-2 bg-red-900/20 rounded-lg">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                All investments will be lost
              </div>
              <div className="flex items-center text-red-400 p-2 bg-red-900/20 rounded-lg">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                All transactions will be erased
              </div>
              <div className="flex items-center text-red-400 p-2 bg-red-900/20 rounded-lg">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                All referral connections will be destroyed
              </div>
            </div>

            <div className="mt-4 p-4 bg-red-900/30 border border-red-700/50 rounded-lg">
              <p className="text-red-300 text-sm font-medium">
                ⚠️ This action is irreversible! After reset, all clients will be able to log in fresh.
              </p>
            </div>
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmResetDatabase}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 text-white flex-1"
            >
              {isResetting ? 'Resetting...' : 'Confirm Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;

