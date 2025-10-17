/**
 * Улучшенный компонент дашборда админ панели
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAdminDashboardStats, useAdminCache } from '@/hooks/useAdminData';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { formatNumber, formatCurrency, formatRelativeTime, getStatColor } from '@/utils/adminUtils';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Eye,
  ArrowUpRight
} from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  color: string;
  onClick?: () => void;
  loading?: boolean;
}

const DashboardWidget = ({ 
  title, 
  value, 
  change, 
  changeType = 'neutral', 
  icon: Icon, 
  color, 
  onClick,
  loading = false 
}: DashboardWidgetProps) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive': return 'text-green-400';
      case 'negative': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'positive': return '↗';
      case 'negative': return '↘';
      default: return '→';
    }
  };

  return (
    <Card 
      className={`bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-gray-400">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-white">
            {loading ? (
              <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
            ) : (
              value
            )}
          </div>
          {change !== undefined && !loading && (
            <div className={`flex items-center text-xs ${getChangeColor()}`}>
              <span className="mr-1">{getChangeIcon()}</span>
              <span>{Math.abs(change)}%</span>
              <span className="ml-1 text-gray-500">vs last week</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const AdminDashboard = () => {
  const { data: stats, isLoading, error, refetch } = useAdminDashboardStats();
  const { goTo } = useAdminNavigation();
  const { invalidateDashboard } = useAdminCache();
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Автообновление каждые 30 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleRefresh = () => {
    invalidateDashboard();
    refetch();
    setLastRefresh(new Date());
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="bg-gray-900 border-red-700">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-400 mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-400 mb-4">{error.message}</p>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">
            {lastRefresh ? `Last updated: ${formatRelativeTime(lastRefresh)}` : 'Loading...'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <DashboardWidget
          title="Total Users"
          value={stats?.users.total || 0}
          change={stats?.users.newThisWeek ? (stats.users.newThisWeek / stats.users.total) * 100 : 0}
          changeType="positive"
          icon={Users}
          color="bg-blue-600"
          onClick={() => goTo('/admin/users')}
          loading={isLoading}
        />
        
        <DashboardWidget
          title="Active Users"
          value={stats?.users.active || 0}
          change={stats?.users.active ? (stats.users.active / stats.users.total) * 100 : 0}
          changeType="positive"
          icon={Activity}
          color="bg-green-600"
          onClick={() => goTo('/admin/users?status=active')}
          loading={isLoading}
        />
        
        <DashboardWidget
          title="Total Invested"
          value={formatCurrency(stats?.finances.totalInvested || 0)}
          change={stats?.finances.totalEarnings ? (stats.finances.totalEarnings / stats.finances.totalInvested) * 100 : 0}
          changeType="positive"
          icon={DollarSign}
          color="bg-yellow-600"
          onClick={() => goTo('/admin/transactions')}
          loading={isLoading}
        />
        
        <DashboardWidget
          title="Online Now"
          value={stats?.users.online || 0}
          icon={TrendingUp}
          color="bg-purple-600"
          onClick={() => goTo('/admin/users?status=online')}
          loading={isLoading}
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-400">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Uptime</span>
                <Badge variant="secondary" className="text-green-400">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {stats?.system.uptime || 'N/A'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Memory Usage</span>
                <span className={`text-sm ${getStatColor(stats?.system.memoryUsage || 0, { good: 70, warning: 85 })}`}>
                  {formatNumber(stats?.system.memoryUsage || 0)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">CPU Usage</span>
                <span className={`text-sm ${getStatColor(stats?.system.cpuUsage || 0, { good: 70, warning: 85 })}`}>
                  {formatNumber(stats?.system.cpuUsage || 0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-400">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Weekly Logs</span>
                <span className="text-sm text-white">{stats?.activity.weeklyLogs || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Daily Active</span>
                <span className="text-sm text-white">{stats?.activity.dailyActiveUsers || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Transactions Today</span>
                <span className="text-sm text-white">{stats?.activity.transactionsToday || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-400">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white"
                onClick={() => goTo('/admin/users')}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Users
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white"
                onClick={() => goTo('/admin/transactions')}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                View Transactions
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start text-gray-300 hover:text-white"
                onClick={() => goTo('/admin/logs')}
              >
                <Eye className="h-4 w-4 mr-2" />
                System Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
