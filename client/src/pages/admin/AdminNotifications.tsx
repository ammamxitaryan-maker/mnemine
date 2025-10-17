/**
 * Страница управления уведомлениями в админ панели
 */

import { NotificationCenter, useNotifications } from '@/components/admin/AdminNotifications';
import { PushNotificationSender } from '@/components/admin/PushNotificationSender';
import { WebSocketStatus } from '@/components/admin/WebSocketStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLogger } from '@/utils/logger';
import { Activity, Bell, History, Send, Settings } from 'lucide-react';
import { useState } from 'react';

export const AdminNotificationsPage = () => {
  const [activeTab, setActiveTab] = useState('send');
  const logger = useLogger();
  const {
    notifications,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount
  } = useNotifications();

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <Bell className="h-8 w-8 mr-3 text-purple-400" />
              Управление уведомлениями
            </h1>
            <p className="text-gray-400 mt-2">
              Отправка real-time уведомлений и мониторинг системы
            </p>
          </div>

          {/* Центр уведомлений */}
          <NotificationCenter
            notifications={notifications}
            onRemove={removeNotification}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
            unreadCount={unreadCount}
          />
        </div>

        {/* Основной контент */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-gray-700">
            <TabsTrigger
              value="send"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Send className="h-4 w-4 mr-2" />
              Отправка
            </TabsTrigger>
            <TabsTrigger
              value="status"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Статус
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <History className="h-4 w-4 mr-2" />
              История
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="data-[state=active]:bg-purple-600 data-[state=active]:text-white"
            >
              <Settings className="h-4 w-4 mr-2" />
              Настройки
            </TabsTrigger>
          </TabsList>

          {/* Вкладка отправки уведомлений */}
          <TabsContent value="send" className="space-y-6">
            <PushNotificationSender />
          </TabsContent>

          {/* Вкладка статуса подключения */}
          <TabsContent value="status" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <WebSocketStatus showDetails={true} />

              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-lg text-white flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Статистика уведомлений
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Информация о работе системы уведомлений
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-green-400">
                          {notifications.filter(n => n.type === 'success').length}
                        </div>
                        <div className="text-sm text-gray-400">Успешные</div>
                      </div>

                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-red-400">
                          {notifications.filter(n => n.type === 'error').length}
                        </div>
                        <div className="text-sm text-gray-400">Ошибки</div>
                      </div>

                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-400">
                          {notifications.filter(n => n.type === 'warning').length}
                        </div>
                        <div className="text-sm text-gray-400">Предупреждения</div>
                      </div>

                      <div className="text-center p-4 bg-gray-800 rounded-lg">
                        <div className="text-2xl font-bold text-blue-400">
                          {notifications.filter(n => n.type === 'info').length}
                        </div>
                        <div className="text-sm text-gray-400">Информация</div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Всего уведомлений:</span>
                        <span className="text-lg font-semibold text-white">
                          {notifications.length}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-400">Непрочитанных:</span>
                        <span className="text-lg font-semibold text-yellow-400">
                          {unreadCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Вкладка истории */}
          <TabsContent value="history" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  История уведомлений
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Все отправленные и полученные уведомления
                </CardDescription>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">История уведомлений пуста</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 rounded-lg border-l-4 ${notification.type === 'success' ? 'border-green-500 bg-green-500/10' :
                            notification.type === 'error' ? 'border-red-500 bg-red-500/10' :
                              notification.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' :
                                'border-blue-500 bg-blue-500/10'
                          } ${!notification.read ? 'bg-gray-800/50' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-medium text-white">
                                {notification.title}
                              </h4>
                              <span className="text-xs text-gray-500">
                                {new Date(notification.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-300">
                              {notification.message}
                            </p>
                            {notification.actions && (
                              <div className="flex items-center gap-2 mt-3">
                                {notification.actions.map((action, index) => (
                                  <button
                                    key={index}
                                    className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-white rounded"
                                    onClick={action.onClick}
                                  >
                                    {action.label}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка настроек */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg text-white flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Настройки уведомлений
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Конфигурация системы уведомлений
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="text-center py-8">
                    <Settings className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">Настройки будут добавлены в следующих версиях</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Здесь будут доступны настройки частоты уведомлений,
                      типов сообщений и других параметров системы
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};