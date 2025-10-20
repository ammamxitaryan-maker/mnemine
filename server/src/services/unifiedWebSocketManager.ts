import { EventEmitter } from 'events';
import { IncomingMessage } from 'http';
import { URL } from 'url';
import { WebSocketServer as WSWebSocketServer, WebSocket } from 'ws';
import prisma from '../prisma.js';

interface AuthenticatedWebSocket extends WebSocket {
  telegramId?: string;
  subscriptions?: Set<string>;
  isAlive?: boolean;
  connectionId?: string;
  lastPingAt?: Date;
  connectedAt?: Date;
}

interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: string;
}

interface ConnectionPool {
  maxConnections: number;
  maxConnectionsPerUser: number;
  connectionTimeout: number;
  pingInterval: number;
  pongTimeout: number;
}

interface WebSocketStats {
  totalConnections: number;
  activeConnections: number;
  usersOnline: number;
  connectionsByUser: Map<string, number>;
  subscriptions: Map<string, number>;
  averageConnectionDuration: number;
  connectionHistory: Array<{ timestamp: Date; action: 'connect' | 'disconnect'; telegramId: string }>;
}

export class UnifiedWebSocketManager extends EventEmitter {
  private static instance: UnifiedWebSocketManager;
  private wss: WSWebSocketServer | null = null;
  private clients: Map<string, Set<AuthenticatedWebSocket>> = new Map();
  private connectionPool: Map<string, AuthenticatedWebSocket> = new Map();
  private stats: WebSocketStats;
  private poolConfig: ConnectionPool;
  private pingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private broadcastIntervals: Map<string, NodeJS.Timeout> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    super();
    this.poolConfig = {
      maxConnections: 1000,
      maxConnectionsPerUser: 3,
      connectionTimeout: 30000, // 30 seconds
      pingInterval: 10000, // 10 seconds
      pongTimeout: 5000, // 5 seconds
    };

    this.stats = {
      totalConnections: 0,
      activeConnections: 0,
      usersOnline: 0,
      connectionsByUser: new Map(),
      subscriptions: new Map(),
      averageConnectionDuration: 0,
      connectionHistory: [],
    };

    this.startCleanupInterval();
  }

  public static getInstance(): UnifiedWebSocketManager {
    if (!UnifiedWebSocketManager.instance) {
      UnifiedWebSocketManager.instance = new UnifiedWebSocketManager();
    }
    return UnifiedWebSocketManager.instance;
  }

  /**
   * Initialize WebSocket server with connection pooling
   */
  public initialize(server: any): void {
    if (this.wss) {
      console.warn('[WebSocket] Server already initialized');
      return;
    }

    this.wss = new WSWebSocketServer({
      server,
      path: '/ws',
      maxPayload: 1024 * 1024, // 1MB max payload
      perMessageDeflate: {
        threshold: 1024,
        concurrencyLimit: 10,
        // memLevel: 7, // Not supported in this version
      },
    });

    this.setupWebSocketServer();
    this.startBroadcastIntervals();
    console.log('[WebSocket] Unified WebSocket manager initialized with connection pooling');
  }

  /**
   * Setup WebSocket server with optimized connection handling
   */
  private setupWebSocketServer(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: AuthenticatedWebSocket, request: IncomingMessage) => {
      this.handleNewConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      console.error('[WebSocket] Server error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Handle new WebSocket connection with pooling logic
   */
  private async handleNewConnection(ws: AuthenticatedWebSocket, request: IncomingMessage): Promise<void> {
    try {
      // Check connection pool limits
      if (this.stats.totalConnections >= this.poolConfig.maxConnections) {
        console.warn('[WebSocket] Connection pool limit reached, rejecting connection');
        ws.close(1013, 'Server overloaded');
        return;
      }

      // Extract telegramId from URL
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const pathParts = url.pathname.split('/');
      const telegramId = pathParts[pathParts.length - 1];

      if (!telegramId || telegramId === 'notifications') {
        this.handleNotificationConnection(ws);
        return;
      }

      // Check per-user connection limit
      const userConnections = this.clients.get(telegramId)?.size || 0;
      if (userConnections >= this.poolConfig.maxConnectionsPerUser) {
        console.warn(`[WebSocket] User ${telegramId} has reached connection limit`);
        ws.close(1008, 'Too many connections');
        return;
      }

      await this.authenticateAndRegisterUser(ws, telegramId);
    } catch (error) {
      console.error('[WebSocket] Connection handling error:', error);
      ws.close(1011, 'Internal server error');
    }
  }

  /**
   * Authenticate user and register connection with pooling
   */
  private async authenticateAndRegisterUser(ws: AuthenticatedWebSocket, telegramId: string): Promise<void> {
    try {
      // Quick user validation
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: { id: true, telegramId: true, isActive: true }
      });

      if (!user || !user.isActive) {
        ws.close(1008, 'User not found or inactive');
        return;
      }

      // Generate unique connection ID
      const connectionId = `${telegramId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Setup connection metadata
      ws.telegramId = telegramId;
      ws.connectionId = connectionId;
      ws.subscriptions = new Set();
      ws.isAlive = true;
      ws.connectedAt = new Date();
      ws.lastPingAt = new Date();

      // Add to connection pool
      this.connectionPool.set(connectionId, ws);

      // Add to clients map
      if (!this.clients.has(telegramId)) {
        this.clients.set(telegramId, new Set());
      }
      this.clients.get(telegramId)!.add(ws);

      // Update statistics
      this.updateStats('connect', telegramId);

      console.log(`[WebSocket] User ${telegramId} connected (${this.clients.get(telegramId)!.size} connections)`);

      // Setup connection handlers
      this.setupConnectionHandlers(ws, telegramId, connectionId);

      // Send initial data
      await this.sendInitialData(ws, telegramId);

      // Start ping interval
      this.startPingInterval(ws, connectionId);

    } catch (error) {
      console.error(`[WebSocket] Authentication error for ${telegramId}:`, error);
      ws.close(1008, 'Authentication failed');
    }
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(ws: AuthenticatedWebSocket, telegramId: string, connectionId: string): void {
    ws.on('message', (data: Buffer) => this.handleMessage(ws, data));
    ws.on('close', () => this.handleDisconnect(ws, telegramId, connectionId));
    ws.on('error', (error) => {
      console.error(`[WebSocket] Error for user ${telegramId}:`, error);
      this.handleDisconnect(ws, telegramId, connectionId);
    });
    ws.on('pong', () => {
      ws.isAlive = true;
      ws.lastPingAt = new Date();
    });
  }

  /**
   * Start ping interval for connection health monitoring
   */
  private startPingInterval(ws: AuthenticatedWebSocket, connectionId: string): void {
    const interval = setInterval(() => {
      if (ws.isAlive === false) {
        console.log(`[WebSocket] Connection ${connectionId} timed out`);
        clearInterval(interval);
        this.pingIntervals.delete(connectionId);
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    }, this.poolConfig.pingInterval);

    this.pingIntervals.set(connectionId, interval);
  }

  /**
   * Handle WebSocket message with optimized routing
   */
  private handleMessage(ws: AuthenticatedWebSocket, data: Buffer): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'subscribe':
          this.handleSubscription(ws, message.data as string);
          break;
        case 'unsubscribe':
          this.handleUnsubscription(ws, message.data as string);
          break;
        case 'ping':
          this.handlePing(ws);
          break;
        default:
          console.warn(`[WebSocket] Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('[WebSocket] Message parsing error:', error);
    }
  }

  /**
   * Handle subscription requests
   */
  private handleSubscription(ws: AuthenticatedWebSocket, subscription: string): void {
    if (ws.subscriptions) {
      ws.subscriptions.add(subscription);
      this.updateSubscriptionStats(subscription, 1);
      console.log(`[WebSocket] User ${ws.telegramId} subscribed to ${subscription}`);
    }
  }

  /**
   * Handle unsubscription requests
   */
  private handleUnsubscription(ws: AuthenticatedWebSocket, subscription: string): void {
    if (ws.subscriptions) {
      ws.subscriptions.delete(subscription);
      this.updateSubscriptionStats(subscription, -1);
      console.log(`[WebSocket] User ${ws.telegramId} unsubscribed from ${subscription}`);
    }
  }

  /**
   * Handle ping messages
   */
  private handlePing(ws: AuthenticatedWebSocket): void {
    ws.send(JSON.stringify({
      type: 'pong',
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Handle connection disconnect with cleanup
   */
  private handleDisconnect(ws: AuthenticatedWebSocket, telegramId: string, connectionId: string): void {
    // Remove from connection pool
    this.connectionPool.delete(connectionId);

    // Remove from clients map
    const userConnections = this.clients.get(telegramId);
    if (userConnections) {
      userConnections.delete(ws);
      if (userConnections.size === 0) {
        this.clients.delete(telegramId);
      }
    }

    // Clean up ping interval
    const pingInterval = this.pingIntervals.get(connectionId);
    if (pingInterval) {
      clearInterval(pingInterval);
      this.pingIntervals.delete(connectionId);
    }

    // Update statistics
    this.updateStats('disconnect', telegramId);

    console.log(`[WebSocket] User ${telegramId} disconnected (${this.clients.get(telegramId)?.size || 0} connections remaining)`);
  }

  /**
   * Send initial data to newly connected user
   */
  private async sendInitialData(ws: AuthenticatedWebSocket, telegramId: string): Promise<void> {
    try {
      // Send connection confirmation
      ws.send(JSON.stringify({
        type: 'connection_established',
        data: { telegramId, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString()
      }));

      // Send available subscriptions
      ws.send(JSON.stringify({
        type: 'available_subscriptions',
        data: ['USER_UPDATES', 'EARNINGS', 'BALANCE', 'SLOTS', 'LOTTERY', 'NOTIFICATIONS'],
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error(`[WebSocket] Error sending initial data to ${telegramId}:`, error);
    }
  }

  /**
   * Broadcast message to specific user
   */
  public broadcastToUser(telegramId: string, eventType: string, data: unknown): void {
    const userConnections = this.clients.get(telegramId);
    if (!userConnections || userConnections.size === 0) {
      return;
    }

    const message = JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    for (const ws of userConnections) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(message);
          sentCount++;
        } catch (error) {
          console.error(`[WebSocket] Error sending to user ${telegramId}:`, error);
        }
      }
    }

    if (sentCount > 0) {
      console.log(`[WebSocket] Broadcasted ${eventType} to ${sentCount} connections for user ${telegramId}`);
    }
  }

  /**
   * Broadcast message to all users with specific subscription
   */
  public broadcastToSubscribers(subscription: string, eventType: string, data: unknown): void {
    const message = JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    for (const [telegramId, connections] of this.clients) {
      for (const ws of connections) {
        if (ws.readyState === WebSocket.OPEN && ws.subscriptions?.has(subscription)) {
          try {
            ws.send(message);
            sentCount++;
          } catch (error) {
            console.error(`[WebSocket] Error broadcasting to ${telegramId}:`, error);
          }
        }
      }
    }

    if (sentCount > 0) {
      console.log(`[WebSocket] Broadcasted ${eventType} to ${sentCount} subscribers of ${subscription}`);
    }
  }

  /**
   * Broadcast message to all connected users
   */
  public broadcastToAll(eventType: string, data: any): void {
    const message = JSON.stringify({
      type: eventType,
      data,
      timestamp: new Date().toISOString()
    });

    let sentCount = 0;
    for (const [telegramId, connections] of this.clients) {
      for (const ws of connections) {
        if (ws.readyState === WebSocket.OPEN) {
          try {
            ws.send(message);
            sentCount++;
          } catch (error) {
            console.error(`[WebSocket] Error broadcasting to ${telegramId}:`, error);
          }
        }
      }
    }

    console.log(`[WebSocket] Broadcasted ${eventType} to ${sentCount} total connections`);
  }

  /**
   * Start broadcast intervals for real-time updates
   */
  private startBroadcastIntervals(): void {
    // Earnings update interval
    this.broadcastIntervals.set('earnings', setInterval(() => {
      this.broadcastToSubscribers('EARNINGS', 'earnings_update', {
        message: 'Real-time earnings update available'
      });
    }, 30000)); // 30 seconds

    // Balance update interval
    this.broadcastIntervals.set('balance', setInterval(() => {
      this.broadcastToSubscribers('BALANCE', 'balance_update', {
        message: 'Balance update available'
      });
    }, 60000)); // 1 minute
  }

  /**
   * Start cleanup interval for connection maintenance
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.performConnectionCleanup();
    }, 60000); // 1 minute
  }

  /**
   * Perform connection cleanup and maintenance
   */
  private performConnectionCleanup(): void {
    const now = new Date();
    let cleanedConnections = 0;

    for (const [connectionId, ws] of this.connectionPool) {
      // Check for stale connections
      if (ws.lastPingAt && (now.getTime() - ws.lastPingAt.getTime()) > this.poolConfig.connectionTimeout) {
        console.log(`[WebSocket] Cleaning up stale connection ${connectionId}`);
        ws.terminate();
        cleanedConnections++;
      }
    }

    if (cleanedConnections > 0) {
      console.log(`[WebSocket] Cleaned up ${cleanedConnections} stale connections`);
    }
  }

  /**
   * Update connection statistics
   */
  private updateStats(action: 'connect' | 'disconnect', telegramId: string): void {
    if (action === 'connect') {
      this.stats.totalConnections++;
      this.stats.activeConnections++;

      const userConnections = this.stats.connectionsByUser.get(telegramId) || 0;
      this.stats.connectionsByUser.set(telegramId, userConnections + 1);

      if (userConnections === 0) {
        this.stats.usersOnline++;
      }
    } else {
      this.stats.activeConnections = Math.max(0, this.stats.activeConnections - 1);

      const userConnections = this.stats.connectionsByUser.get(telegramId) || 0;
      if (userConnections > 1) {
        this.stats.connectionsByUser.set(telegramId, userConnections - 1);
      } else {
        this.stats.connectionsByUser.delete(telegramId);
        this.stats.usersOnline = Math.max(0, this.stats.usersOnline - 1);
      }
    }

    // Add to history
    this.stats.connectionHistory.push({
      timestamp: new Date(),
      action,
      telegramId
    });

    // Keep only last 1000 history entries
    if (this.stats.connectionHistory.length > 1000) {
      this.stats.connectionHistory = this.stats.connectionHistory.slice(-1000);
    }
  }

  /**
   * Update subscription statistics
   */
  private updateSubscriptionStats(subscription: string, delta: number): void {
    const current = this.stats.subscriptions.get(subscription) || 0;
    this.stats.subscriptions.set(subscription, Math.max(0, current + delta));
  }

  /**
   * Get WebSocket statistics
   */
  public getStats(): WebSocketStats & { poolConfig: ConnectionPool } {
    return {
      ...this.stats,
      poolConfig: this.poolConfig
    };
  }

  /**
   * Update connection pool configuration
   */
  public updatePoolConfig(config: Partial<ConnectionPool>): void {
    this.poolConfig = { ...this.poolConfig, ...config };
    console.log('[WebSocket] Updated connection pool configuration:', this.poolConfig);
  }

  /**
   * Get connections for specific user
   */
  public getUserConnections(telegramId: string): AuthenticatedWebSocket[] {
    const connections = this.clients.get(telegramId);
    return connections ? Array.from(connections) : [];
  }

  /**
   * Check if user is online
   */
  public isUserOnline(telegramId: string): boolean {
    return this.clients.has(telegramId) && this.clients.get(telegramId)!.size > 0;
  }

  /**
   * Get online users count
   */
  public getOnlineUsersCount(): number {
    return this.stats.usersOnline;
  }

  /**
   * Shutdown WebSocket manager
   */
  public shutdown(): void {
    console.log('[WebSocket] Shutting down WebSocket manager...');

    // Clear all intervals
    for (const interval of this.pingIntervals.values()) {
      clearInterval(interval);
    }
    for (const interval of this.broadcastIntervals.values()) {
      clearInterval(interval);
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all connections
    for (const ws of this.connectionPool.values()) {
      ws.close(1001, 'Server shutdown');
    }

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }

    console.log('[WebSocket] WebSocket manager shutdown complete');
  }

  private handleNotificationConnection(ws: WebSocket) {
    // Handle notification connections
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('[WebSocket] Notification message received:', message);
      } catch (error) {
        console.error('[WebSocket] Invalid notification message:', error);
      }
    });
  }
}

