import { WebSocket } from 'ws';
import { logger } from '../utils/logger.js';
import { UserStatsService } from './userStatsService.js';

interface ConnectedClient {
  ws: WebSocket;
  id: string;
  lastPing: number;
}

export class UserStatsWebSocketService {
  private static clients: Map<string, ConnectedClient> = new Map();
  private static broadcastInterval: NodeJS.Timeout | null = null;
  private static pingInterval: NodeJS.Timeout | null = null;
  private static isInitialized = false;

  /**
   * Инициализация WebSocket сервиса для статистики пользователей
   */
  static initialize() {
    if (this.isInitialized) {
      return;
    }

    this.startBroadcastTimer();
    this.startPingTimer();
    this.isInitialized = true;

    logger.server('UserStatsWebSocketService initialized');
  }

  /**
   * Добавление нового клиента
   */
  static addClient(ws: WebSocket, clientId: string) {
    const client: ConnectedClient = {
      ws,
      id: clientId,
      lastPing: Date.now()
    };

    this.clients.set(clientId, client);

    // Отправляем текущую статистику новому клиенту
    this.sendStatsToClient(clientId);

    logger.debug(`User stats client connected: ${clientId}. Total clients: ${this.clients.size}`);
  }

  /**
   * Удаление клиента
   */
  static removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.ws.close();
      this.clients.delete(clientId);
      logger.debug(`User stats client disconnected: ${clientId}. Total clients: ${this.clients.size}`);
    }
  }

  /**
   * Отправка статистики конкретному клиенту
   */
  private static sendStatsToClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const stats = UserStatsService.getCurrentStats();
      const message = {
        type: 'userStats',
        data: {
          ...stats,
          timestamp: Date.now()
        }
      };

      client.ws.send(JSON.stringify(message));
    } catch (error) {
      logger.error(`Error sending stats to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  /**
   * Рассылка статистики всем подключенным клиентам
   */
  private static broadcastStats() {
    if (this.clients.size === 0) {
      return;
    }

    const stats = UserStatsService.getCurrentStats();
    const message = {
      type: 'userStats',
      data: {
        ...stats,
        timestamp: Date.now()
      }
    };

    const messageString = JSON.stringify(message);
    const disconnectedClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.send(messageString);
        } else {
          disconnectedClients.push(clientId);
        }
      } catch (error) {
        logger.error(`Error broadcasting to client ${clientId}:`, error);
        disconnectedClients.push(clientId);
      }
    });

    // Удаляем отключенных клиентов
    disconnectedClients.forEach(clientId => {
      this.removeClient(clientId);
    });

    if (this.clients.size > 0) {
      logger.debug(`Broadcasted user stats to ${this.clients.size} clients`);
    }
  }

  /**
   * Запуск таймера рассылки статистики
   */
  private static startBroadcastTimer() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
    }

    // Рассылаем статистику каждые 30 секунд
    this.broadcastInterval = setInterval(() => {
      this.broadcastStats();
    }, 30 * 1000);
  }

  /**
   * Запуск таймера ping для проверки соединений
   */
  private static startPingTimer() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Ping каждые 60 секунд
    this.pingInterval = setInterval(() => {
      this.pingClients();
    }, 60 * 1000);
  }

  /**
   * Ping всех клиентов для проверки соединений
   */
  private static pingClients() {
    const now = Date.now();
    const disconnectedClients: string[] = [];

    this.clients.forEach((client, clientId) => {
      try {
        if (client.ws.readyState === WebSocket.OPEN) {
          // Отправляем ping
          client.ws.ping();
          client.lastPing = now;
        } else {
          disconnectedClients.push(clientId);
        }
      } catch (error) {
        logger.error(`Error pinging client ${clientId}:`, error);
        disconnectedClients.push(clientId);
      }
    });

    // Удаляем отключенных клиентов
    disconnectedClients.forEach(clientId => {
      this.removeClient(clientId);
    });
  }

  /**
   * Обработка pong от клиента
   */
  static handlePong(clientId: string) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
    }
  }

  /**
   * Обработка сообщения от клиента
   */
  static handleMessage(clientId: string, message: any) {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'pong':
          this.handlePong(clientId);
          break;
        case 'requestStats':
          this.sendStatsToClient(clientId);
          break;
        default:
          logger.debug(`Unknown message type from client ${clientId}: ${data.type}`);
      }
    } catch (error) {
      logger.error(`Error handling message from client ${clientId}:`, error);
    }
  }

  /**
   * Получение количества подключенных клиентов
   */
  static getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Остановка сервиса
   */
  static stop() {
    if (this.broadcastInterval) {
      clearInterval(this.broadcastInterval);
      this.broadcastInterval = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    // Закрываем все соединения
    this.clients.forEach((client) => {
      client.ws.close();
    });
    this.clients.clear();

    this.isInitialized = false;
    logger.server('UserStatsWebSocketService stopped');
  }
}
