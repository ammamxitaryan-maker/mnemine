"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  Globe,
  Info,
  Lock,
  MapPin,
  Monitor,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Smartphone,
  TrendingUp,
  User,
  Users,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userInfo: {
    firstName: string;
    username: string;
    email?: string;
    role: string;
  };
  action: string;
  category: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system' | 'security' | 'payment' | 'user_management';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    city: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    os: string;
    browser: string;
  };
  metadata: Record<string, any>;
  riskScore: number;
  isSuspicious: boolean;
  tags: string[];
}

interface LogFilter {
  search: string;
  category: string;
  severity: string;
  userId: string;
  dateRange: string;
  riskLevel: string;
  suspicious: string;
  action: string;
}

interface SecurityEvent {
  id: string;
  type: 'failed_login' | 'suspicious_activity' | 'data_breach_attempt' | 'privilege_escalation' | 'unusual_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedUsers: number;
  timestamp: string;
  status: 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
}

const AuditLogSystem = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('logs');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [filters, setFilters] = useState<LogFilter>({
    search: '',
    category: 'all',
    severity: 'all',
    userId: '',
    dateRange: '24h',
    riskLevel: 'all',
    suspicious: 'all',
    action: ''
  });

  useEffect(() => {
    fetchAuditData();
    const interval = setInterval(fetchAuditData, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [logsRes, eventsRes] = await Promise.all([
        api.get('/admin/audit/logs'),
        api.get('/admin/audit/security-events')
      ]);

      setAuditLogs(logsRes.data.data || []);
      setSecurityEvents(eventsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async (format: 'csv' | 'json' | 'pdf') => {
    try {
      const response = await api.post('/admin/audit/export', {
        format,
        filters
      }, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'low': return <Info className="h-4 w-4 text-blue-400" />;
      default: return <Info className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-blue-600';
      default: return 'bg-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Lock className="h-4 w-4" />;
      case 'authorization': return <Shield className="h-4 w-4" />;
      case 'data_access': return <Eye className="h-4 w-4" />;
      case 'data_modification': return <Edit className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'user_management': return <Users className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'desktop': return <Monitor className="h-4 w-4" />;
      case 'mobile': return <Smartphone className="h-4 w-4" />;
      case 'tablet': return <Monitor className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-400';
    if (score >= 60) return 'text-orange-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-green-400';
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!log.description.toLowerCase().includes(searchLower) &&
        !log.userInfo.firstName.toLowerCase().includes(searchLower) &&
        !log.userInfo.username.toLowerCase().includes(searchLower) &&
        !log.action.toLowerCase().includes(searchLower)) {
        return false;
      }
    }

    if (filters.category !== 'all' && log.category !== filters.category) return false;
    if (filters.severity !== 'all' && log.severity !== filters.severity) return false;
    if (filters.userId && log.userId !== filters.userId) return false;
    if (filters.riskLevel !== 'all') {
      switch (filters.riskLevel) {
        case 'low':
          if (log.riskScore >= 40) return false;
          break;
        case 'medium':
          if (log.riskScore < 40 || log.riskScore >= 70) return false;
          break;
        case 'high':
          if (log.riskScore < 70) return false;
          break;
      }
    }
    if (filters.suspicious !== 'all' && log.isSuspicious !== (filters.suspicious === 'true')) return false;
    if (filters.action && !log.action.toLowerCase().includes(filters.action.toLowerCase())) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <FileText className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">📋 Система аудита и логирования</h2>
            <p className="text-gray-400 text-sm">Мониторинг всех действий пользователей и системных событий</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => exportLogs('csv')}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт CSV
          </Button>
          <Button
            onClick={fetchAuditData}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Всего записей</div>
                <div className="text-2xl font-bold text-white">{auditLogs.length}</div>
              </div>
              <FileText className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Подозрительные</div>
                <div className="text-2xl font-bold text-red-400">
                  {auditLogs.filter(log => log.isSuspicious).length}
                </div>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">События безопасности</div>
                <div className="text-2xl font-bold text-yellow-400">{securityEvents.length}</div>
              </div>
              <Shield className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Высокий риск</div>
                <div className="text-2xl font-bold text-orange-400">
                  {auditLogs.filter(log => log.riskScore >= 70).length}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600">
            <FileText className="h-4 w-4 mr-2" />
            Логи аудита
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-blue-600">
            <Shield className="h-4 w-4 mr-2" />
            Безопасность
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-600">
            <Activity className="h-4 w-4 mr-2" />
            Аналитика
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          {/* Фильтры */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-blue-400" />
                <span>Фильтры</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-white">Поиск</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Поиск по логам..."
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      className="pl-10 bg-gray-800 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Категория</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      <SelectItem value="authentication">Аутентификация</SelectItem>
                      <SelectItem value="authorization">Авторизация</SelectItem>
                      <SelectItem value="data_access">Доступ к данным</SelectItem>
                      <SelectItem value="data_modification">Изменение данных</SelectItem>
                      <SelectItem value="system">Система</SelectItem>
                      <SelectItem value="security">Безопасность</SelectItem>
                      <SelectItem value="payment">Платежи</SelectItem>
                      <SelectItem value="user_management">Управление пользователями</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Серьезность</Label>
                  <Select value={filters.severity} onValueChange={(value) => setFilters({ ...filters, severity: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все уровни</SelectItem>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="critical">Критический</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Период</Label>
                  <Select value={filters.dateRange} onValueChange={(value) => setFilters({ ...filters, dateRange: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Последний час</SelectItem>
                      <SelectItem value="24h">Последние 24 часа</SelectItem>
                      <SelectItem value="7d">Последние 7 дней</SelectItem>
                      <SelectItem value="30d">Последние 30 дней</SelectItem>
                      <SelectItem value="all">Все время</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Список логов */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Логи аудита ({filteredLogs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">Загрузка логов...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${log.isSuspicious ? 'bg-red-900/10 border-red-600' : 'bg-gray-800 border-gray-700'
                        }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getSeverityIcon(log.severity)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-white truncate">
                                {log.action}
                              </h3>
                              <Badge className={`${getSeverityColor(log.severity)} text-white text-xs`}>
                                {log.severity}
                              </Badge>
                              <Badge className="bg-gray-600 text-white text-xs">
                                {getCategoryIcon(log.category)}
                                {log.category}
                              </Badge>
                              {log.isSuspicious && (
                                <Badge className="bg-red-600 text-white text-xs">
                                  Подозрительно
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-gray-300 mb-2">
                              {log.description}
                            </p>

                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <User className="h-3 w-3" />
                                <span>{log.userInfo.firstName} (@{log.userInfo.username})</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(log.timestamp).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                {getDeviceIcon(log.device.type)}
                                <span>{log.device.type}</span>
                              </div>
                              {log.location && (
                                <div className="flex items-center space-x-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{log.location.city}, {log.location.country}</span>
                                </div>
                              )}
                              <div className={`font-medium ${getRiskColor(log.riskScore)}`}>
                                Риск: {log.riskScore}/100
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-4">
                          <Button
                            onClick={() => setSelectedLog(log)}
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Логи не найдены</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>События безопасности</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.map((event) => (
                  <div key={event.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-white">{event.type}</h3>
                          <Badge className={`${getSeverityColor(event.severity)} text-white text-xs`}>
                            {event.severity}
                          </Badge>
                          <Badge className={`${event.status === 'resolved' ? 'bg-green-600' :
                              event.status === 'investigating' ? 'bg-yellow-600' : 'bg-gray-600'
                            } text-white text-xs`}>
                            {event.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{event.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>Затронуто пользователей: {event.affectedUsers}</span>
                          <span>Время: {new Date(event.timestamp).toLocaleString()}</span>
                          {event.assignedTo && <span>Назначено: {event.assignedTo}</span>}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Активность по категориям</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['authentication', 'authorization', 'data_access', 'data_modification', 'system', 'security', 'payment', 'user_management'].map(category => {
                    const count = auditLogs.filter(log => log.category === category).length;
                    const percentage = auditLogs.length > 0 ? (count / auditLogs.length) * 100 : 0;

                    return (
                      <div key={category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span className="text-sm text-gray-300 capitalize">{category.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white w-12 text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle>Распределение по серьезности</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['critical', 'high', 'medium', 'low'].map(severity => {
                    const count = auditLogs.filter(log => log.severity === severity).length;
                    const percentage = auditLogs.length > 0 ? (count / auditLogs.length) * 100 : 0;

                    return (
                      <div key={severity} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getSeverityIcon(severity)}
                          <span className="text-sm text-gray-300 capitalize">{severity}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${getSeverityColor(severity)}`}
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-white w-12 text-right">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Модальное окно деталей лога */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-gray-900 border-gray-700 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Детали лога аудита</span>
                <Button
                  onClick={() => setSelectedLog(null)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Действие</Label>
                    <p className="text-gray-300">{selectedLog.action}</p>
                  </div>
                  <div>
                    <Label className="text-white">Серьезность</Label>
                    <Badge className={`${getSeverityColor(selectedLog.severity)} text-white`}>
                      {selectedLog.severity}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-white">Описание</Label>
                  <p className="text-gray-300">{selectedLog.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">Пользователь</Label>
                    <p className="text-gray-300">{selectedLog.userInfo.firstName} (@{selectedLog.userInfo.username})</p>
                  </div>
                  <div>
                    <Label className="text-white">Роль</Label>
                    <p className="text-gray-300">{selectedLog.userInfo.role}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white">IP адрес</Label>
                    <p className="text-gray-300">{selectedLog.ipAddress}</p>
                  </div>
                  <div>
                    <Label className="text-white">Устройство</Label>
                    <p className="text-gray-300">{selectedLog.device.type} - {selectedLog.device.os}</p>
                  </div>
                </div>

                {selectedLog.location && (
                  <div>
                    <Label className="text-white">Местоположение</Label>
                    <p className="text-gray-300">{selectedLog.location.city}, {selectedLog.location.country}</p>
                  </div>
                )}

                <div>
                  <Label className="text-white">Метаданные</Label>
                  <pre className="text-xs text-gray-300 bg-gray-800 p-2 rounded overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AuditLogSystem;
