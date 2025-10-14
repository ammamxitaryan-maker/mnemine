"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Download, 
  Calendar, 
  TrendingUp, 
  Users, 
  DollarSign,
  Activity,
  RefreshCw,
  Filter
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface CustomReportData {
  timeframe: {
    start: string;
    end: string;
    days: number;
  };
  metrics: {
    earnings?: {
      total: number;
      daily: Record<string, number>;
      average: number;
      breakdown: {
        slotEarnings: number;
        referralEarnings: number;
        bonusEarnings: number;
      };
    };
    activity?: {
      total: number;
      uniqueUsers: number;
      daily: Record<string, { total: number; uniqueUsers: number }>;
      average: number;
      breakdown: {
        byType: Record<string, number>;
      };
    };
    referrals?: {
      total: number;
      active: number;
      revenue: number;
      daily: Record<string, number>;
      average: number;
      conversionRate: number;
    };
  };
}

const AdminCustomReports = () => {
  const [reportData, setReportData] = useState<CustomReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['earnings', 'activity', 'referrals']);
  const [timeframe, setTimeframe] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [useCustomDates, setUseCustomDates] = useState(false);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        metrics: selectedMetrics.join(','),
        timeframe: useCustomDates ? 'custom' : timeframe
      });

      if (useCustomDates) {
        if (customStartDate) params.append('startDate', customStartDate);
        if (customEndDate) params.append('endDate', customEndDate);
      }

      const response = await api.get(`/admin/custom-reports?${params}`);
      setReportData(response.data.data);
    } catch (error: any) {
      console.error('Error generating report:', error);
      alert(`Failed to generate report: ${error.response?.data?.error || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const prepareChartData = (dailyData: Record<string, number>) => {
    return Object.entries(dailyData).map(([date, value]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value
    }));
  };

  const prepareActivityChartData = (dailyData: Record<string, { total: number; uniqueUsers: number }>) => {
    return Object.entries(dailyData).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: data.total,
      uniqueUsers: data.uniqueUsers
    }));
  };

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Custom Reports</h1>
          <p className="text-gray-400">Generate detailed analytics and insights</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={generateReport} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Report Configuration */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <Filter className="h-4 w-4 mr-2" />
            Report Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Metrics Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Metrics
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'earnings', label: 'Earnings', icon: DollarSign },
                { key: 'activity', label: 'Activity', icon: Activity },
                { key: 'referrals', label: 'Referrals', icon: Users }
              ].map(({ key, label, icon: Icon }) => (
                <Button
                  key={key}
                  variant={selectedMetrics.includes(key) ? 'default' : 'outline'}
                  onClick={() => {
                    if (selectedMetrics.includes(key)) {
                      setSelectedMetrics(selectedMetrics.filter(m => m !== key));
                    } else {
                      setSelectedMetrics([...selectedMetrics, key]);
                    }
                  }}
                  className="justify-start"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Timeframe Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Timeframe
              </label>
              <div className="flex space-x-2">
                <Button
                  variant={!useCustomDates && timeframe === '1d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUseCustomDates(false);
                    setTimeframe('1d');
                  }}
                >
                  1 Day
                </Button>
                <Button
                  variant={!useCustomDates && timeframe === '7d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUseCustomDates(false);
                    setTimeframe('7d');
                  }}
                >
                  7 Days
                </Button>
                <Button
                  variant={!useCustomDates && timeframe === '30d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUseCustomDates(false);
                    setTimeframe('30d');
                  }}
                >
                  30 Days
                </Button>
                <Button
                  variant={!useCustomDates && timeframe === '90d' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setUseCustomDates(false);
                    setTimeframe('90d');
                  }}
                >
                  90 Days
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom Date Range
              </label>
              <div className="flex space-x-2">
                <Button
                  variant={useCustomDates ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setUseCustomDates(!useCustomDates)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Custom
                </Button>
              </div>
            </div>
          </div>

          {/* Custom Date Inputs */}
          {useCustomDates && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Date
                </label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="bg-gray-800 border-gray-600"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Timeframe Info */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-sm">Report Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-300">
                  {formatDate(reportData.timeframe.start)} - {formatDate(reportData.timeframe.end)}
                </span>
                <Badge variant="outline">{reportData.timeframe.days} days</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Report */}
          {reportData.metrics.earnings && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Earnings Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {formatCurrency(reportData.metrics.earnings.total)}
                    </div>
                    <div className="text-sm text-gray-400">Total Earnings</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {formatCurrency(reportData.metrics.earnings.average)}
                    </div>
                    <div className="text-sm text-gray-400">Daily Average</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {formatCurrency(reportData.metrics.earnings.breakdown.slotEarnings)}
                    </div>
                    <div className="text-sm text-gray-400">Slot Earnings</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">
                      {formatCurrency(reportData.metrics.earnings.breakdown.referralEarnings)}
                    </div>
                    <div className="text-sm text-gray-400">Referral Earnings</div>
                  </div>
                </div>

                {/* Daily Earnings Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareChartData(reportData.metrics.earnings.daily)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        dot={{ fill: '#10B981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Report */}
          {reportData.metrics.activity && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Activity className="h-4 w-4 mr-2" />
                  Activity Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {reportData.metrics.activity.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Total Activities</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {reportData.metrics.activity.uniqueUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Unique Users</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round(reportData.metrics.activity.average)}
                    </div>
                    <div className="text-sm text-gray-400">Daily Average</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">
                      {Math.round(reportData.metrics.activity.total / reportData.metrics.activity.uniqueUsers)}
                    </div>
                    <div className="text-sm text-gray-400">Avg per User</div>
                  </div>
                </div>

                {/* Activity Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prepareActivityChartData(reportData.metrics.activity.daily)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Total Activities"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="uniqueUsers" 
                        stroke="#8B5CF6" 
                        strokeWidth={2}
                        name="Unique Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Referrals Report */}
          {reportData.metrics.referrals && (
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center text-sm">
                  <Users className="h-4 w-4 mr-2" />
                  Referrals Report
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-400">
                      {reportData.metrics.referrals.total.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Total Referrals</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-400">
                      {reportData.metrics.referrals.active.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-400">Active Referrals</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-400">
                      {formatCurrency(reportData.metrics.referrals.revenue)}
                    </div>
                    <div className="text-sm text-gray-400">Referral Revenue</div>
                  </div>
                  <div className="bg-gray-800 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-400">
                      {reportData.metrics.referrals.conversionRate.toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-400">Conversion Rate</div>
                  </div>
                </div>

                {/* Daily Referrals Chart */}
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prepareChartData(reportData.metrics.referrals.daily)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '6px'
                        }} 
                      />
                      <Bar dataKey="value" fill="#8B5CF6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminCustomReports;
