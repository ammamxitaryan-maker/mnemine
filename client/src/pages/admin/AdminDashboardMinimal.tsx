"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/admin/LoadingSpinner';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Ticket,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Database,
  Trash2,
  Settings,
  Bell,
  FileText,
  CreditCard,
  Cog,
  Home,
  Shield,
  History,
  Gift,
  Ban
} from 'lucide-react';

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
  description: string;
}

const adminFunctions: AdminFunction[] = [
  { path: '/admin/users', label: 'Users', icon: Users, color: 'bg-blue-600', description: 'Manage users' },
  { path: '/admin/transactions', label: 'Transactions', icon: CreditCard, color: 'bg-green-600', description: 'Payment logs' },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, color: 'bg-orange-600', description: 'Performance metrics' },
  { path: '/admin/lottery', label: 'Lottery', icon: Ticket, color: 'bg-purple-600', description: 'Lottery management' },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell, color: 'bg-yellow-600', description: 'Notification system' },
  { path: '/admin/processing', label: 'Processing', icon: Cog, color: 'bg-indigo-600', description: 'Slot processing' },
  { path: '/admin/exchange', label: 'Exchange', icon: TrendingUp, color: 'bg-teal-600', description: 'Exchange rates' },
  { path: '/admin/logs', label: 'Logs', icon: FileText, color: 'bg-gray-600', description: 'System logs' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, color: 'bg-slate-600', description: 'System config' },
  { path: '/admin/staff', label: 'Staff', icon: Shield, color: 'bg-red-600', description: 'Staff management' },
  { path: '/admin/user', label: 'User Detail', icon: UserCheck, color: 'bg-pink-600', description: 'User details' },
  { path: '/admin/processing', label: 'Queue', icon: History, color: 'bg-cyan-600', description: 'Queue management' }
];

const AdminDashboardMinimal = () => {
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
        <Button onClick={fetchDashboardData} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-2">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-4 text-white">
        <h1 className="text-xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-purple-100 text-sm">
          System administration panel - Monitor and manage all platform aspects
        </p>
      </div>

      {/* Compact Stats Row */}
      <div className="grid grid-cols-4 gap-2">
        <Card className="bg-gray-900 border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-400" />
            <div>
              <div className="text-xs text-gray-400">Users</div>
              <div className="text-lg font-bold text-white">{stats?.users.total || 0}</div>
              <div className="text-xs text-green-400">+{stats?.users.newThisWeek || 0} new</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-400" />
            <div>
              <div className="text-xs text-gray-400">Active</div>
              <div className="text-lg font-bold text-green-400">{stats?.users.active || 0}</div>
              <div className="text-xs text-red-400">{stats?.users.frozen || 0} frozen</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-yellow-400" />
            <div>
              <div className="text-xs text-gray-400">Invested</div>
              <div className="text-lg font-bold text-yellow-400">{(stats?.finances.totalInvested || 0).toFixed(0)}</div>
              <div className="text-xs text-blue-400">{(stats?.finances.todayPayouts || 0).toFixed(0)} today</div>
            </div>
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-700 p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-purple-400" />
            <div>
              <div className="text-xs text-gray-400">Activity</div>
              <div className="text-lg font-bold text-purple-400">{stats?.activity.dailyActiveUsers || 0}</div>
              <div className="text-xs text-gray-400">DAU</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Admin Functions Grid - Compact */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {adminFunctions.map((func) => {
          const Icon = func.icon;
          return (
            <Button
              key={func.path}
              onClick={() => navigate(func.path)}
              className={`h-16 flex-col space-y-1 ${func.color} hover:opacity-90 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium leading-tight">{func.label}</span>
            </Button>
          );
        })}
        
        {/* Database Reset Button */}
        <Button
          onClick={handleResetDatabase}
          disabled={isResetting}
          className="h-16 flex-col space-y-1 bg-red-600 hover:bg-red-700 text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
        >
          <Database className="h-5 w-5" />
          <span className="text-xs font-medium leading-tight">
            {isResetting ? 'Resetting...' : 'Reset DB'}
          </span>
        </Button>
      </div>

      {/* System Status - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card className="bg-gray-900 border-gray-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">System Status</h3>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
          <div className="space-y-1 text-xs text-gray-400">
            <div>Uptime: {stats?.system?.uptime || 'N/A'}</div>
            <div>Last Backup: {stats?.system?.lastBackup ? new Date(stats.system.lastBackup).toLocaleDateString() : 'N/A'}</div>
            {stats?.system?.alerts && stats.system.alerts > 0 && (
              <div className="text-red-400">{stats.system.alerts} Alerts</div>
            )}
          </div>
        </Card>

        <Card className="bg-gray-900 border-gray-700 p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
            <Clock className="h-4 w-4 text-blue-400" />
          </div>
          <div className="space-y-1 text-xs text-gray-400">
            <div>System backup completed - 2h ago</div>
            <div>New user registration - 4h ago</div>
            <div>Transaction processed - 6h ago</div>
          </div>
        </Card>
      </div>

      {/* Database Reset Confirmation Dialog */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-400">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Подтверждение сброса базы данных
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Это действие полностью удалит ВСЕ данные клиентов из базы данных:
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2 text-sm">
              <div className="flex items-center text-red-400">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Все пользователи будут удалены
              </div>
              <div className="flex items-center text-red-400">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Все инвестиции будут потеряны
              </div>
              <div className="flex items-center text-red-400">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Все транзакции будут стерты
              </div>
              <div className="flex items-center text-red-400">
                <span className="w-2 h-2 bg-red-400 rounded-full mr-3"></span>
                Все реферальные связи будут уничтожены
              </div>
            </div>

            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-300 text-sm">
                ⚠️ Это действие необратимо! После сброса все клиенты смогут войти в приложение заново с нуля.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResetDialog(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Отмена
            </Button>
            <Button
              onClick={confirmResetDatabase}
              disabled={isResetting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isResetting ? 'Сбрасываем...' : 'Подтвердить сброс'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardMinimal;
