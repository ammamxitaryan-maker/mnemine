/**
 * Компонент для отправки push-уведомлений из админ панели
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLogger } from '@/utils/logger';
import { useWebSocket } from '@/utils/websocket';
import {
  AlertCircle,
  AlertTriangle,
  Bell,
  CheckCircle,
  Globe,
  Info,
  Loader2,
  Send,
  Target,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNotifications } from './AdminNotifications';

interface PushNotificationForm {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  targetType: 'all' | 'specific';
  targetUserId?: string;
  persistent: boolean;
  showActions: boolean;
  actionLabel?: string;
}

interface PushNotificationSenderProps {
  className?: string;
}

export const PushNotificationSender = ({ className }: PushNotificationSenderProps) => {
  const [form, setForm] = useState<PushNotificationForm>({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    targetUserId: '',
    persistent: false,
    showActions: false,
    actionLabel: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastSent, setLastSent] = useState<{ count: number; timestamp: string } | null>(null);
  const [connectedUsers, setConnectedUsers] = useState(0);

  const logger = useLogger();
  const { addNotification } = useNotifications();

  // WebSocket подключение для админа
  const { client, connected, error } = useWebSocket({
    url: 'ws://localhost:8080',
    token: 'admin-token', // В реальном приложении получать из auth
    userType: 'admin',
  });

  useEffect(() => {
    // Обработка уведомлений от WebSocket
    client.onNotification((notification) => {
      if ((notification as any).type === 'broadcast_sent') {
        setLastSent({
          count: (notification as any).data?.sentCount || 0,
          timestamp: new Date().toLocaleString(),
        });
        addNotification({
          title: 'Уведомления отправлены',
          message: `Отправлено ${(notification as any).data?.sentCount || 0} пользователям`,
          type: 'success',
        });
      }
    });

    // Получение статистики подключений
    const interval = setInterval(() => {
      if (connected) {
        client.send({ type: 'get_stats' });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [client, connected, addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim() || !form.message.trim()) {
      addNotification({
        title: 'Ошибка',
        message: 'Заполните все обязательные поля',
        type: 'error',
      });
      return;
    }

    if (form.targetType === 'specific' && !form.targetUserId?.trim()) {
      addNotification({
        title: 'Ошибка',
        message: 'Укажите ID пользователя для отправки',
        type: 'error',
      });
      return;
    }

    setIsLoading(true);

    try {
      const notificationData = {
        title: form.title,
        message: form.message,
        type: form.type,
        persistent: form.persistent,
        actions: form.showActions && form.actionLabel ? [{
          label: form.actionLabel,
          onClick: () => console.log('Action clicked'),
          variant: 'default' as const,
        }] : undefined,
      };

      if (form.targetType === 'all') {
        // Рассылка всем пользователям
        client.send({
          type: 'admin_broadcast',
          data: notificationData,
        });

        logger.userAction('Push notification broadcast sent', {
          title: form.title,
          type: form.type,
          targetType: 'all',
        });
      } else {
        // Отправка конкретному пользователю
        client.send({
          type: 'admin_send_to_user',
          data: {
            userId: form.targetUserId,
            notification: notificationData,
          },
        });

        logger.userAction('Push notification sent to user', {
          title: form.title,
          type: form.type,
          targetUserId: form.targetUserId,
        });
      }

      // Сброс формы
      setForm({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        targetUserId: '',
        persistent: false,
        showActions: false,
        actionLabel: '',
      });

    } catch (error) {
      console.error('Error sending notification:', error);
      logger.error('Failed to send push notification', error as Error);

      addNotification({
        title: 'Ошибка отправки',
        message: 'Не удалось отправить уведомление',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      default: return <Bell className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-500 bg-green-500/10';
      case 'error': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'info': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Статус подключения */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-white flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Push-уведомления
          </CardTitle>
          <CardDescription className="text-gray-400">
            Отправка real-time уведомлений пользователям
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={cn(
                  'w-3 h-3 rounded-full',
                  connected ? 'bg-green-500' : 'bg-red-500'
                )} />
                <span className="text-sm text-gray-300">
                  {connected ? 'Подключено' : 'Отключено'}
                </span>
              </div>

              {connected && (
                <Badge variant="secondary" className="bg-blue-500/20 text-blue-400">
                  <Users className="h-3 w-3 mr-1" />
                  {connectedUsers} пользователей онлайн
                </Badge>
              )}
            </div>

            {lastSent && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Последняя отправка:</p>
                <p className="text-sm text-gray-300">
                  {lastSent.count} пользователей • {lastSent.timestamp}
                </p>
              </div>
            )}
          </div>

          {error && (
            <Alert className="mt-4 border-red-500 bg-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-400">
                Ошибка подключения: {error}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Форма отправки */}
      <Card className="bg-gray-900 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg text-white flex items-center">
            <Send className="h-5 w-5 mr-2" />
            Отправить уведомление
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Заголовок и сообщение */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-300">
                  Заголовок *
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Заголовок уведомления"
                  className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type" className="text-sm font-medium text-gray-300">
                  Тип уведомления
                </Label>
                <Select
                  value={form.type}
                  onValueChange={(value: any) => setForm(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white focus:border-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="info" className="text-white hover:bg-gray-700">
                      <div className="flex items-center">
                        <Info className="h-4 w-4 mr-2 text-blue-400" />
                        Информация
                      </div>
                    </SelectItem>
                    <SelectItem value="success" className="text-white hover:bg-gray-700">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                        Успех
                      </div>
                    </SelectItem>
                    <SelectItem value="warning" className="text-white hover:bg-gray-700">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-yellow-400" />
                        Предупреждение
                      </div>
                    </SelectItem>
                    <SelectItem value="error" className="text-white hover:bg-gray-700">
                      <div className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2 text-red-400" />
                        Ошибка
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-sm font-medium text-gray-300">
                Сообщение *
              </Label>
              <Textarea
                id="message"
                value={form.message}
                onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Текст уведомления"
                rows={3}
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 resize-none"
                required
              />
            </div>

            {/* Целевая аудитория */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-300">
                Целевая аудитория
              </Label>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="target-all"
                    name="targetType"
                    value="all"
                    checked={form.targetType === 'all'}
                    onChange={(e) => setForm(prev => ({ ...prev, targetType: e.target.value as 'all' | 'specific' }))}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <Label htmlFor="target-all" className="flex items-center text-gray-300">
                    <Globe className="h-4 w-4 mr-1" />
                    Всем пользователям
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="target-specific"
                    name="targetType"
                    value="specific"
                    checked={form.targetType === 'specific'}
                    onChange={(e) => setForm(prev => ({ ...prev, targetType: e.target.value as 'all' | 'specific' }))}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <Label htmlFor="target-specific" className="flex items-center text-gray-300">
                    <Target className="h-4 w-4 mr-1" />
                    Конкретному пользователю
                  </Label>
                </div>
              </div>

              {form.targetType === 'specific' && (
                <div className="space-y-2">
                  <Label htmlFor="targetUserId" className="text-sm font-medium text-gray-300">
                    ID пользователя
                  </Label>
                  <Input
                    id="targetUserId"
                    value={form.targetUserId}
                    onChange={(e) => setForm(prev => ({ ...prev, targetUserId: e.target.value }))}
                    placeholder="Введите Telegram ID пользователя"
                    className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  />
                </div>
              )}
            </div>

            {/* Дополнительные настройки */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-gray-300">
                Дополнительные настройки
              </Label>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="persistent" className="text-sm text-gray-300">
                    Постоянное уведомление
                  </Label>
                  <Switch
                    id="persistent"
                    checked={form.persistent}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, persistent: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="showActions" className="text-sm text-gray-300">
                    Добавить действие
                  </Label>
                  <Switch
                    id="showActions"
                    checked={form.showActions}
                    onCheckedChange={(checked) => setForm(prev => ({ ...prev, showActions: checked }))}
                  />
                </div>

                {form.showActions && (
                  <div className="space-y-2">
                    <Label htmlFor="actionLabel" className="text-sm font-medium text-gray-300">
                      Текст кнопки действия
                    </Label>
                    <Input
                      id="actionLabel"
                      value={form.actionLabel}
                      onChange={(e) => setForm(prev => ({ ...prev, actionLabel: e.target.value }))}
                      placeholder="Например: Открыть"
                      className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Предварительный просмотр */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Предварительный просмотр
              </Label>
              <div className={cn(
                'p-4 rounded-lg border-l-4',
                getTypeColor(form.type)
              )}>
                <div className="flex items-start space-x-3">
                  {getTypeIcon(form.type)}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">
                      {form.title || 'Заголовок уведомления'}
                    </h4>
                    <p className="text-sm text-gray-300 mt-1">
                      {form.message || 'Текст уведомления'}
                    </p>
                    {form.showActions && form.actionLabel && (
                      <div className="mt-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs"
                        >
                          {form.actionLabel}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Кнопка отправки */}
            <div className="flex justify-end pt-4 border-t border-gray-700">
              <Button
                type="submit"
                disabled={isLoading || !connected}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Отправить уведомление
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
