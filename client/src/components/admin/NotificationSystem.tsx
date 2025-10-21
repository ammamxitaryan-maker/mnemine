"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Filter,
  Info,
  MessageSquare,
  RefreshCw,
  Send,
  Shield,
  Trash2,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'system' | 'user' | 'payment' | 'security' | 'marketing' | 'maintenance';
  targetAudience: 'all' | 'admins' | 'users' | 'vip' | 'specific';
  targetUsers?: string[];
  channels: ('push' | 'email' | 'sms' | 'in-app')[];
  scheduledTime?: string;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: string;
  recipientCount: number;
  deliveredCount: number;
  readCount: number;
  clickCount: number;
  createdAt: string;
  createdBy: string;
  metadata?: Record<string, any>;
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  type: string;
  category: string;
  variables: string[];
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}

interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: string;
  threshold: number;
  metric: string;
  isActive: boolean;
  lastTriggered?: string;
  triggerCount: number;
  actions: string[];
  cooldown: number; // minutes
}

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    category: 'all',
    priority: 'all'
  });

  const [newNotification, setNewNotification] = useState<Partial<Notification>>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    category: 'system',
    targetAudience: 'all',
    channels: ['push', 'in-app'],
    status: 'draft'
  });

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Обновление каждые 30 секунд
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notificationsRes, templatesRes, rulesRes] = await Promise.all([
        api.get('/admin/notifications'),
        api.get('/admin/notifications/templates'),
        api.get('/admin/notifications/alert-rules')
      ]);

      setNotifications(notificationsRes.data.data || []);
      setTemplates(templatesRes.data.data || []);
      setAlertRules(rulesRes.data.data || []);
    } catch (error) {
      console.error('Error fetching notification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNotification = async () => {
    try {
      await api.post('/admin/notifications', newNotification);
      setShowCreateForm(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        category: 'system',
        targetAudience: 'all',
        channels: ['push', 'in-app'],
        status: 'draft'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const sendNotification = async (notificationId: string) => {
    try {
      await api.post(`/admin/notifications/${notificationId}/send`);
      fetchData();
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.delete(`/admin/notifications/${notificationId}`);
      fetchData();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const toggleAlertRule = async (ruleId: string) => {
    try {
      await api.post(`/admin/notifications/alert-rules/${ruleId}/toggle`);
      fetchData();
    } catch (error) {
      console.error('Error toggling alert rule:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      default: return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'critical': return 'bg-red-900/20 border-red-700';
      case 'error': return 'bg-red-900/10 border-red-600';
      case 'warning': return 'bg-yellow-900/20 border-yellow-600';
      case 'success': return 'bg-green-900/20 border-green-600';
      case 'info': return 'bg-blue-900/20 border-blue-600';
      default: return 'bg-gray-900/20 border-gray-600';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      case 'low': return 'bg-green-600';
      default: return 'bg-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-600';
      case 'sending': return 'bg-blue-600';
      case 'scheduled': return 'bg-yellow-600';
      case 'failed': return 'bg-red-600';
      case 'cancelled': return 'bg-gray-600';
      default: return 'bg-gray-600';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.type !== 'all' && notification.type !== filters.type) return false;
    if (filters.status !== 'all' && notification.status !== filters.status) return false;
    if (filters.category !== 'all' && notification.category !== filters.category) return false;
    if (filters.priority !== 'all' && notification.priority !== filters.priority) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">🔔 Система уведомлений и алертов</h2>
            <p className="text-gray-400 text-sm">Управление уведомлениями, шаблонами и правилами алертов</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowCreateForm(true)}
            variant="outline"
            size="sm"
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Создать уведомление
          </Button>
          <Button
            onClick={fetchData}
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
                <div className="text-sm text-gray-400">Всего уведомлений</div>
                <div className="text-2xl font-bold text-white">{notifications.length}</div>
              </div>
              <Bell className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Отправлено сегодня</div>
                <div className="text-2xl font-bold text-green-400">
                  {notifications.filter(n => n.status === 'sent' && new Date(n.sentAt || '').toDateString() === new Date().toDateString()).length}
                </div>
              </div>
              <Send className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Активные правила</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {alertRules.filter(r => r.isActive).length}
                </div>
              </div>
              <Shield className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Шаблоны</div>
                <div className="text-2xl font-bold text-purple-400">{templates.length}</div>
              </div>
              <MessageSquare className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Форма создания уведомления */}
      {showCreateForm && (
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Создание уведомления</span>
              <Button
                onClick={() => setShowCreateForm(false)}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Заголовок</Label>
                  <Input
                    value={newNotification.title || ''}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="Заголовок уведомления"
                    className="bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Сообщение</Label>
                  <Textarea
                    value={newNotification.message || ''}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Текст уведомления"
                    className="bg-gray-800 border-gray-600 text-white min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Тип</Label>
                    <Select value={newNotification.type} onValueChange={(value) => setNewNotification({ ...newNotification, type: value as any })}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">Информация</SelectItem>
                        <SelectItem value="warning">Предупреждение</SelectItem>
                        <SelectItem value="error">Ошибка</SelectItem>
                        <SelectItem value="success">Успех</SelectItem>
                        <SelectItem value="critical">Критическое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Приоритет</Label>
                    <Select value={newNotification.priority} onValueChange={(value) => setNewNotification({ ...newNotification, priority: value as any })}>
                      <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Низкий</SelectItem>
                        <SelectItem value="medium">Средний</SelectItem>
                        <SelectItem value="high">Высокий</SelectItem>
                        <SelectItem value="urgent">Срочный</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Категория</Label>
                  <Select value={newNotification.category} onValueChange={(value) => setNewNotification({ ...newNotification, category: value as any })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Система</SelectItem>
                      <SelectItem value="user">Пользователи</SelectItem>
                      <SelectItem value="payment">Платежи</SelectItem>
                      <SelectItem value="security">Безопасность</SelectItem>
                      <SelectItem value="marketing">Маркетинг</SelectItem>
                      <SelectItem value="maintenance">Обслуживание</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Целевая аудитория</Label>
                  <Select value={newNotification.targetAudience} onValueChange={(value) => setNewNotification({ ...newNotification, targetAudience: value as any })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все пользователи</SelectItem>
                      <SelectItem value="admins">Администраторы</SelectItem>
                      <SelectItem value="users">Пользователи</SelectItem>
                      <SelectItem value="vip">VIP пользователи</SelectItem>
                      <SelectItem value="specific">Конкретные пользователи</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Каналы отправки</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {['push', 'email', 'sms', 'in-app'].map(channel => (
                      <label key={channel} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newNotification.channels?.includes(channel as any)}
                          onChange={(e) => {
                            const channels = newNotification.channels || [];
                            if (e.target.checked) {
                              setNewNotification({ ...newNotification, channels: [...channels, channel as any] });
                            } else {
                              setNewNotification({ ...newNotification, channels: channels.filter(c => c !== channel) });
                            }
                          }}
                          className="rounded border-gray-600 bg-gray-800 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-300 capitalize">{channel}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={createNotification}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Создать
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300"
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Основной контент */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="notifications" className="data-[state=active]:bg-blue-600">
            <Bell className="h-4 w-4 mr-2" />
            Уведомления
          </TabsTrigger>
          <TabsTrigger value="templates" className="data-[state=active]:bg-blue-600">
            <MessageSquare className="h-4 w-4 mr-2" />
            Шаблоны
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-blue-600">
            <Shield className="h-4 w-4 mr-2" />
            Правила алертов
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-4">
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
                  <Label className="text-white">Тип</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все типы</SelectItem>
                      <SelectItem value="info">Информация</SelectItem>
                      <SelectItem value="warning">Предупреждение</SelectItem>
                      <SelectItem value="error">Ошибка</SelectItem>
                      <SelectItem value="success">Успех</SelectItem>
                      <SelectItem value="critical">Критическое</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Статус</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все статусы</SelectItem>
                      <SelectItem value="draft">Черновик</SelectItem>
                      <SelectItem value="scheduled">Запланировано</SelectItem>
                      <SelectItem value="sending">Отправляется</SelectItem>
                      <SelectItem value="sent">Отправлено</SelectItem>
                      <SelectItem value="failed">Ошибка</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Категория</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все категории</SelectItem>
                      <SelectItem value="system">Система</SelectItem>
                      <SelectItem value="user">Пользователи</SelectItem>
                      <SelectItem value="payment">Платежи</SelectItem>
                      <SelectItem value="security">Безопасность</SelectItem>
                      <SelectItem value="marketing">Маркетинг</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Приоритет</Label>
                  <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все приоритеты</SelectItem>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="urgent">Срочный</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Список уведомлений */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Уведомления ({filteredNotifications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400">Загрузка уведомлений...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all duration-200 ${getTypeColor(notification.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="flex-shrink-0 mt-1">
                            {getTypeIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-medium text-white truncate">
                                {notification.title}
                              </h3>
                              <Badge className={`${getPriorityColor(notification.priority)} text-white text-xs`}>
                                {notification.priority}
                              </Badge>
                              <Badge className={`${getStatusColor(notification.status)} text-white text-xs`}>
                                {notification.status}
                              </Badge>
                            </div>

                            <p className="text-sm text-gray-300 mb-2">
                              {notification.message}
                            </p>

                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Users className="h-3 w-3" />
                                <span>{notification.recipientCount} получателей</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <CheckCircle className="h-3 w-3" />
                                <span>{notification.deliveredCount} доставлено</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>{notification.readCount} прочитано</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(notification.createdAt).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-4">
                          <div className="flex space-x-1">
                            {notification.status === 'draft' && (
                              <Button
                                onClick={() => sendNotification(notification.id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              onClick={() => setSelectedNotification(notification)}
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={() => deleteNotification(notification.id)}
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredNotifications.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Уведомления не найдены</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Шаблоны уведомлений</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-white">{template.name}</h3>
                      <Badge className={template.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                        {template.isActive ? 'Активен' : 'Неактивен'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{template.title}</p>
                    <p className="text-xs text-gray-400 mb-3">{template.message}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Использований: {template.usageCount}</span>
                      <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle>Правила алертов</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alertRules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-white">{rule.name}</h3>
                          <Badge className={rule.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                            {rule.isActive ? 'Активно' : 'Неактивно'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{rule.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>Метрика: {rule.metric}</span>
                          <span>Порог: {rule.threshold}</span>
                          <span>Срабатываний: {rule.triggerCount}</span>
                          {rule.lastTriggered && (
                            <span>Последний: {new Date(rule.lastTriggered).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => toggleAlertRule(rule.id)}
                          size="sm"
                          variant="outline"
                          className={rule.isActive ? "border-red-600 text-red-400 hover:bg-red-600 hover:text-white" : "border-green-600 text-green-400 hover:bg-green-600 hover:text-white"}
                        >
                          {rule.isActive ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default NotificationSystem;
