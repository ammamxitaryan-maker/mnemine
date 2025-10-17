/**
 * WebSocket сервер для real-time уведомлений
 */

const WebSocket = require('ws');
const http = require('http');
const jwt = require('jsonwebtoken');

class NotificationWebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map(); // userId -> WebSocket
    this.adminClients = new Set(); // WebSocket connections
    this.server = null;
    this.wss = null;

    this.init();
  }

  init() {
    // Создаем HTTP сервер
    this.server = http.createServer();

    // Создаем WebSocket сервер
    this.wss = new WebSocket.Server({
      server: this.server,
      verifyClient: this.verifyClient.bind(this)
    });

    this.wss.on('connection', this.handleConnection.bind(this));

    this.server.listen(this.port, () => {
      console.log(`[WEBSOCKET] Server running on port ${this.port}`);
    });
  }

  /**
   * Проверка клиента при подключении
   */
  verifyClient(info) {
    const url = new URL(info.req.url, `http://${info.req.headers.host}`);
    const token = url.searchParams.get('token');
    const userType = url.searchParams.get('type'); // 'user' или 'admin'

    if (!token) {
      console.log('[WEBSOCKET] No token provided');
      return false;
    }

    try {
      // Проверяем JWT токен
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      info.req.user = decoded;
      info.req.userType = userType;
      return true;
    } catch (error) {
      console.log('[WEBSOCKET] Invalid token:', error.message);
      return false;
    }
  }

  /**
   * Обработка нового подключения
   */
  handleConnection(ws, req) {
    const user = req.user;
    const userType = req.userType;

    console.log(`[WEBSOCKET] New connection: ${userType} - ${user.telegramId}`);

    // Сохраняем подключение
    if (userType === 'admin') {
      this.adminClients.add(ws);
      ws.userType = 'admin';
      ws.userId = user.telegramId;
    } else {
      this.clients.set(user.telegramId, ws);
      ws.userType = 'user';
      ws.userId = user.telegramId;
    }

    // Отправляем подтверждение подключения
    this.sendToClient(ws, {
      type: 'connection_established',
      message: 'Connected to notification server',
      timestamp: new Date().toISOString()
    });

    // Обработка сообщений от клиента
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(ws, message);
      } catch (error) {
        console.error('[WEBSOCKET] Error parsing message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    // Обработка отключения
    ws.on('close', () => {
      console.log(`[WEBSOCKET] Connection closed: ${userType} - ${user.telegramId}`);

      if (userType === 'admin') {
        this.adminClients.delete(ws);
      } else {
        this.clients.delete(user.telegramId);
      }
    });

    // Обработка ошибок
    ws.on('error', (error) => {
      console.error(`[WEBSOCKET] Connection error:`, error);
    });
  }

  /**
   * Обработка сообщений от клиентов
   */
  handleMessage(ws, message) {
    switch (message.type) {
      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: new Date().toISOString() });
        break;

      case 'admin_broadcast':
        if (ws.userType === 'admin') {
          this.broadcastToUsers(message.data);
        } else {
          this.sendError(ws, 'Unauthorized: Admin access required');
        }
        break;

      case 'admin_send_to_user':
        if (ws.userType === 'admin') {
          this.sendToUser(message.data.userId, message.data.notification);
        } else {
          this.sendError(ws, 'Unauthorized: Admin access required');
        }
        break;

      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  /**
   * Отправка сообщения конкретному клиенту
   */
  sendToClient(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Отправка уведомления конкретному пользователю
   */
  sendToUser(userId, notification) {
    const ws = this.clients.get(userId);
    if (ws) {
      this.sendToClient(ws, {
        type: 'notification',
        data: {
          ...notification,
          timestamp: new Date().toISOString(),
          id: this.generateId()
        }
      });
      console.log(`[WEBSOCKET] Notification sent to user ${userId}`);
    } else {
      console.log(`[WEBSOCKET] User ${userId} not connected`);
    }
  }

  /**
   * Рассылка уведомления всем пользователям
   */
  broadcastToUsers(notification) {
    const message = {
      type: 'notification',
      data: {
        ...notification,
        timestamp: new Date().toISOString(),
        id: this.generateId()
      }
    };

    let sentCount = 0;
    this.clients.forEach((ws, userId) => {
      this.sendToClient(ws, message);
      sentCount++;
    });

    console.log(`[WEBSOCKET] Broadcast sent to ${sentCount} users`);

    // Уведомляем админов о рассылке
    this.notifyAdmins({
      type: 'broadcast_sent',
      message: `Broadcast sent to ${sentCount} users`,
      data: { sentCount, notification }
    });
  }

  /**
   * Уведомление всех админов
   */
  notifyAdmins(notification) {
    const message = {
      type: 'admin_notification',
      data: {
        ...notification,
        timestamp: new Date().toISOString(),
        id: this.generateId()
      }
    };

    this.adminClients.forEach(ws => {
      this.sendToClient(ws, message);
    });
  }

  /**
   * Отправка ошибки клиенту
   */
  sendError(ws, message) {
    this.sendToClient(ws, {
      type: 'error',
      message,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Генерация уникального ID
   */
  generateId() {
    return Math.random().toString(36).substr(2, 9);
  }

  /**
   * Получение статистики подключений
   */
  getStats() {
    return {
      connectedUsers: this.clients.size,
      connectedAdmins: this.adminClients.size,
      totalConnections: this.clients.size + this.adminClients.size
    };
  }

  /**
   * Закрытие сервера
   */
  close() {
    this.wss.close();
    this.server.close();
  }
}

// Создаем экземпляр сервера
const notificationServer = new NotificationWebSocketServer(8080);

// Экспортируем для использования в других модулях
module.exports = notificationServer;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('[WEBSOCKET] Shutting down gracefully...');
  notificationServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('[WEBSOCKET] Shutting down gracefully...');
  notificationServer.close();
  process.exit(0);
});
