/**
 * Хук для интеграции WebSocket с системой уведомлений
 */

import { useNotifications } from '@/components/admin/AdminNotifications';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useLogger } from '@/utils/logger';
import { NotificationData, useWebSocket } from '@/utils/websocket';
import { useEffect, useRef } from 'react';

interface WebSocketNotificationsConfig {
  enabled: boolean;
  autoConnect: boolean;
  reconnectOnFocus: boolean;
}

export const useWebSocketNotifications = (config: WebSocketNotificationsConfig = {
  enabled: true,
  autoConnect: true,
  reconnectOnFocus: true,
}) => {
  const { user } = useTelegramAuth();
  const { addNotification } = useNotifications();
  const logger = useLogger();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket подключение для пользователей
  const { client, connected, error, connect, disconnect } = useWebSocket({
    url: 'ws://localhost:8080',
    token: user?.telegramId || 'anonymous', // В реальном приложении использовать JWT
    userType: 'user',
  });

  // Автоматическое подключение
  useEffect(() => {
    if (config.enabled && config.autoConnect && user?.telegramId) {
      connect().catch(err => {
        logger.error('Failed to connect to WebSocket', err as Error);
      });
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [config.enabled, config.autoConnect, user?.telegramId, connect, logger]);

  // Переподключение при фокусе окна
  useEffect(() => {
    if (!config.reconnectOnFocus) return;

    const handleFocus = () => {
      if (!connected && config.enabled && user?.telegramId) {
        logger.info('Window focused, attempting to reconnect WebSocket', 'SYSTEM');
        connect().catch(err => {
          logger.error('Failed to reconnect WebSocket on focus', err as Error);
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [connected, config.reconnectOnFocus, config.enabled, user?.telegramId, connect, logger]);

  // Обработка входящих уведомлений
  useEffect(() => {
    const handleNotification = (notification: NotificationData) => {
      logger.info('WebSocket notification received', 'SYSTEM', {
        title: notification.title,
        type: notification.type,
        id: notification.id,
      });

      // Добавляем уведомление в систему
      addNotification({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        persistent: notification.persistent,
        actions: notification.actions,
      });

      // Показываем системное уведомление (если поддерживается браузером)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico',
          tag: notification.id,
        });
      }
    };

    client.onNotification(handleNotification);

    return () => {
      // Очистка обработчика
    };
  }, [client, addNotification, logger]);

  // Обработка ошибок подключения
  useEffect(() => {
    if (error) {
      logger.error('WebSocket connection error', new Error(error), 'SYSTEM');

      // Показываем уведомление об ошибке только если это не первая попытка
      if (reconnectTimeoutRef.current) {
        addNotification({
          title: 'Проблема с подключением',
          message: 'Не удается подключиться к серверу уведомлений',
          type: 'warning',
          persistent: true,
        });
      }
    }
  }, [error, logger, addNotification]);

  // Обработка изменения статуса подключения
  useEffect(() => {
    if (connected) {
      logger.info('WebSocket connected successfully', 'SYSTEM');

      // Убираем уведомления об ошибках подключения
      // (в реальном приложении можно добавить логику для удаления конкретных уведомлений)
    } else if (user?.telegramId) {
      logger.warn('WebSocket disconnected', 'SYSTEM');
    }
  }, [connected, user?.telegramId, logger]);

  // Запрос разрешения на уведомления
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        logger.info(`Notification permission: ${permission}`, 'SYSTEM');
      });
    }
  }, [logger]);

  // Функции для управления
  const manualConnect = () => {
    if (user?.telegramId) {
      connect().catch(err => {
        logger.error('Manual WebSocket connection failed', err as Error);
        addNotification({
          title: 'Ошибка подключения',
          message: 'Не удалось подключиться к серверу уведомлений',
          type: 'error',
        });
      });
    }
  };

  const manualDisconnect = () => {
    disconnect();
    logger.info('WebSocket manually disconnected', 'SYSTEM');
  };

  const getConnectionStatus = () => {
    if (!config.enabled) return 'disabled';
    if (!user?.telegramId) return 'no_user';
    if (connected) return 'connected';
    if (error) return 'error';
    return 'disconnected';
  };

  const getStatusMessage = () => {
    const status = getConnectionStatus();
    switch (status) {
      case 'disabled': return 'WebSocket отключен';
      case 'no_user': return 'Пользователь не авторизован';
      case 'connected': return 'Подключено к серверу уведомлений';
      case 'error': return `Ошибка подключения: ${error}`;
      case 'disconnected': return 'Отключено от сервера уведомлений';
      default: return 'Неизвестный статус';
    }
  };

  return {
    // Статус подключения
    connected,
    error,
    status: getConnectionStatus(),
    statusMessage: getStatusMessage(),

    // Функции управления
    connect: manualConnect,
    disconnect: manualDisconnect,

    // WebSocket клиент (для расширенного использования)
    client,

    // Конфигурация
    config,
  };
};
