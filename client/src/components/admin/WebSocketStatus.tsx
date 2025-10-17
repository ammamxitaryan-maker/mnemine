/**
 * Компонент для отображения статуса WebSocket подключения
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';
import { cn } from '@/lib/utils';
import { useLogger } from '@/utils/logger';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Users,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface WebSocketStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const WebSocketStatus = ({ className, showDetails = true }: WebSocketStatusProps) => {
  const [stats, setStats] = useState<{
    connectedUsers: number;
    connectedAdmins: number;
    totalConnections: number;
  } | null>(null);

  const { connected, error, status, statusMessage, connect, disconnect, client } = useWebSocketNotifications({
    enabled: true,
    autoConnect: true,
    reconnectOnFocus: true,
  });

  const logger = useLogger();

  // Получение статистики подключений
  useEffect(() => {
    if (connected) {
      const interval = setInterval(() => {
        client.send({ type: 'get_stats' });
      }, 10000); // Каждые 10 секунд

      return () => clearInterval(interval);
    }
  }, [connected, client]);

  // Обработка ответов на запросы статистики
  useEffect(() => {
    const handleMessage = (message: any) => {
      if (message.type === 'stats_response') {
        setStats(message.data);
      }
    };

    client.onMessage(handleMessage);
  }, [client]);

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-400" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'disabled':
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      default:
        return <WifiOff className="h-4 w-4 text-yellow-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'error':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'disabled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const handleReconnect = () => {
    logger.userAction('WebSocket manual reconnect attempted');
    connect();
  };

  const handleDisconnect = () => {
    logger.userAction('WebSocket manually disconnected');
    disconnect();
  };

  if (!showDetails) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        {getStatusIcon()}
        <span className="text-sm text-gray-300">
          {status === 'connected' ? 'Подключено' : 'Отключено'}
        </span>
      </div>
    );
  }

  return (
    <Card className={cn('bg-gray-900 border-gray-700', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          WebSocket статус
        </CardTitle>
        <CardDescription className="text-gray-400">
          Подключение к серверу real-time уведомлений
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Основной статус */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <p className="text-sm font-medium text-white">
                {statusMessage}
              </p>
              {error && (
                <p className="text-xs text-red-400 mt-1">
                  {error}
                </p>
              )}
            </div>
          </div>

          <Badge className={cn('border', getStatusColor())}>
            {status === 'connected' ? 'Активно' :
              status === 'error' ? 'Ошибка' :
                status === 'disabled' ? 'Отключено' : 'Неактивно'}
          </Badge>
        </div>

        {/* Статистика подключений */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-700">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Users className="h-4 w-4 text-blue-400 mr-1" />
                <span className="text-lg font-semibold text-white">
                  {stats.connectedUsers}
                </span>
              </div>
              <p className="text-xs text-gray-400">Пользователи</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                <span className="text-lg font-semibold text-white">
                  {stats.connectedAdmins}
                </span>
              </div>
              <p className="text-xs text-gray-400">Админы</p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Activity className="h-4 w-4 text-purple-400 mr-1" />
                <span className="text-lg font-semibold text-white">
                  {stats.totalConnections}
                </span>
              </div>
              <p className="text-xs text-gray-400">Всего</p>
            </div>
          </div>
        )}

        {/* Кнопки управления */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            Последнее обновление: {new Date().toLocaleTimeString()}
          </div>

          <div className="flex items-center space-x-2">
            {status === 'connected' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisconnect}
                className="text-gray-400 hover:text-white border-gray-600 hover:border-gray-500"
              >
                <WifiOff className="h-3 w-3 mr-1" />
                Отключить
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReconnect}
                disabled={status === 'disabled'}
                className="text-gray-400 hover:text-white border-gray-600 hover:border-gray-500"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Подключить
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
