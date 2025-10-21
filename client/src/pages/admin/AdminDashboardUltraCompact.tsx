"use client";

import { LoadingSpinner } from '@/components/admin/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bell,
  CheckCircle,
  Cog,
  CreditCard,
  Database,
  DollarSign,
  FileText,
  Settings,
  Shield,
  Ticket,
  TrendingUp,
  UserCheck,
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

interface AdminFunction {
  path: string;
  label: string;
  icon: React.ElementType;
  color: string;
  shortLabel: string;
}

const adminFunctions: AdminFunction[] = [
  { path: '/admin/users', label: 'Users', icon: Users, color: 'bg-blue-600', shortLabel: 'Users' },
  { path: '/admin/transactions', label: 'Transactions', icon: CreditCard, color: 'bg-green-600', shortLabel: 'Pay' },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, color: 'bg-orange-600', shortLabel: 'Stats' },
  { path: '/admin/lottery', label: 'Lottery', icon: Ticket, color: 'bg-purple-600', shortLabel: 'Lottery' },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell, color: 'bg-yellow-600', shortLabel: 'Alerts' },
  { path: '/admin/processing', label: 'Processing', icon: Cog, color: 'bg-indigo-600', shortLabel: 'Slots' },
  { path: '/admin/exchange', label: 'Exchange', icon: TrendingUp, color: 'bg-teal-600', shortLabel: 'Rates' },
  { path: '/admin/logs', label: 'Logs', icon: FileText, color: 'bg-gray-600', shortLabel: 'Logs' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, color: 'bg-slate-600', shortLabel: 'Config' },
  { path: '/admin/staff', label: 'Staff', icon: Shield, color: 'bg-red-600', shortLabel: 'Staff' },
  { path: '/admin/user', label: 'User Detail', icon: UserCheck, color: 'bg-pink-600', shortLabel: 'User' }
];

const AdminDashboardUltraCompact = () => {
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
      <div className="flex items-center justify-center h-32">
        <LoadingSpinner size="md" text="Loading..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
        <p className="text-red-400 mb-2 text-sm">{error}</p>
        <Button onClick={fetchDashboardData} variant="outline" size="mobile" className="min-h-[44px] touch-manipulation">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2 p-1">
      {/* Ultra Compact Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-md p-2 text-white">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-bold">Admin Dashboard</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/20 min-h-[44px] min-w-[44px] touch-manipulation"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-purple-100 text-xs">
          System administration - Monitor and manage platform
        </p>
      </div>

      {/* Ultra Compact Stats - 2x2 Grid */}
      <div className="grid grid-cols-2 gap-1">
        <Card className="bg-gray-900 border-gray-700 p-2">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3 text-blue-400" />
            <div>
              <div className="text-xs text-gray-400">Users</div>
              <div className="text-sm font-bold text-white">{stats?.users.total || 0}</div>
              <div className="text-xs text-green-400">+{stats?.users.newThisWeek || 0}</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-700 p-2">
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-green-400" />
            <div>
              <div className="text-xs text-gray-400">Active</div>
              <div className="text-sm font-bold text-green-400">{stats?.users.active || 0}</div>
              <div className="text-xs text-red-400">{stats?.users.frozen || 0} frozen</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-700 p-2">
          <div className="flex items-center gap-1">
            <DollarSign className="h-3 w-3 text-yellow-400" />
            <div>
              <div className="text-xs text-gray-400">Invested</div>
              <div className="text-sm font-bold text-yellow-400">{(stats?.finances.totalInvested || 0).toFixed(0)}</div>
              <div className="text-xs text-blue-400">{(stats?.finances.todayPayouts || 0).toFixed(0)} today</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-700 p-2">
          <div className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-purple-400" />
            <div>
              <div className="text-xs text-gray-400">Activity</div>
              <div className="text-sm font-bold text-purple-400">{stats?.activity.dailyActiveUsers || 0}</div>
              <div className="text-xs text-gray-400">DAU</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Functions Grid - Ultra Compact for iPhone 13 */}
      <div className="grid grid-cols-4 gap-1">
        {adminFunctions.map((func) => {
          const Icon = func.icon;
          return (
            <Button
              key={func.path}
              onClick={() => navigate(func.path)}
              size="admin-compact"
              className={`${func.color} hover:opacity-90 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 touch-manipulation`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium leading-tight">{func.shortLabel}</span>
            </Button>
          );
        })}

        {/* Database Reset Button */}
        <Button
          onClick={handleResetDatabase}
          disabled={isResetting}
          size="admin-compact"
          className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 active:scale-95 touch-manipulation"
        >
          <Database className="h-4 w-4" />
          <span className="text-xs font-medium leading-tight">
            {isResetting ? 'Reset...' : 'Reset'}
          </span>
        </Button>
      </div>

      {/* System Status - Ultra Compact */}
      <div className="grid grid-cols-1 gap-1">
        <Card className="bg-gray-900 border-gray-700 p-2">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xs font-semibold text-white">System Status</h3>
            <CheckCircle className="h-3 w-3 text-green-400" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>Uptime: {stats?.system?.uptime || 'N/A'}</div>
            <div>Backup: {stats?.system?.lastBackup ? new Date(stats.system.lastBackup).toLocaleDateString() : 'N/A'}</div>
            {stats?.system?.alerts && stats.system.alerts > 0 && (
              <div className="text-red-400 col-span-2">{stats.system.alerts} Alerts</div>
            )}
          </div>
        </Card>
      </div>

      {/* Database Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Подтверждение сброса
            </DialogTitle>
            <DialogDescription className="text-gray-300 text-xs">
              Это действие полностью удалит ВСЕ данные клиентов:
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <div className="space-y-1 text-xs">
              <div className="flex items-center text-red-400">
                <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                Все пользователи будут удалены
              </div>
              <div className="flex items-center text-red-400">
                <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                Все инвестиции будут потеряны
              </div>
              <div className="flex items-center text-red-400">
                <span className="w-1 h-1 bg-red-400 rounded-full mr-2"></span>
                Все транзакции будут стерты
              </div>
            </div>

            <div className="mt-2 p-2 bg-red-900/20 border border-red-700 rounded text-xs">
              <p className="text-red-300">
                ⚠️ Это действие необратимо!
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              size="mobile"
              className="border-gray-600 text-gray-300 hover:bg-gray-800 text-xs min-h-[44px] touch-manipulation"
            >
              Отмена
            </Button>
            <Button
              onClick={confirmResetDatabase}
              disabled={isResetting}
              size="mobile"
              className="bg-red-600 hover:bg-red-700 text-white text-xs min-h-[44px] touch-manipulation"
            >
              {isResetting ? 'Сбрасываем...' : 'Подтвердить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardUltraCompact;
