/**
 * WebSocket клиент для real-time уведомлений
 */

import { useEffect, useState } from 'react';
import { LogCategory } from './logger';

// Типы сообщений
export interface WebSocketMessage {
  type: string;
  data?: unknown;
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
  userType: 'user' | 'admin' | 'notifications' | 'earnings' | 'userstats';
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
  private logger = {
    info: (message: string, ...args: unknown[]) => console.log(`[WebSocket] ${message}`, ...args),
    warn: (message: string, ...args: unknown[]) => console.warn(`[WebSocket] ${message}`, ...args),
    error: (message: string, ...args: unknown[]) => console.error(`[WebSocket] ${message}`, ...args),
    debug: (message: string, ...args: unknown[]) => console.log(`[WebSocket] ${message}`, ...args)
  };

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
      // Fix URL construction to avoid duplicate parameters
      const separator = this.config.url.includes('?') ? '&' : '?';
      const wsUrl = `${this.config.url}${separator}token=${this.config.token}&type=${this.config.userType}`;

      console.log('[WEBSOCKET] Attempting to connect to:', wsUrl);

      // Direct WebSocket connection attempt without server reachability check
      this.attemptWebSocketConnection(wsUrl, resolve, reject);
    });
  }


  /**
   * Attempt WebSocket connection
   */
  private attemptWebSocketConnection(wsUrl: string, resolve: () => void, reject: (error: any) => void): void {
    try {
      // Check if WebSocket is available
      if (typeof WebSocket === 'undefined') {
        throw new Error('WebSocket is not supported in this environment');
      }

      // Add connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
          console.error('[WEBSOCKET] Connection timeout');
          try {
            this.ws.close();
          } catch (closeError) {
            console.error('[WEBSOCKET] Error closing timed out connection:', closeError);
          }
          this.isConnecting = false;
          reject(new Error('Connection timeout'));
        }
      }, 15000); // 15 second timeout

      // Create WebSocket immediately without delay
      try {
        this.ws = new WebSocket(wsUrl);
      } catch (error) {
        clearTimeout(connectionTimeout);
        this.isConnecting = false;
        reject(error);
        return;
      }

      // Set up event handlers after WebSocket is created
      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('[WEBSOCKET] Connected to server');
        this.logger.info('WebSocket connected', LogCategory.SYSTEM);

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
        clearTimeout(connectionTimeout);
        console.log('[WEBSOCKET] Connection closed:', event.code, event.reason);
        this.logger.info(`WebSocket disconnected: ${event.code} ${event.reason}`, LogCategory.SYSTEM);

        this.isConnecting = false;
        this.onConnectionChangeCallback?.(false);
        this.stopPing();

        // Автоматическое переподключение
        if (!event.wasClean && this.reconnectAttempts < this.config.maxReconnectAttempts!) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (error) => {
        clearTimeout(connectionTimeout);

        // Only log errors occasionally to avoid spam
        const now = Date.now();
        const lastErrorTime = localStorage.getItem('lastWebSocketError');
        const timeSinceLastError = lastErrorTime ? now - parseInt(lastErrorTime) : Infinity;

        if (timeSinceLastError > 10000) { // Only log every 10 seconds
          // Log more detailed error information with null checks
          const errorDetails = {
            readyState: this.ws?.readyState ?? 'unknown',
            url: this.ws?.url ?? 'unknown',
            protocol: this.ws?.protocol ?? 'unknown',
            extensions: this.ws?.extensions ?? 'unknown',
            bufferedAmount: this.ws?.bufferedAmount ?? 'unknown',
            timestamp: new Date().toISOString()
          };

          // Check for specific error types
          let errorMessage = 'WebSocket connection error';
          if (error && typeof error === 'object' && 'type' in error) {
            if (error.type === 'error') {
              errorMessage = 'WebSocket connection failed - server may be unreachable';
            }
          }

          console.error('[WEBSOCKET] Connection error:', error, errorDetails);
          this.logger.error(errorMessage, new Error(JSON.stringify({ error, details: errorDetails })));
          localStorage.setItem('lastWebSocketError', now.toString());
        }

        this.isConnecting = false;
        this.onErrorCallback?.('Connection failed');

        // Don't reject immediately, let the onclose handler manage reconnection
        if (this.reconnectAttempts === 0) {
          reject(error);
        }
      };

    } catch (error) {
      this.isConnecting = false;
      this.logger.error('WebSocket connection failed', error as Error);
      reject(error);
    }
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
      this.logger.debug(`WebSocket message sent: ${message.type}`, { messageType: message.type });
    } else {
      console.warn('[WEBSOCKET] Cannot send message: not connected');
      this.logger.warn('WebSocket message not sent: not connected', LogCategory.SYSTEM);
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
    this.logger.debug(`WebSocket message received: ${message.type}`, { messageType: message.type });

    switch (message.type) {
      case 'pong':
        // Ответ на ping
        break;

      case 'notification':
        if (message.data) {
          this.onNotificationCallback?.(message.data as any);
        }
        break;

      case 'admin_notification':
        if (message.data) {
          this.onNotificationCallback?.(message.data as any);
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
    const delay = Math.min(
      this.config.reconnectInterval! * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Max delay of 30 seconds
    );

    // Only log reconnection attempts occasionally
    const now = Date.now();
    const lastReconnectTime = localStorage.getItem('lastWebSocketReconnect');
    const timeSinceLastReconnect = lastReconnectTime ? now - parseInt(lastReconnectTime) : Infinity;

    if (timeSinceLastReconnect > 15000) { // Only log every 15 seconds
      console.log(`[WEBSOCKET] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      this.logger.info(`WebSocket reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`, LogCategory.SYSTEM);
      localStorage.setItem('lastWebSocketReconnect', now.toString());
    }

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        // Only log reconnection failures occasionally
        const now = Date.now();
        const lastReconnectFailTime = localStorage.getItem('lastWebSocketReconnectFail');
        const timeSinceLastReconnectFail = lastReconnectFailTime ? now - parseInt(lastReconnectFailTime) : Infinity;

        if (timeSinceLastReconnectFail > 20000) { // Only log every 20 seconds
          console.error('[WEBSOCKET] Reconnect failed:', error);
          this.logger.error('WebSocket reconnect failed', error as Error);
          localStorage.setItem('lastWebSocketReconnectFail', now.toString());
        }

        // If we've exceeded max attempts, stop trying
        if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
          this.logger.error('WebSocket max reconnection attempts reached', new Error('Max attempts exceeded'));
        }
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
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Создаем новый клиент при изменении конфигурации
    const newClient = new WebSocketClient(config);
    setClient(newClient);

    // Настраиваем callbacks
    newClient.onConnectionChange(setConnected);
    newClient.onError(setError);

    // Подключаемся только если у нас есть валидный токен
    if (config.token && config.token !== 'anonymous') {
      newClient.connect().catch(err => {
        console.error('[WEBSOCKET] Initial connection failed:', err);
        setError('Connection failed');
      });
    } else {
      console.log('[WEBSOCKET] Skipping connection - no valid token available');
    }

    // Очистка при размонтировании или изменении конфигурации
    return () => {
      newClient.disconnect();
    };
  }, [config.url, config.token, config.userType]); // Пересоздаем клиент при изменении ключевых параметров

  return {
    client: client!,
    connected,
    error,
    send: client?.send.bind(client) || (() => { }),
    disconnect: client?.disconnect.bind(client) || (() => { }),
    connect: client?.connect.bind(client) || (() => Promise.resolve()),
    isConnected: client?.isConnected.bind(client) || (() => false),
  };
};

export default WebSocketClient;
