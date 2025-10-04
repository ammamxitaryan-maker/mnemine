"use client";

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  BarChart3
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

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/dashboard-stats');
      setStats(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
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
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-purple-100">
          Welcome to the system administration panel. Monitor and manage all aspects of the platform.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          onClick={() => navigate('/admin/users')}
          className="h-20 flex-col space-y-2 bg-blue-600 hover:bg-blue-700"
        >
          <Users className="h-6 w-6" />
          <span className="text-sm">Manage Users</span>
        </Button>
        <Button
          onClick={() => navigate('/admin/transactions')}
          className="h-20 flex-col space-y-2 bg-green-600 hover:bg-green-700"
        >
          <DollarSign className="h-6 w-6" />
          <span className="text-sm">Transactions</span>
        </Button>
        <Button
          onClick={() => navigate('/admin/lottery')}
          className="h-20 flex-col space-y-2 bg-purple-600 hover:bg-purple-700"
        >
          <Ticket className="h-6 w-6" />
          <span className="text-sm">Lottery</span>
        </Button>
        <Button
          onClick={() => navigate('/admin/settings')}
          className="h-20 flex-col space-y-2 bg-gray-600 hover:bg-gray-700"
        >
          <BarChart3 className="h-6 w-6" />
          <span className="text-sm">Settings</span>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Users Stats */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-blue-400" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold text-white">{stats?.users.total || 0}</span>
                <span className="text-xs text-gray-400">Total</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-400">{stats?.users.active || 0} Active</span>
                <span className="text-red-400">{stats?.users.frozen || 0} Frozen</span>
              </div>
              <div className="text-xs text-gray-400">
                +{stats?.users.newThisWeek || 0} this week
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Stats */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-2 text-green-400" />
              Finances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xl font-bold text-green-400">
                  {(stats?.finances.totalInvested || 0).toFixed(0)}
                </span>
                <span className="text-xs text-gray-400">USD Invested</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-400">
                  {(stats?.finances.totalEarnings || 0).toFixed(0)} Earned
                </span>
                <span className="text-blue-400">
                  {(stats?.finances.todayPayouts || 0).toFixed(0)} Today
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Stats */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Activity className="h-4 w-4 mr-2 text-purple-400" />
              Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold text-purple-400">
                  {stats?.activity.dailyActiveUsers || 0}
                </span>
                <span className="text-xs text-gray-400">DAU</span>
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
          </CardContent>
        </Card>

        {/* System Stats */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
              System
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-green-400">● Online</span>
                <span className="text-xs text-gray-400">Status</span>
              </div>
              <div className="text-xs text-gray-400">
                Uptime: {stats?.system.uptime || 'N/A'}
              </div>
              <div className="text-xs text-gray-400">
                Last Backup: {stats?.system.lastBackup || 'N/A'}
              </div>
              {stats?.system.alerts && stats.system.alerts > 0 && (
                <div className="text-xs text-red-400">
                  {stats.system.alerts} Alerts
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-blue-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">System backup completed</span>
                <span className="text-xs text-gray-400">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">New user registration</span>
                <span className="text-xs text-gray-400">4 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Transaction processed</span>
                <span className="text-xs text-gray-400">6 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-400">High transaction volume</span>
                <span className="text-xs text-gray-400">Warning</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-400">All systems operational</span>
                <span className="text-xs text-gray-400">Info</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

