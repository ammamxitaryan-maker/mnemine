import { WebSocketServer as WSWebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { URL } from 'url';
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
      
      // Extract telegramId from URL
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const pathParts = url.pathname.split('/');
      const telegramId = pathParts[pathParts.length - 1];

      if (!telegramId || telegramId === 'notifications') {
        // Handle notification connections
        this.handleNotificationConnection(ws);
        return;
      }

      // Authenticate user
      this.authenticateUser(ws, telegramId);
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

  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer) {
    try {
      const message = JSON.parse(data.toString());
      
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

    // Calculate real-time earnings (this is for display only, actual earnings are persisted by the processor)
    const activeSlots = user.miningSlots.filter(slot => 
      slot.isActive && new Date(slot.expiresAt) > new Date()
    );

    // Calculate earnings directly from user data for better performance
    const currentTime = new Date();
    let totalEarnings = 0;
    
    for (const slot of activeSlots) {
      const timeElapsedMs = currentTime.getTime() - slot.lastAccruedAt.getTime();
      if (timeElapsedMs > 0) {
        const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
        const earnings = earningsPerSecond * (timeElapsedMs / 1000);
        totalEarnings += earnings;
      }
    }

    return {
      ...user,
      balance,
      accruedEarnings: totalEarnings,
      lastUpdate: currentTime.toISOString()
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
    // Broadcast market data every 10 seconds
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
    }, 10000));

    // Broadcast user earnings every 10 seconds for real-time updates
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

              // Also send slots data for real-time slot earnings
              const slotsData = await this.getSlotsData(telegramId);
              this.broadcastToUser(telegramId, {
                type: 'slots_data_update',
                data: slotsData,
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
    }, 10000));

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

    // Broadcast user statistics every 5 minutes
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
    }, 5 * 60 * 1000));
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

  private async getUserStatistics() {
    // Use consistent fictitious data for all users
    // This ensures all users see the same statistics
    const baseTotalUsers = 1250; // Base number of users
    const timeVariation = Math.sin(Date.now() / (1000 * 60 * 60)) * 50; // Hourly variation
    const totalUsers = Math.floor(baseTotalUsers + timeVariation + Math.random() * 20);
    
    // Online users: 8-15% of total users with realistic variation
    const onlinePercentage = 0.08 + (Math.random() * 0.07); // 8-15%
    const onlineUsers = Math.floor(totalUsers * onlinePercentage);
    
    // New users today: 2-5% of total users
    const newUsersToday = Math.floor(totalUsers * (0.02 + Math.random() * 0.03));
    
    // Active users: 25-40% of total users
    const activeUsers = Math.floor(totalUsers * (0.25 + Math.random() * 0.15));

    return {
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      lastUpdate: new Date().toISOString(),
      isFictitious: true // Flag to indicate this is fictitious data
    };
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
        type: 'BALANCE_UPDATE',
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


