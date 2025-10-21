"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Filter,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface HeatmapData {
  hour: number;
  day: number;
  activity: number;
  users: number;
  revenue: number;
}

interface ActivityStats {
  peakHour: { hour: number; activity: number };
  peakDay: { day: string; activity: number };
  totalActivity: number;
  avgActivity: number;
  trend: 'up' | 'down' | 'stable';
}

const ActivityHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [activityStats, setActivityStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const [viewMode, setViewMode] = useState<'activity' | 'users' | 'revenue'>('activity');

  const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  useEffect(() => {
    fetchHeatmapData();
    const interval = setInterval(fetchHeatmapData, 60000); // Обновление каждую минуту
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchHeatmapData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/analytics/heatmap?range=${timeRange}`);
      setHeatmapData(response.data.data.heatmap || []);
      setActivityStats(response.data.data.stats || null);
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCellData = (hour: number, day: number) => {
    return heatmapData.find(d => d.hour === hour && d.day === day) || {
      hour,
      day,
      activity: 0,
      users: 0,
      revenue: 0
    };
  };

  const getIntensity = (value: number, maxValue: number) => {
    if (maxValue === 0) return 0;
    return Math.min(value / maxValue, 1);
  };

  const getMaxValue = () => {
    if (heatmapData.length === 0) return 1;
    return Math.max(...heatmapData.map(d =>
      viewMode === 'activity' ? d.activity :
        viewMode === 'users' ? d.users : d.revenue
    ));
  };

  const getColorIntensity = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-800';
    if (intensity < 0.2) return 'bg-green-900';
    if (intensity < 0.4) return 'bg-green-800';
    if (intensity < 0.6) return 'bg-yellow-600';
    if (intensity < 0.8) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const maxValue = getMaxValue();

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Activity className="h-6 w-6 text-orange-400" />
          <div>
            <h2 className="text-xl font-bold text-white">🔥 Тепловая карта активности</h2>
            <p className="text-gray-400 text-sm">Паттерны активности пользователей по времени</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={fetchHeatmapData}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      {activityStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">⏰ Пиковый час</div>
                  <div className="text-2xl font-bold text-white">
                    {activityStats.peakHour.hour}:00
                  </div>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">📅 Пиковый день</div>
                  <div className="text-2xl font-bold text-white">
                    {activityStats.peakDay.day}
                  </div>
                </div>
                <Calendar className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">📊 Общая активность</div>
                  <div className="text-2xl font-bold text-white">
                    {activityStats.totalActivity.toLocaleString()}
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">📈 Тренд</div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className={`h-5 w-5 ${activityStats.trend === 'up' ? 'text-green-400' :
                        activityStats.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                      }`} />
                    <span className={`text-lg font-bold ${activityStats.trend === 'up' ? 'text-green-400' :
                        activityStats.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                      {activityStats.trend === 'up' ? '↗️' :
                        activityStats.trend === 'down' ? '↘️' : '→'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Фильтры */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-400" />
            <span>Настройки отображения</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Период:</label>
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="week">Неделя</option>
                <option value="month">Месяц</option>
                <option value="quarter">Квартал</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Режим:</label>
              <div className="flex space-x-1">
                {[
                  { value: 'activity', label: 'Активность' },
                  { value: 'users', label: 'Пользователи' },
                  { value: 'revenue', label: 'Доход' }
                ].map(mode => (
                  <Button
                    key={mode.value}
                    onClick={() => setViewMode(mode.value as any)}
                    variant={viewMode === mode.value ? "default" : "outline"}
                    size="sm"
                    className={viewMode === mode.value ? "bg-blue-600" : "border-gray-600 text-gray-300"}
                  >
                    {mode.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Тепловая карта */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-orange-400" />
              <span>Тепловая карта активности</span>
            </div>
            <Badge className="bg-orange-600 text-white">
              Макс: {maxValue.toLocaleString()}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Загрузка данных...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Легенда */}
              <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400">Интенсивность:</span>
                  <div className="flex space-x-1">
                    {[0, 0.2, 0.4, 0.6, 0.8, 1].map((intensity, index) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded ${getColorIntensity(intensity)}`}
                        title={`${Math.round(intensity * 100)}%`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {viewMode === 'activity' ? 'Активность' :
                    viewMode === 'users' ? 'Пользователи' : 'Доход ($)'}
                </div>
              </div>

              {/* Карта */}
              <div className="overflow-x-auto">
                <div className="min-w-max">
                  {/* Заголовки дней */}
                  <div className="flex mb-2">
                    <div className="w-12 h-8 flex items-center justify-center text-xs text-gray-400">
                      Час
                    </div>
                    {days.map(day => (
                      <div key={day} className="w-16 h-8 flex items-center justify-center text-xs text-gray-400 font-medium">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Строки часов */}
                  {hours.map(hour => (
                    <div key={hour} className="flex mb-1">
                      <div className="w-12 h-8 flex items-center justify-center text-xs text-gray-300 font-medium">
                        {hour.toString().padStart(2, '0')}
                      </div>
                      {days.map(day => {
                        const data = getCellData(hour, days.indexOf(day));
                        const value = viewMode === 'activity' ? data.activity :
                          viewMode === 'users' ? data.users : data.revenue;
                        const intensity = getIntensity(value, maxValue);

                        return (
                          <div
                            key={`${hour}-${day}`}
                            className={`w-16 h-8 border border-gray-700 rounded cursor-pointer transition-all duration-200 hover:scale-110 ${getColorIntensity(intensity)}`}
                            title={`${day} ${hour}:00 - ${value.toLocaleString()} ${viewMode === 'activity' ? 'активность' :
                                viewMode === 'users' ? 'пользователей' : 'доход'
                              }`}
                          >
                            {value > 0 && (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-xs font-bold text-white">
                                  {value > 1000 ? `${(value / 1000).toFixed(1)}k` : value}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Дополнительная информация */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-400">Средняя активность</div>
                  <div className="text-lg font-bold text-white">
                    {activityStats?.avgActivity.toFixed(1) || '0'}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Пиковое время</div>
                  <div className="text-lg font-bold text-white">
                    {activityStats?.peakHour.hour || 0}:00
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-400">Пиковый день</div>
                  <div className="text-lg font-bold text-white">
                    {activityStats?.peakDay.day || 'Н/Д'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityHeatmap;
