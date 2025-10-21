"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import {
  Activity,
  BarChart3,
  DollarSign,
  Download,
  Filter,
  LineChart,
  PieChart,
  RefreshCw,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AnalyticsData {
  revenue: {
    total: number;
    daily: number;
    weekly: number;
    monthly: number;
    growth: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
    growth: number;
  };
  transactions: {
    total: number;
    successful: number;
    failed: number;
    avgAmount: number;
  };
  performance: {
    responseTime: number;
    uptime: number;
    errorRate: number;
    throughput: number;
  };
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

const AdvancedAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('7d');
  const [chartType, setChartType] = useState('line');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 60000); // Обновление каждую минуту
    return () => clearInterval(interval);
  }, [dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/advanced?range=${dateRange}`);
      setAnalyticsData(response.data.data || null);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const response = await api.post('/admin/analytics/export', {
        format,
        dateRange,
        metrics: ['revenue', 'users', 'transactions', 'performance']
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics_report_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-400';
    if (growth < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">📊 Расширенная аналитика</h2>
            <p className="text-gray-400 text-sm">Детальный анализ производительности и метрик системы</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchAnalyticsData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <Button
            onClick={() => exportReport('pdf')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт PDF
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-400" />
            <span>Настройки анализа</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-white">Период</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Последние 24 часа</SelectItem>
                  <SelectItem value="7d">Последние 7 дней</SelectItem>
                  <SelectItem value="30d">Последние 30 дней</SelectItem>
                  <SelectItem value="90d">Последние 3 месяца</SelectItem>
                  <SelectItem value="1y">Последний год</SelectItem>
                  <SelectItem value="custom">Пользовательский период</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Тип графика</Label>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Линейный</SelectItem>
                  <SelectItem value="bar">Столбчатый</SelectItem>
                  <SelectItem value="pie">Круговой</SelectItem>
                  <SelectItem value="area">Областной</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Метрика</Label>
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Доходы</SelectItem>
                  <SelectItem value="users">Пользователи</SelectItem>
                  <SelectItem value="transactions">Транзакции</SelectItem>
                  <SelectItem value="performance">Производительность</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Экспорт</Label>
              <div className="flex space-x-1">
                <Button
                  onClick={() => exportReport('excel')}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Excel
                </Button>
                <Button
                  onClick={() => exportReport('csv')}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  CSV
                </Button>
              </div>
            </div>
          </div>

          {dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-white">Начальная дата</Label>
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white">Конечная дата</Label>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Основные метрики */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">💰 Общий доход</div>
                  <div className="text-2xl font-bold text-white">
                    ${analyticsData.revenue.total.toLocaleString()}
                  </div>
                  <div className={`flex items-center space-x-1 text-xs ${getGrowthColor(analyticsData.revenue.growth)}`}>
                    {getGrowthIcon(analyticsData.revenue.growth)}
                    <span>{analyticsData.revenue.growth > 0 ? '+' : ''}{analyticsData.revenue.growth.toFixed(1)}%</span>
                  </div>
                </div>
                <DollarSign className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">👥 Пользователи</div>
                  <div className="text-2xl font-bold text-white">
                    {analyticsData.users.total.toLocaleString()}
                  </div>
                  <div className={`flex items-center space-x-1 text-xs ${getGrowthColor(analyticsData.users.growth)}`}>
                    {getGrowthIcon(analyticsData.users.growth)}
                    <span>{analyticsData.users.growth > 0 ? '+' : ''}{analyticsData.users.growth.toFixed(1)}%</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">💳 Транзакции</div>
                  <div className="text-2xl font-bold text-white">
                    {analyticsData.transactions.total.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">
                    Успешных: {analyticsData.transactions.successful}
                  </div>
                </div>
                <Activity className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">⚡ Производительность</div>
                  <div className="text-2xl font-bold text-white">
                    {analyticsData.performance.uptime.toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-400">
                    Время отклика: {analyticsData.performance.responseTime}мс
                  </div>
                </div>
                <Zap className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Детальная аналитика */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            Обзор
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:bg-blue-600">
            <DollarSign className="h-4 w-4 mr-2" />
            Доходы
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-blue-600">
            <Users className="h-4 w-4 mr-2" />
            Пользователи
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-blue-600">
            <Target className="h-4 w-4 mr-2" />
            Производительность
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5 text-green-400" />
                  <span>Тренд доходов</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <LineChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>График доходов по времени</p>
                    <p className="text-sm">Интеграция с Chart.js</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="h-5 w-5 text-blue-400" />
                  <span>Распределение пользователей</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Круговая диаграмма пользователей</p>
                    <p className="text-sm">По странам и активности</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Анализ доходов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    ${analyticsData?.revenue.daily.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-400">Дневной доход</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    ${analyticsData?.revenue.weekly.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-400">Недельный доход</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    ${analyticsData?.revenue.monthly.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-400">Месячный доход</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Анализ пользователей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-green-400">
                    {analyticsData?.users.active.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-400">Активные пользователи</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400">
                    {analyticsData?.users.new.toLocaleString() || 0}
                  </div>
                  <div className="text-sm text-gray-400">Новые пользователи</div>
                </div>
                <div className="text-center p-4 bg-gray-800 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400">
                    {((analyticsData?.users.active || 0) / (analyticsData?.users.total || 1) * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">Процент активности</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Метрики производительности</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Время отклика</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (analyticsData?.performance.responseTime || 0) / 10)}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{analyticsData?.performance.responseTime || 0}мс</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Время работы</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${analyticsData?.performance.uptime || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{analyticsData?.performance.uptime || 0}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Частота ошибок</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${analyticsData?.performance.errorRate || 0}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{analyticsData?.performance.errorRate || 0}%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Пропускная способность</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${Math.min(100, (analyticsData?.performance.throughput || 0) / 1000)}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{analyticsData?.performance.throughput || 0} req/s</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;
