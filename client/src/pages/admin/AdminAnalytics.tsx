"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Activity,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

interface AnalyticsData {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
  };
  finances: {
    totalInvested: number;
    totalEarnings: number;
    todayRevenue: number;
    weeklyRevenue: number;
    monthlyRevenue: number;
  };
  activity: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    avgSessionTime: number;
  };
  performance: {
    conversionRate: number;
    retentionRate: number;
    referralRate: number;
    slotUtilization: number;
  };
}

const AdminAnalytics = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics?days=${dateRange}`);
      setAnalytics(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const response = await api.get(`/admin/analytics/export?days=${dateRange}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Export failed:', err);
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
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchAnalytics} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics Dashboard</h1>
          <p className="text-gray-400">Performance metrics and insights</p>
        </div>
        <div className="flex space-x-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white text-sm"
          >
            <option value="1">Last 24 hours</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* User Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Users className="h-4 w-4 mr-2 text-blue-400" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {analytics?.users.total.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              +{analytics?.users.newThisMonth || 0} this month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Activity className="h-4 w-4 mr-2 text-green-400" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {analytics?.users.active.toLocaleString() || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {analytics?.users.total && analytics.users.total > 0 ? 
                ((analytics.users.active / analytics.users.total) * 100).toFixed(1) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 mr-2 text-yellow-400" />
              New Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {analytics?.users.newToday || 0}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              +{analytics?.users.newThisWeek || 0} this week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {analytics?.performance.conversionRate.toFixed(1) || 0}%
            </div>
            <div className="text-xs text-gray-400 mt-1">
              User to investor
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 mr-2 text-green-400" />
              Total Invested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {(analytics?.finances.totalInvested || 0).toLocaleString()} USD
            </div>
            <div className="text-xs text-gray-400 mt-1">
              All time
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <TrendingUp className="h-4 w-4 mr-2 text-blue-400" />
              Today's Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {(analytics?.finances.todayRevenue || 0).toLocaleString()} USD
            </div>
            <div className="text-xs text-gray-400 mt-1">
              From new investments
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <Activity className="h-4 w-4 mr-2 text-yellow-400" />
              Weekly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {(analytics?.finances.weeklyRevenue || 0).toLocaleString()} USD
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Last 7 days
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm">
              <BarChart3 className="h-4 w-4 mr-2 text-purple-400" />
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {(analytics?.finances.monthlyRevenue || 0).toLocaleString()} USD
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Last 30 days
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <BarChart3 className="h-4 w-4 mr-2 text-blue-400" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Retention Rate</span>
                <span className="text-green-400 font-bold">
                  {analytics?.performance.retentionRate.toFixed(1) || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Referral Rate</span>
                <span className="text-blue-400 font-bold">
                  {analytics?.performance.referralRate.toFixed(1) || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Slot Utilization</span>
                <span className="text-purple-400 font-bold">
                  {analytics?.performance.slotUtilization.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <Activity className="h-4 w-4 mr-2 text-green-400" />
              Activity Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Daily Active Users</span>
                <span className="text-green-400 font-bold">
                  {analytics?.activity.dailyActiveUsers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Weekly Active Users</span>
                <span className="text-blue-400 font-bold">
                  {analytics?.activity.weeklyActiveUsers || 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Avg Session Time</span>
                <span className="text-purple-400 font-bold">
                  {analytics?.activity.avgSessionTime.toFixed(1) || 0}m
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;

