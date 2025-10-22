import { IncomingMessage } from 'http';
import { URL } from 'url';
import { WebSocketServer as WSWebSocketServer, WebSocket } from 'ws';
import prisma from '../prisma.js';

interface AuthenticatedWebSocket extends WebSocket {
  telegramId?: string;
  subscriptions?: Set<string>;
  isAlive?: boolean;
}

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

export class WebSocketServer {
  private wss: WSWebSocketServer;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private broadcastIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(server: any) {
    this.wss = new WSWebSocketServer({
      server,
      path: '/ws'
    });

    this.setupWebSocketServer();
    this.startBroadcastIntervals();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      console.log('[WebSocket] New connection attempt');

      // Extract path from URL
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const pathParts = url.pathname.split('/').filter(part => part.length > 0);

      console.log('[WebSocket] Connection path:', url.pathname);
      console.log('[WebSocket] Path parts:', pathParts);

      // Since all connections now use /ws, we need to determine the connection type
      // based on the query parameters or headers
      const queryParams = new URLSearchParams(url.search);
      const connectionType = queryParams.get('type') || 'earnings';

      console.log('[WebSocket] Connection type:', connectionType);

      // Route based on connection type
      switch (connectionType) {
        case 'notifications':
          this.handleNotificationConnection(ws);
          return;

        case 'userstats':
          this.handleUserStatsConnection(ws);
          return;

        case 'earnings':
        default:
          this.handleEarningsConnection(ws);
          return;
      }
    });
  }

  private async authenticateUser(ws: AuthenticatedWebSocket, telegramId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId }
      });

      if (!user) {
        ws.close(1008, 'User not found');
        return;
      }

      ws.telegramId = telegramId;
      ws.subscriptions = new Set();
      ws.isAlive = true;

      // Add to clients map
      if (!this.clients.has(telegramId)) {
        this.clients.set(telegramId, new Set());
      }
      this.clients.get(telegramId)!.add(ws);

      console.log(`[WebSocket] User ${telegramId} connected`);

      // Update user's last activity
      try {
        const { AuthService } = await import('../services/authService.js');
        await AuthService.updateLastSeen(user.id);
      } catch (error) {
        console.error('[WebSocket] Error updating user activity:', error);
      }

      // Send initial data
      await this.sendInitialData(ws, telegramId);

      // Setup message handlers
      ws.on('message', (data: any) => this.handleMessage(ws, data as Buffer));
      ws.on('close', () => this.handleDisconnect(ws, telegramId));
      ws.on('error', (error: any) => console.error(`[WebSocket] Error for user ${telegramId}:`, error));
      ws.on('pong', () => { ws.isAlive = true; });

      // Start ping interval
      const pingInterval = setInterval(() => {
        if (ws.isAlive === false) {
          clearInterval(pingInterval);
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      }, 10000);

      ws.on('close', () => clearInterval(pingInterval));

    } catch (error) {
      console.error(`[WebSocket] Authentication error for ${telegramId}:`, error);
      ws.close(1008, 'Authentication failed');
    }
  }

  private handleNotificationConnection(ws: AuthenticatedWebSocket) {
    ws.subscriptions = new Set(['notifications', 'market_data', 'price_data', 'user_stats']);
    ws.isAlive = true;

    console.log('[WebSocket] Notification client connected');

    // Send initial global data
    this.sendInitialGlobalData(ws);

    ws.on('message', (data: any) => this.handleNotificationMessage(ws, data as Buffer));
    ws.on('close', () => console.log('[WebSocket] Notification client disconnected'));
    ws.on('error', (error: any) => console.error('[WebSocket] Notification error:', error));
  }

  private handleUserStatsConnection(ws: AuthenticatedWebSocket) {
    const clientId = `userstats_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[WebSocket] User stats client connected:', clientId);

    // Set up the connection properties
    ws.telegramId = 'anonymous'; // Anonymous user for stats
    ws.subscriptions = new Set(['userstats']);
    ws.isAlive = true;
    ws.connectionId = clientId;
    ws.connectedAt = new Date();

    // Add to clients map for anonymous user
    if (!this.clients.has('anonymous')) {
      this.clients.set('anonymous', new Set());
    }
    this.clients.get('anonymous')!.add(ws);

    // Send initial user statistics
    this.sendUserStats(ws);

    ws.on('message', (data: any) => {
      try {
        const message = data.toString();
        console.log('[WebSocket] User stats message received:', message);
      } catch (error) {
        console.error('[WebSocket] Error handling user stats message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] User stats client disconnected:', clientId);
      // Remove from clients map
      const anonymousClients = this.clients.get('anonymous');
      if (anonymousClients) {
        anonymousClients.delete(ws);
        if (anonymousClients.size === 0) {
          this.clients.delete('anonymous');
        }
      }
    });

    ws.on('pong', () => {
      console.log('[WebSocket] User stats client pong received:', clientId);
      ws.isAlive = true;
    });

    // Start ping interval
    const pingInterval = setInterval(() => {
      if (ws.isAlive === false) {
        clearInterval(pingInterval);
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    }, 10000);

    ws.on('close', () => clearInterval(pingInterval));

    ws.on('error', (error) => {
      console.error('[WebSocket] User stats client error:', error);
    });
  }

  private handleEarningsConnection(ws: AuthenticatedWebSocket) {
    console.log('[WebSocket] Earnings client connected');

    ws.isAlive = true;
    ws.subscriptions = new Set(['earnings', 'slot_earnings']);

    ws.on('message', (data: any) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[WebSocket] Earnings message received:', message);

        if (message.type === 'auth' && message.telegramId) {
          // Authenticate the user
          ws.telegramId = message.telegramId;
          console.log(`[WebSocket] Earnings client authenticated for user: ${message.telegramId}`);

          // Add to clients map for this user
          if (!this.clients.has(message.telegramId)) {
            this.clients.set(message.telegramId, new Set());
          }
          this.clients.get(message.telegramId)!.add(ws);

          // Send initial earnings data
          this.sendInitialEarningsData(ws, message.telegramId);
        }
      } catch (error) {
        console.error('[WebSocket] Error handling earnings message:', error);
      }
    });

    ws.on('close', () => {
      console.log('[WebSocket] Earnings client disconnected');
      // Remove from clients map if authenticated
      if (ws.telegramId && this.clients.has(ws.telegramId)) {
        this.clients.get(ws.telegramId)!.delete(ws);
        if (this.clients.get(ws.telegramId)!.size === 0) {
          this.clients.delete(ws.telegramId);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('[WebSocket] Earnings client error:', error);
    });

    ws.on('pong', () => {
      ws.isAlive = true;
    });
  }

  private async sendInitialEarningsData(ws: AuthenticatedWebSocket, telegramId: string) {
    try {
      // Check for recovered earnings from server downtime
      const { earningsAccumulator } = await import('../services/earningsAccumulator.js');
      const recoveryInfo = await earningsAccumulator.getRecoveryInfo(telegramId);

      if (recoveryInfo.hasRecoveredEarnings) {
        this.sendToClient(ws, {
          type: 'earnings_recovered',
          data: {
            totalRecovered: recoveryInfo.totalRecovered,
            recoveryDetails: recoveryInfo.recoveryDetails,
            message: `Восстановлено ${recoveryInfo.totalRecovered.toFixed(8)} NON за время простоя сервера`
          },
          timestamp: new Date().toISOString()
        });
      }

      // Get user's current earnings data
      const userData = await this.getUserData(telegramId);
      if (userData) {
        this.sendToClient(ws, {
          type: 'earnings_update',
          data: {
            earnings: userData.accruedEarnings,
            balance: userData.balance,
            lastUpdate: userData.lastUpdate
          },
          timestamp: new Date().toISOString()
        });
      }

      // Get slots data
      const slotsData = await this.getSlotsData(telegramId);
      this.sendToClient(ws, {
        type: 'slots_data_update',
        data: slotsData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[WebSocket] Error sending initial earnings data:', error);
    }
  }

  private async sendInitialGlobalData(ws: AuthenticatedWebSocket) {
    try {
      // Send market data
      const marketData = await this.getMarketData();
      this.sendToClient(ws, {
        type: 'market_data_update',
        data: marketData,
        timestamp: new Date().toISOString()
      });

      // Send price data
      const priceData = await this.getPriceData();
      this.sendToClient(ws, {
        type: 'price_update',
        data: priceData,
        timestamp: new Date().toISOString()
      });

      // Send user statistics
      const userStats = await this.getUserStatistics();
      this.sendToClient(ws, {
        type: 'user_stats_update',
        data: userStats,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('[WebSocket] Error sending initial global data:', error);
    }
  }

  private async sendInitialData(ws: AuthenticatedWebSocket, telegramId: string) {
    try {
      // Send user data
      const userData = await this.getUserData(telegramId);
      this.sendToClient(ws, {
        type: 'user_data_update',
        data: userData,
        timestamp: new Date().toISOString()
      });

      // Send slots data
      const slotsData = await this.getSlotsData(telegramId);
      this.sendToClient(ws, {
        type: 'slots_data_update',
        data: slotsData,
        timestamp: new Date().toISOString()
      });

      // Send recent activities
      const activities = await this.getRecentActivities(telegramId);
      this.sendToClient(ws, {
        type: 'activity_update',
        data: activities,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`[WebSocket] Error sending initial data to ${telegramId}:`, error);
    }
  }

  private async handleMessage(ws: AuthenticatedWebSocket, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());

      // Update user's last activity when they send messages
      if (ws.telegramId) {
        try {
          const { AuthService } = await import('../services/authService.js');
          const user = await prisma.user.findUnique({ where: { telegramId: ws.telegramId } });
          if (user) {
            await AuthService.updateLastSeen(user.id);
          }
        } catch (error) {
          console.error('[WebSocket] Error updating user activity on message:', error);
        }
      }

      switch (message.type) {
        case 'subscribe':
          if (message.data?.types && Array.isArray(message.data.types)) {
            message.data.types.forEach((type: string) => {
              ws.subscriptions?.add(type);
            });
          }
          break;

        case 'unsubscribe':
          if (message.data?.types && Array.isArray(message.data.types)) {
            message.data.types.forEach((type: string) => {
              ws.subscriptions?.delete(type);
            });
          }
          break;

        case 'ping':
          this.sendToClient(ws, {
            type: 'pong',
            data: { timestamp: new Date().toISOString() },
            timestamp: new Date().toISOString()
          });
          break;
      }
    } catch (error) {
      console.error('[WebSocket] Error handling message:', error);
    }
  }

  private handleNotificationMessage(ws: AuthenticatedWebSocket, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'mark_read':
          // Handle marking notification as read
          break;
        case 'clear_all':
          // Handle clearing all notifications
          break;
      }
    } catch (error) {
      console.error('[WebSocket] Error handling notification message:', error);
    }
  }

  private handleDisconnect(ws: AuthenticatedWebSocket, telegramId: string) {
    console.log(`[WebSocket] User ${telegramId} disconnected`);

    if (this.clients.has(telegramId)) {
      this.clients.get(telegramId)!.delete(ws);
      if (this.clients.get(telegramId)!.size === 0) {
        this.clients.delete(telegramId);
      }
    }
  }

  private sendToClient(ws: AuthenticatedWebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private async getUserData(telegramId: string) {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        wallets: true,
        miningSlots: {
          where: { isActive: true }
        }
      }
    });

    if (!user) return null;

    const wallet = user.wallets.find(w => w.currency === 'USD');
    const balance = wallet ? wallet.balance : 0;

    // Use persisted accruedEarnings from database instead of real-time calculation
    // The client-side earnings manager handles real-time updates
    const activeSlots = user.miningSlots.filter(slot =>
      slot.isActive && new Date(slot.expiresAt) > new Date()
    );

    // Sum up the persisted accruedEarnings from all active slots
    const totalEarnings = activeSlots.reduce((sum, slot) => sum + slot.accruedEarnings, 0);

    return {
      ...user,
      balance,
      accruedEarnings: totalEarnings,
      lastUpdate: new Date().toISOString()
    };
  }

  private async getSlotsData(telegramId: string) {
    const user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) return [];

    const slots = await prisma.miningSlot.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return slots.map(slot => {
      const currentTime = new Date();
      const lastAccrued = new Date(slot.lastAccruedAt);
      const timeDiff = currentTime.getTime() - lastAccrued.getTime();
      const secondsDiff = timeDiff / 1000;

      const weeklyRate = 0.3; // Always 30% for all slots
      const earningsPerSecond = (slot.principal * weeklyRate) / (7 * 24 * 60 * 60);
      const currentEarnings = earningsPerSecond * secondsDiff;

      return {
        ...slot,
        currentEarnings,
        earningsPerSecond,
        timeRemaining: slot.isActive ?
          Math.max(0, new Date(slot.expiresAt).getTime() - currentTime.getTime()) : 0
      };
    });
  }

  private async getRecentActivities(telegramId: string) {
    const user = await prisma.user.findUnique({
      where: { telegramId }
    });

    if (!user) return [];

    return await prisma.activityLog.findMany({
      where: { userId: user.id },
      take: 10,
      orderBy: { createdAt: 'desc' }
    });
  }

  private startBroadcastIntervals() {
    // Broadcast market data every 20 seconds
    this.broadcastIntervals.set('market', setInterval(async () => {
      try {
        const marketData = await this.getMarketData();
        this.broadcastToAll({
          type: 'market_data_update',
          data: marketData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[WebSocket] Error broadcasting market data:', error);
      }
    }, 20000)); // 20 секунд

    // Broadcast user earnings every 1 minute for real-time updates (optimized frequency)
    this.broadcastIntervals.set('earnings', setInterval(async () => {
      try {
        // Only broadcast to users with active connections
        const activeUsers = Array.from(this.clients.entries()).filter(([_, clients]) => clients.size > 0);

        if (activeUsers.length === 0) return;

        const promises = activeUsers.map(async ([telegramId, clients]) => {
          try {
            const userData = await this.getUserData(telegramId);
            if (userData) {
              // Send comprehensive earnings data
              this.broadcastToUser(telegramId, {
                type: 'earnings_update',
                data: {
                  earnings: userData.accruedEarnings,
                  balance: userData.balance,
                  lastUpdate: userData.lastUpdate
                },
                timestamp: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error(`[WebSocket] Error broadcasting earnings for user ${telegramId}:`, error);
          }
        });

        await Promise.allSettled(promises);
      } catch (error) {
        console.error('[WebSocket] Error broadcasting earnings:', error);
      }
    }, 60000)); // 1 минута = 60 секунд

    // Broadcast slots data every 1 minute for each user (synchronized with earnings)
    this.broadcastIntervals.set('slots', setInterval(async () => {
      try {
        // Only broadcast to users with active connections
        const activeUsers = Array.from(this.clients.entries()).filter(([_, clients]) => clients.size > 0);

        if (activeUsers.length === 0) return;

        const promises = activeUsers.map(async ([telegramId, clients]) => {
          try {
            // Send slots data for real-time slot earnings
            const slotsData = await this.getSlotsData(telegramId);
            this.broadcastToUser(telegramId, {
              type: 'slots_data_update',
              data: slotsData,
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            console.error(`[WebSocket] Error broadcasting slots for user ${telegramId}:`, error);
          }
        });

        await Promise.allSettled(promises);
      } catch (error) {
        console.error('[WebSocket] Error broadcasting slots:', error);
      }
    }, 60000)); // 1 минута = 60 секунд

    // Broadcast price data every minute for real-time price chart
    this.broadcastIntervals.set('price', setInterval(async () => {
      try {
        const priceData = await this.getPriceData();
        this.broadcastToAll({
          type: 'price_update',
          data: priceData,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[WebSocket] Error broadcasting price data:', error);
      }
    }, 60000));

    // Broadcast user statistics every 1 minute for real-time updates
    this.broadcastIntervals.set('user_stats', setInterval(async () => {
      try {
        const userStats = await this.getUserStatistics();
        this.broadcastToAll({
          type: 'user_stats_update',
          data: userStats,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('[WebSocket] Error broadcasting user statistics:', error);
      }
    }, 60 * 1000)); // 1 minute = 60 seconds
  }

  private async getMarketData() {
    const [totalUsers, totalVolume, activeSlots] = await Promise.all([
      prisma.user.count(),
      prisma.activityLog.aggregate({
        where: {
          type: 'DEPOSIT',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        _sum: { amount: true }
      }),
      prisma.miningSlot.count({
        where: { isActive: true }
      })
    ]);

    return {
      totalUsers,
      totalVolume: totalVolume._sum.amount || 0,
      activeSlots,
      dailyChange: Math.random() * 10 - 5,
      weeklyChange: Math.random() * 20 - 10,
      monthlyChange: Math.random() * 30 - 15
    };
  }

  private async getPriceData() {
    let basePrice = 1.0;

    try {
      // Get current exchange rate
      const exchangeRate = await prisma.exchangeRate.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' }
      });

      basePrice = exchangeRate?.rate || 1.0;
    } catch (error) {
      console.warn('[WebSocket] ExchangeRate table not available, using default price');
      basePrice = 1.0;
    }

    // Simulate realistic price movements (0.8x to 1.2x of base price)
    const volatility = 0.02; // 2% volatility
    const change = (Math.random() - 0.5) * 2 * volatility;
    const currentPrice = basePrice * (1 + change);

    // Ensure price stays within reasonable bounds
    const minPrice = basePrice * 0.8;
    const maxPrice = basePrice * 1.2;
    const adjustedPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice));

    return {
      price: adjustedPrice,
      change: ((adjustedPrice - basePrice) / basePrice) * 100,
      volume: Math.random() * 1000000 + 500000,
      timestamp: new Date().toISOString()
    };
  }

  private async sendUserStats(ws: AuthenticatedWebSocket) {
    try {
      const userStats = await this.getUserStatistics();
      ws.send(JSON.stringify({
        type: 'userStats',
        data: userStats,
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('[WebSocket] Error sending user stats:', error);
    }
  }

  private async getUserStatistics() {
    try {
      // Use the new unified stats service
      const { UnifiedStatsService } = await import('../services/unifiedStatsService.js');
      const stats = await UnifiedStatsService.getUserStats();

      // Count actual WebSocket connections
      const actualOnlineUsers = this.getActualOnlineUsersCount();

      return {
        totalUsers: stats.totalUsers,
        onlineUsers: actualOnlineUsers, // Use actual connection count
        newUsersToday: stats.newUsersToday,
        activeUsers: stats.activeUsers,
        lastUpdate: stats.lastUpdate,
        isFictitious: !stats.isRealData,
        dataSource: stats.dataSource
      };
    } catch (error) {
      console.error('[WebSocket] Error getting user statistics:', error);

      // Fallback to simple calculation
      const baseTotalUsers = 10000;
      const timeVariation = Math.sin(Date.now() / (1000 * 60 * 60)) * 50;
      const totalUsers = Math.floor(baseTotalUsers + timeVariation + Math.random() * 20);

      // Count actual WebSocket connections
      const actualOnlineUsers = this.getActualOnlineUsersCount();

      return {
        totalUsers,
        onlineUsers: actualOnlineUsers, // Use actual connection count
        newUsersToday: Math.floor(totalUsers * 0.03),
        activeUsers: Math.floor(totalUsers * 0.35),
        lastUpdate: new Date().toISOString(),
        isFictitious: true,
        dataSource: 'fallback'
      };
    }
  }

  private getActualOnlineUsersCount(): number {
    let totalConnections = 0;
    this.clients.forEach((userConnections) => {
      totalConnections += userConnections.size;
    });
    
    console.log('[WebSocket] Total clients map size:', this.clients.size);
    console.log('[WebSocket] Total connections:', totalConnections);
    console.log('[WebSocket] Clients map:', Array.from(this.clients.entries()).map(([key, connections]) => ({ user: key, count: connections.size })));
    
    // Ensure minimum of 1 online user for display purposes
    return Math.max(1, totalConnections);
  }

  private broadcastToAll(message: WebSocketMessage) {
    this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Check if client is subscribed to this type of message
        const messageType = message.type.replace('_update', '');
        if (ws.subscriptions?.has(messageType) || ws.subscriptions?.has('notifications')) {
          ws.send(JSON.stringify(message));
        }
      }
    });
  }

  private broadcastToUser(telegramId: string, message: WebSocketMessage) {
    const clients = this.clients.get(telegramId);
    if (clients) {
      clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message));
        }
      });
    }
  }

  // Public method to broadcast balance updates
  public async broadcastBalanceUpdate(telegramId: string, balanceData: any) {
    try {
      const message: WebSocketMessage = {
        type: 'BALANCE_UPDATED',
        data: balanceData,
        timestamp: new Date().toISOString()
      };

      this.broadcastToUser(telegramId, message);
      console.log(`[WebSocket] Balance update broadcasted to user ${telegramId}:`, balanceData);
    } catch (error) {
      console.error(`[WebSocket] Error broadcasting balance update to user ${telegramId}:`, error);
    }
  }

  // Public method to broadcast slot updates
  public async broadcastSlotUpdate(telegramId: string, slotData: any) {
    try {
      const message: WebSocketMessage = {
        type: 'SLOT_UPDATE',
        data: slotData,
        timestamp: new Date().toISOString()
      };

      this.broadcastToUser(telegramId, message);
      console.log(`[WebSocket] Slot update broadcasted to user ${telegramId}:`, slotData);
    } catch (error) {
      console.error(`[WebSocket] Error broadcasting slot update to user ${telegramId}:`, error);
    }
  }

  public sendNotification(telegramId: string, notification: any) {
    this.broadcastToUser(telegramId, {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  public broadcastNotification(notification: any) {
    this.broadcastToAll({
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString()
    });
  }

  public sendToUser(telegramId: string, eventType: string, data: any) {
    this.broadcastToUser(telegramId, {
      type: eventType,
      data: data,
      timestamp: new Date().toISOString()
    });
  }

  public async broadcastEarningsUpdate(telegramId: string, earningsData: any) {
    try {
      const message: WebSocketMessage = {
        type: 'EARNINGS_UPDATE',
        data: earningsData,
        timestamp: new Date().toISOString()
      };

      this.broadcastToUser(telegramId, message);
    } catch (error) {
      console.error('[WebSocketServer] Error broadcasting earnings update:', error);
    }
  }

  public getConnectedUsers(): string[] {
    return Array.from(this.clients.keys());
  }

  public getConnectionCount(): number {
    return Array.from(this.clients.values()).reduce((total, clients) => total + clients.size, 0);
  }

  public close() {
    this.broadcastIntervals.forEach(interval => clearInterval(interval));
    this.wss.close();
  }
}


