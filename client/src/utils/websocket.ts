/**
 * WebSocket клиент для real-time уведомлений
 */

import { useEffect, useState } from 'react';
import { useLogger } from './logger';

// Типы сообщений
export interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
  timestamp?: string;
  id?: string;
}

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  persistent?: boolean;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  token: string;
  userType: 'user' | 'admin';
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  pingInterval?: number;
}

class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private logger = useLogger();

  // Callbacks
  private onMessageCallback: ((message: WebSocketMessage) => void) | null = null;
  private onNotificationCallback: ((notification: NotificationData) => void) | null = null;
  private onConnectionChangeCallback: ((connected: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      pingInterval: 30000,
      ...config,
    };
  }

  /**
   * Подключение к WebSocket серверу
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isConnected()) {
        resolve();
        return;
      }

      this.isConnecting = true;
      const wsUrl = `${this.config.url}?token=${this.config.token}&type=${this.config.userType}`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('[WEBSOCKET] Connected to server');
          this.logger.info('WebSocket connected', 'SYSTEM');

          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.onConnectionChangeCallback?.(true);

          // Запускаем ping
          this.startPing();

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WEBSOCKET] Error parsing message:', error);
            this.logger.error('WebSocket message parsing error', error as Error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('[WEBSOCKET] Connection closed:', event.code, event.reason);
          this.logger.info(`WebSocket disconnected: ${event.code} ${event.reason}`, 'SYSTEM');

          this.isConnecting = false;
          this.onConnectionChangeCallback?.(false);
          this.stopPing();

          // Автоматическое переподключение
          if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WEBSOCKET] Connection error:', error);
          this.logger.error('WebSocket connection error', error as any);

          this.isConnecting = false;
          this.onErrorCallback?.('Connection failed');
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        this.logger.error('WebSocket connection failed', error as Error);
        reject(error);
      }
    });
  }

  /**
   * Отключение от сервера
   */
  disconnect(): void {
    this.stopPing();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.onConnectionChangeCallback?.(false);
  }

  /**
   * Отправка сообщения на сервер
   */
  send(message: WebSocketMessage): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify(message));
      this.logger.debug(`WebSocket message sent: ${message.type}`, 'SYSTEM');
    } else {
      console.warn('[WEBSOCKET] Cannot send message: not connected');
      this.logger.warn('WebSocket message not sent: not connected', 'SYSTEM');
    }
  }

  /**
   * Отправка ping
   */
  ping(): void {
    this.send({ type: 'ping' });
  }

  /**
   * Проверка подключения
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Обработка входящих сообщений
   */
  private handleMessage(message: WebSocketMessage): void {
    this.logger.debug(`WebSocket message received: ${message.type}`, 'SYSTEM');

    switch (message.type) {
      case 'pong':
        // Ответ на ping
        break;

      case 'notification':
        if (message.data) {
          this.onNotificationCallback?.(message.data);
        }
        break;

      case 'admin_notification':
        if (message.data) {
          this.onNotificationCallback?.(message.data);
        }
        break;

      case 'connection_established':
        console.log('[WEBSOCKET] Connection established:', message.message);
        break;

      case 'error':
        console.error('[WEBSOCKET] Server error:', message.message);
        this.onErrorCallback?.(message.message || 'Unknown error');
        break;

      default:
        // Передаем все остальные сообщения в callback
        this.onMessageCallback?.(message);
    }
  }

  /**
   * Запуск ping
   */
  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.ping();
    }, this.config.pingInterval);
  }

  /**
   * Остановка ping
   */
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Планирование переподключения
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WEBSOCKET] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.logger.info(`WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`, 'SYSTEM');

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        console.error('[WEBSOCKET] Reconnect failed:', error);
        this.logger.error('WebSocket reconnect failed', error as Error);
      });
    }, delay);
  }

  /**
   * Очистка таймера переподключения
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // Callback setters
  onMessage(callback: (message: WebSocketMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onNotification(callback: (notification: NotificationData) => void): void {
    this.onNotificationCallback = callback;
  }

  onConnectionChange(callback: (connected: boolean) => void): void {
    this.onConnectionChangeCallback = callback;
  }

  onError(callback: (error: string) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * Получение статистики подключения
   */
  getStats() {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      config: this.config,
    };
  }
}

// Хук для использования WebSocket в React компонентах
export const useWebSocket = (config: WebSocketConfig) => {
  const [client] = useState(() => new WebSocketClient(config));
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Настраиваем callbacks
    client.onConnectionChange(setConnected);
    client.onError(setError);

    // Подключаемся
    client.connect().catch(err => {
      console.error('[WEBSOCKET] Initial connection failed:', err);
      setError('Connection failed');
    });

    // Очистка при размонтировании
    return () => {
      client.disconnect();
    };
  }, []);

  return {
    client,
    connected,
    error,
    send: client.send.bind(client),
    disconnect: client.disconnect.bind(client),
    connect: client.connect.bind(client),
    isConnected: client.isConnected.bind(client),
  };
};

export default WebSocketClient;
