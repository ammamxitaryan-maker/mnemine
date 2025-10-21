"use client";

import ActivityHeatmap from '@/components/admin/ActivityHeatmap';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';
import AdvancedUserManagement from '@/components/admin/AdvancedUserManagement';
import AuditLogSystem from '@/components/admin/AuditLogSystem';
import BroadcastMessenger from '@/components/admin/BroadcastMessenger';
import NotificationSystem from '@/components/admin/NotificationSystem';
import RealTimeErrorMonitor from '@/components/admin/RealTimeErrorMonitor';
import RealTimeUserMap from '@/components/admin/RealTimeUserMap';
import SettingsManagement from '@/components/admin/SettingsManagement';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  FileText,
  MapPin,
  MessageSquare,
  Settings,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminRealTimeMonitoring = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('user-map');

  const monitoringTabs = [
    {
      id: 'user-map',
      label: 'Карта пользователей',
      icon: MapPin,
      description: 'Географическое распределение активных пользователей'
    },
    {
      id: 'activity-heatmap',
      label: 'Тепловая карта',
      icon: Activity,
      description: 'Паттерны активности пользователей по времени'
    },
    {
      id: 'error-monitor',
      label: 'Мониторинг ошибок',
      icon: AlertTriangle,
      description: 'Отслеживание системных ошибок в реальном времени'
    },
    {
      id: 'broadcast',
      label: 'Массовая рассылка',
      icon: MessageSquare,
      description: 'Отправка уведомлений всем пользователям'
    },
    {
      id: 'analytics',
      label: 'Расширенная аналитика',
      icon: BarChart3,
      description: 'Детальный анализ производительности и метрик'
    },
    {
      id: 'user-management',
      label: 'Управление пользователями',
      icon: Users,
      description: 'Полный контроль над пользователями и их активностью'
    },
    {
      id: 'notifications',
      label: 'Система уведомлений',
      icon: Bell,
      description: 'Управление уведомлениями и правилами алертов'
    },
    {
      id: 'audit-logs',
      label: 'Аудит и логи',
      icon: FileText,
      description: 'Мониторинг всех действий пользователей'
    },
    {
      id: 'settings',
      label: 'Настройки системы',
      icon: Settings,
      description: 'Конфигурация всех параметров системы'
    }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'user-map':
        return <RealTimeUserMap />;
      case 'activity-heatmap':
        return <ActivityHeatmap />;
      case 'error-monitor':
        return <RealTimeErrorMonitor />;
      case 'broadcast':
        return <BroadcastMessenger />;
      case 'analytics':
        return <AdvancedAnalytics />;
      case 'user-management':
        return <AdvancedUserManagement />;
      case 'notifications':
        return <NotificationSystem />;
      case 'audit-logs':
        return <AuditLogSystem />;
      case 'settings':
        return <SettingsManagement />;
      default:
        return <RealTimeUserMap />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="text-gray-300 hover:text-white h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center">
                <TrendingUp className="h-7 w-7 mr-3 text-green-400" />
                Real-time мониторинг
              </h1>
              <p className="text-gray-400 mt-1">
                Мониторинг системы и пользователей в реальном времени
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className="bg-green-600 text-white animate-pulse">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-ping"></div>
              Live
            </Badge>
          </div>
        </div>

        {/* Быстрая статистика */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Онлайн пользователи</div>
                  <div className="text-2xl font-bold text-white">1,247</div>
                  <div className="text-xs text-green-400">+12% за час</div>
                </div>
                <Users className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Активность</div>
                  <div className="text-2xl font-bold text-white">89%</div>
                  <div className="text-xs text-blue-400">Высокая</div>
                </div>
                <Activity className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Ошибки системы</div>
                  <div className="text-2xl font-bold text-white">3</div>
                  <div className="text-xs text-yellow-400">Низкий уровень</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">Уведомления</div>
                  <div className="text-2xl font-bold text-white">156</div>
                  <div className="text-xs text-purple-400">Отправлено сегодня</div>
                </div>
                <Bell className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Навигация по разделам */}
        <Card className="bg-gray-900 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-blue-400" />
              <span>Инструменты мониторинга</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 bg-gray-800">
                {monitoringTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex flex-col items-center space-y-1 p-4 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>

              {monitoringTabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-6">
                  <div className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {tab.label}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {tab.description}
                      </p>
                    </div>
                    {renderTabContent()}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* Дополнительная информация */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <span>Системные метрики</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">CPU использование</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-white text-sm">45%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Память</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                    </div>
                    <span className="text-white text-sm">67%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Диск</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                    </div>
                    <span className="text-white text-sm">23%</span>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Сеть</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: '34%' }}></div>
                    </div>
                    <span className="text-white text-sm">34%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-purple-400" />
                <span>Последние события</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Новый пользователь зарегистрирован</div>
                    <div className="text-xs text-gray-400">2 минуты назад</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Платеж обработан успешно</div>
                    <div className="text-xs text-gray-400">5 минут назад</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Высокая нагрузка на сервер</div>
                    <div className="text-xs text-gray-400">8 минут назад</div>
                  </div>
                </div>

                <div className="flex items-start space-x-3 p-3 bg-gray-800 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="text-sm text-white">Лотерея завершена</div>
                    <div className="text-xs text-gray-400">12 минут назад</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminRealTimeMonitoring;
