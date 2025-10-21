"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface ErrorAlert {
  id: string;
  type: 'error' | 'warning' | 'critical' | 'info';
  category: 'payment' | 'system' | 'user' | 'security' | 'performance';
  title: string;
  message: string;
  timestamp: string;
  userId?: string;
  userInfo?: {
    firstName: string;
    username: string;
    telegramId: string;
  };
  metadata: Record<string, any>;
  resolved: boolean;
  severity: number; // 1-10
}

interface ErrorStats {
  totalErrors: number;
  criticalErrors: number;
  unresolvedErrors: number;
  errorRate: number;
  avgResolutionTime: number;
  topCategories: Array<{ category: string; count: number }>;
}

const RealTimeErrorMonitor = () => {
  const [errors, setErrors] = useState<ErrorAlert[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'error' | 'warning' | 'critical' | 'info'>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | 'payment' | 'system' | 'user' | 'security' | 'performance'>('all');
  const [showResolved, setShowResolved] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    fetchErrors();
    let interval: NodeJS.Timeout;

    if (autoRefresh) {
      interval = setInterval(fetchErrors, 5000); // Обновление каждые 5 секунд
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const fetchErrors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/monitoring/errors');
      const newErrors = response.data.data.errors || [];
      const newStats = response.data.data.stats || null;

      setErrors(newErrors);
      setStats(newStats);

      // Звуковое уведомление о новых критических ошибках
      if (soundEnabled && newErrors.some(e => e.type === 'critical' && !e.resolved)) {
        playNotificationSound();
      }
    } catch (error) {
      console.error('Error fetching errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const playNotificationSound = () => {
    // Простой звук уведомления
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(() => { }); // Игнорируем ошибки воспроизведения
  };

  const resolveError = async (errorId: string) => {
    try {
      await api.post(`/admin/monitoring/errors/${errorId}/resolve`);
      setErrors(prev => prev.map(e => e.id === errorId ? { ...e, resolved: true } : e));
    } catch (error) {
      console.error('Error resolving error:', error);
    }
  };

  const filteredErrors = errors.filter(error => {
    if (!showResolved && error.resolved) return false;
    if (filterType !== 'all' && error.type !== filterType) return false;
    if (filterCategory !== 'all' && error.category !== filterCategory) return false;
    return true;
  });

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'critical': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case 'info': return <CheckCircle className="h-5 w-5 text-blue-400" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getErrorColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-900/20 border-red-700';
      case 'error': return 'bg-red-900/10 border-red-600';
      case 'warning': return 'bg-yellow-900/20 border-yellow-600';
      case 'info': return 'bg-blue-900/20 border-blue-600';
      default: return 'bg-gray-900/20 border-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'payment': return '💳';
      case 'system': return '⚙️';
      case 'user': return '👤';
      case 'security': return '🔒';
      case 'performance': return '⚡';
      default: return '❓';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'bg-red-600';
    if (severity >= 6) return 'bg-orange-600';
    if (severity >= 4) return 'bg-yellow-600';
    return 'bg-green-600';
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-6 w-6 text-red-400" />
          <div>
            <h2 className="text-xl font-bold text-white">🚨 Мониторинг ошибок в реальном времени</h2>
            <p className="text-gray-400 text-sm">Отслеживание и управление системными ошибками</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setSoundEnabled(!soundEnabled)}
            variant="outline"
            size="sm"
            className={`border-gray-600 ${soundEnabled ? 'text-green-400' : 'text-gray-400'}`}
          >
            {soundEnabled ? <Bell className="h-4 w-4 mr-2" /> : <BellOff className="h-4 w-4 mr-2" />}
            Звук
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant="outline"
            size="sm"
            className={`border-gray-600 ${autoRefresh ? 'text-green-400' : 'text-gray-400'}`}
          >
            {autoRefresh ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            Авто
          </Button>
          <Button
            onClick={fetchErrors}
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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Всего ошибок</div>
                  <div className="text-2xl font-bold text-white">{stats.totalErrors}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Критические</div>
                  <div className="text-2xl font-bold text-red-400">{stats.criticalErrors}</div>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Нерешенные</div>
                  <div className="text-2xl font-bold text-yellow-400">{stats.unresolvedErrors}</div>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Частота ошибок</div>
                  <div className="text-2xl font-bold text-white">{stats.errorRate.toFixed(2)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Среднее время</div>
                  <div className="text-sm text-gray-300">{stats.avgResolutionTime}м</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Топ категории */}
      {stats && stats.topCategories.length > 0 && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-blue-400" />
              <span>Топ категории ошибок</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              {stats.topCategories.map((category, index) => (
                <div key={category.category} className="flex items-center space-x-2">
                  <span className="text-lg">{getCategoryIcon(category.category)}</span>
                  <span className="text-sm text-gray-300 capitalize">{category.category}</span>
                  <Badge className="bg-red-600 text-white">{category.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Фильтры */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-400" />
            <span>Фильтры</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Тип:</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">Все типы</option>
                <option value="critical">Критические</option>
                <option value="error">Ошибки</option>
                <option value="warning">Предупреждения</option>
                <option value="info">Информация</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-400">Категория:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as any)}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white text-sm"
              >
                <option value="all">Все категории</option>
                <option value="payment">💳 Платежи</option>
                <option value="system">⚙️ Система</option>
                <option value="user">👤 Пользователи</option>
                <option value="security">🔒 Безопасность</option>
                <option value="performance">⚡ Производительность</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowResolved(!showResolved)}
                variant={showResolved ? "default" : "outline"}
                size="sm"
                className={showResolved ? "bg-blue-600" : "border-gray-600 text-gray-300"}
              >
                {showResolved ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                Показать решенные
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Список ошибок */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <span>Ошибки системы</span>
            </div>
            <Badge className="bg-red-600 text-white">
              {filteredErrors.length} ошибок
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Загрузка ошибок...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredErrors.map((error) => (
                <div
                  key={error.id}
                  className={`p-4 rounded-lg border transition-all duration-200 ${error.resolved ? 'opacity-60' : ''
                    } ${getErrorColor(error.type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getErrorIcon(error.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-white truncate">
                            {error.title}
                          </h3>
                          <Badge className={`${getSeverityColor(error.severity)} text-white text-xs`}>
                            {error.severity}/10
                          </Badge>
                          <Badge className="bg-gray-600 text-white text-xs">
                            {getCategoryIcon(error.category)} {error.category}
                          </Badge>
                          {error.resolved && (
                            <Badge className="bg-green-600 text-white text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Решено
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-gray-300 mb-2">
                          {error.message}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(error.timestamp).toLocaleString()}</span>
                          </div>
                          {error.userInfo && (
                            <div className="flex items-center space-x-1">
                              <span>👤</span>
                              <span>{error.userInfo.firstName} (@{error.userInfo.username})</span>
                            </div>
                          )}
                        </div>

                        {Object.keys(error.metadata).length > 0 && (
                          <details className="mt-2">
                            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                              Детали ({Object.keys(error.metadata).length})
                            </summary>
                            <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-300">
                              <pre>{JSON.stringify(error.metadata, null, 2)}</pre>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>

                    {!error.resolved && (
                      <div className="flex-shrink-0 ml-4">
                        <Button
                          onClick={() => resolveError(error.id)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Решить
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredErrors.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Ошибки не найдены</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealTimeErrorMonitor;
