/**
 * Хук для интеграции WebSocket с системой уведомлений
 */

import { useNotifications } from '@/components/admin/AdminNotifications';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { LogCategory, useLogger } from '@/utils/logger';
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
  const { user, loading } = useTelegramAuth();
  const { addNotification } = useNotifications();
  const logger = useLogger();
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // WebSocket подключение для пользователей
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';
  const wsUrl = backendUrl.replace('http', 'ws') + '/ws';

  // Only create WebSocket connection when user is authenticated and not loading
  const shouldConnect = !loading && user?.telegramId && config.enabled;

  const { client, connected, error, connect, disconnect } = useWebSocket({
    url: wsUrl,
    token: user?.telegramId || 'anonymous', // В реальном приложении использовать JWT
    userType: 'notifications' as const,
  });

  // Автоматическое подключение
  useEffect(() => {
    if (config.enabled && config.autoConnect && user?.telegramId) {
      // Check if WebSocket connections are disabled due to repeated failures
      const wsDisabled = localStorage.getItem('websocketDisabled');
      const wsDisabledTime = wsDisabled ? parseInt(wsDisabled) : 0;
      const timeSinceDisabled = Date.now() - wsDisabledTime;

      // Re-enable WebSocket after 5 minutes
      if (timeSinceDisabled > 300000) {
        localStorage.removeItem('websocketDisabled');
      }

      if (wsDisabled && timeSinceDisabled <= 300000) {
        console.log('[WebSocketNotifications] WebSocket connections disabled due to repeated failures');
        return;
      }

      // Add a shorter delay since we removed the server reachability check
      const timeoutId = setTimeout(() => {
        connect().catch(err => {
          // Only log connection errors occasionally
          const now = Date.now();
          const lastConnectErrorTime = localStorage.getItem('lastWebSocketConnectError');
          const timeSinceLastConnectError = lastConnectErrorTime ? now - parseInt(lastConnectErrorTime) : Infinity;

          if (timeSinceLastConnectError > 15000) { // Only log every 15 seconds
            logger.error('Failed to connect to WebSocket', err as Error);
            localStorage.setItem('lastWebSocketConnectError', now.toString());

            // Disable WebSocket connections if we have too many failures
            const failureCount = parseInt(localStorage.getItem('websocketFailureCount') || '0') + 1;
            localStorage.setItem('websocketFailureCount', failureCount.toString());

            if (failureCount >= 5) {
              localStorage.setItem('websocketDisabled', now.toString());
              localStorage.removeItem('websocketFailureCount');
              console.log('[WebSocketNotifications] Disabling WebSocket connections due to repeated failures');
            }
          }
        });
      }, 1000); // 1 second delay

      return () => {
        clearTimeout(timeoutId);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };
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
        logger.info('Window focused, attempting to reconnect WebSocket', LogCategory.SYSTEM);
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
    if (!client) return;

    const handleNotification = (notification: NotificationData) => {
      logger.info('WebSocket notification received', LogCategory.SYSTEM, {
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

    // Обработка WebSocket сообщений для баланса
    client.onMessage((message) => {
      console.log('[WebSocket] Received message:', message);

      if (message.type === 'BALANCE_UPDATED' && message.data) {
        console.log('[WebSocket] Balance updated:', message.data);
        // Dispatch custom event for balance updates
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
          detail: {
            telegramId: (message.data as any).telegramId,
            newBalance: (message.data as any).newBalance,
            previousBalance: (message.data as any).previousBalance,
            changeAmount: (message.data as any).changeAmount,
            action: (message.data as any).action,
            timestamp: (message.data as any).timestamp,
            currency: (message.data as any).currency
          }
        }));

        // Also dispatch userDataRefresh event
        window.dispatchEvent(new CustomEvent('userDataRefresh', {
          detail: { telegramId: (message.data as any).telegramId }
        }));
      }

      if (message.type === 'USER_DATA_UPDATED' && message.data) {
        console.log('[WebSocket] User data updated:', message.data);
        // Dispatch userDataUpdated event
        window.dispatchEvent(new CustomEvent('userDataUpdated', {
          detail: { telegramId: (message.data as any).telegramId }
        }));
      }

      if (message.type === 'SLOT_UPDATE' && message.data) {
        console.log('[WebSocket] Slot updated:', message.data);
        // Dispatch slot update event
        window.dispatchEvent(new CustomEvent('slotUpdated', {
          detail: {
            telegramId: (message.data as any).telegramId,
            slotId: (message.data as any).slotId,
            action: (message.data as any).action
          }
        }));
      }
    });

    return () => {
      // Очистка обработчика
    };
  }, [client, addNotification, logger]);

  // Обработка ошибок подключения
  useEffect(() => {
    if (error) {
      // Only log WebSocket errors occasionally to avoid spam
      const now = Date.now();
      const lastErrorTime = localStorage.getItem('lastWebSocketError');
      const timeSinceLastError = lastErrorTime ? now - parseInt(lastErrorTime) : Infinity;

      if (timeSinceLastError > 30000) { // Only log every 30 seconds
        // Log more detailed error information
        const errorDetails = {
          message: error,
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
        logger.error('WebSocket connection error', new Error(JSON.stringify(errorDetails)), LogCategory.SYSTEM);
        localStorage.setItem('lastWebSocketError', now.toString());
      }

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
      logger.info('WebSocket connected successfully', LogCategory.SYSTEM);

      // Reset failure count on successful connection
      localStorage.removeItem('websocketFailureCount');
      localStorage.removeItem('websocketDisabled');

      // Убираем уведомления об ошибках подключения
      // (в реальном приложении можно добавить логику для удаления конкретных уведомлений)
    } else if (user?.telegramId) {
      logger.warn('WebSocket disconnected', LogCategory.SYSTEM);
    }
  }, [connected, user?.telegramId, logger]);

  // Запрос разрешения на уведомления
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        logger.info(`Notification permission: ${permission}`, LogCategory.SYSTEM);
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
    logger.info('WebSocket manually disconnected', LogCategory.SYSTEM);
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
