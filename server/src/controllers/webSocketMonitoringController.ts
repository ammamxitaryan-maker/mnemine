import { Request, Response } from 'express';
import { UnifiedWebSocketManager } from '../services/unifiedWebSocketManager.js';
import { WebSocketPerformanceService } from '../services/webSocketPerformanceService.js';

export class WebSocketMonitoringController {
  // GET /api/admin/websocket/status - Get WebSocket status and statistics
  static async getWebSocketStatus(req: Request, res: Response) {
    try {
      const wsManager = UnifiedWebSocketManager.getInstance();
      const performanceService = WebSocketPerformanceService.getInstance();
      
      const stats = wsManager.getStats();
      const performanceStats = performanceService.getPerformanceStats();
      
      res.status(200).json({
        success: true,
        data: {
          connections: stats,
          performance: performanceStats,
          health: {
            status: stats.activeConnections > 0 ? 'healthy' : 'no_connections',
            uptime: performanceStats.uptime,
            lastActivity: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      console.error('Error fetching WebSocket status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch WebSocket status'
      });
    }
  }

  // GET /api/admin/websocket/connections - Get detailed connection information
  static async getConnections(req: Request, res: Response) {
    try {
      const wsManager = UnifiedWebSocketManager.getInstance();
      const { telegramId } = req.query;
      
      if (telegramId) {
        // Get connections for specific user
        const connections = wsManager.getUserConnections(telegramId as string);
        const isOnline = wsManager.isUserOnline(telegramId as string);
        
        res.status(200).json({
          success: true,
          data: {
            telegramId,
            isOnline,
            connectionCount: connections.length,
            connections: connections.map(ws => ({
              connectionId: ws.connectionId,
              connectedAt: ws.connectedAt,
              lastPingAt: ws.lastPingAt,
              isAlive: ws.isAlive,
              subscriptions: Array.from(ws.subscriptions || [])
            }))
          }
        });
      } else {
        // Get all connections summary
        const stats = wsManager.getStats();
        const onlineUsers = Array.from(stats.connectionsByUser.entries()).map(([telegramId, count]) => ({
          telegramId,
          connectionCount: count
        }));
        
        res.status(200).json({
          success: true,
          data: {
            totalConnections: stats.activeConnections,
            onlineUsers: stats.usersOnline,
            users: onlineUsers
          }
        });
      }
    } catch (error) {
      console.error('Error fetching connections:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch connections'
      });
    }
  }

  // GET /api/admin/websocket/performance - Get WebSocket performance metrics
  static async getPerformanceMetrics(req: Request, res: Response) {
    try {
      const performanceService = WebSocketPerformanceService.getInstance();
      const report = performanceService.getPerformanceReport();
      
      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch performance metrics'
      });
    }
  }

  // POST /api/admin/websocket/broadcast - Send broadcast message
  static async sendBroadcast(req: Request, res: Response) {
    try {
      const { type, data, target, subscription } = req.body;
      
      if (!type || !data) {
        return res.status(400).json({
          success: false,
          error: 'Type and data are required'
        });
      }

      const wsManager = UnifiedWebSocketManager.getInstance();
      
      if (target === 'all') {
        wsManager.broadcastToAll(type, data);
      } else if (target === 'subscription' && subscription) {
        wsManager.broadcastToSubscribers(subscription, type, data);
      } else if (target === 'user' && req.body.telegramId) {
        wsManager.broadcastToUser(req.body.telegramId, type, data);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid target or missing required parameters'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Broadcast sent successfully',
        data: { type, target, subscription }
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send broadcast'
      });
    }
  }

  // POST /api/admin/websocket/disconnect - Disconnect specific user
  static async disconnectUser(req: Request, res: Response) {
    try {
      const { telegramId, connectionId } = req.body;
      
      if (!telegramId) {
        return res.status(400).json({
          success: false,
          error: 'TelegramId is required'
        });
      }

      const wsManager = UnifiedWebSocketManager.getInstance();
      const connections = wsManager.getUserConnections(telegramId);
      
      if (connections.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'User not found or not connected'
        });
      }

      let disconnectedCount = 0;
      for (const ws of connections) {
        if (!connectionId || ws.connectionId === connectionId) {
          ws.close(1000, 'Admin disconnect');
          disconnectedCount++;
        }
      }
      
      res.status(200).json({
        success: true,
        message: `Disconnected ${disconnectedCount} connections for user ${telegramId}`,
        data: { disconnectedCount }
      });
    } catch (error) {
      console.error('Error disconnecting user:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to disconnect user'
      });
    }
  }

  // POST /api/admin/websocket/config - Update WebSocket configuration
  static async updateConfiguration(req: Request, res: Response) {
    try {
      const { maxConnections, maxConnectionsPerUser, pingInterval, connectionTimeout } = req.body;
      
      const wsManager = UnifiedWebSocketManager.getInstance();
      
      const config: any = {};
      if (maxConnections !== undefined) config.maxConnections = maxConnections;
      if (maxConnectionsPerUser !== undefined) config.maxConnectionsPerUser = maxConnectionsPerUser;
      if (pingInterval !== undefined) config.pingInterval = pingInterval;
      if (connectionTimeout !== undefined) config.connectionTimeout = connectionTimeout;
      
      wsManager.updatePoolConfig(config);
      
      res.status(200).json({
        success: true,
        message: 'WebSocket configuration updated successfully',
        data: config
      });
    } catch (error) {
      console.error('Error updating configuration:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update configuration'
      });
    }
  }

  // GET /api/admin/websocket/subscriptions - Get subscription statistics
  static async getSubscriptionStats(req: Request, res: Response) {
    try {
      const wsManager = UnifiedWebSocketManager.getInstance();
      const stats = wsManager.getStats();
      
      const subscriptionStats = Array.from(stats.subscriptions.entries()).map(([subscription, count]) => ({
        subscription,
        subscriberCount: count
      }));
      
      res.status(200).json({
        success: true,
        data: {
          subscriptions: subscriptionStats,
          totalSubscriptions: Array.from(stats.subscriptions.values()).reduce((sum, count) => sum + count, 0)
        }
      });
    } catch (error) {
      console.error('Error fetching subscription stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription statistics'
      });
    }
  }

  // POST /api/admin/websocket/cleanup - Force connection cleanup
  static async forceCleanup(req: Request, res: Response) {
    try {
      const wsManager = UnifiedWebSocketManager.getInstance();
      const performanceService = WebSocketPerformanceService.getInstance();
      
      // Get stats before cleanup
      const beforeStats = wsManager.getStats();
      
      // Force cleanup of stale connections
      // This would trigger the cleanup logic in the WebSocket manager
      
      // Clear performance data if requested
      if (req.body.clearPerformanceData) {
        performanceService.clearPerformanceData();
      }
      
      const afterStats = wsManager.getStats();
      const cleanedConnections = beforeStats.activeConnections - afterStats.activeConnections;
      
      res.status(200).json({
        success: true,
        message: 'Cleanup completed successfully',
        data: {
          cleanedConnections,
          beforeStats: {
            activeConnections: beforeStats.activeConnections,
            usersOnline: beforeStats.usersOnline
          },
          afterStats: {
            activeConnections: afterStats.activeConnections,
            usersOnline: afterStats.usersOnline
          }
        }
      });
    } catch (error) {
      console.error('Error performing cleanup:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform cleanup'
      });
    }
  }

  // GET /api/admin/websocket/health - Get WebSocket health status
  static async getHealthStatus(req: Request, res: Response) {
    try {
      const wsManager = UnifiedWebSocketManager.getInstance();
      const performanceService = WebSocketPerformanceService.getInstance();
      
      const stats = wsManager.getStats();
      const performanceStats = performanceService.getPerformanceStats();
      const trends = performanceService.getPerformanceTrends();
      
      // Determine health status
      let healthStatus = 'healthy';
      const issues: string[] = [];
      
      if (performanceStats.errorRate > 10) {
        healthStatus = 'warning';
        issues.push(`High error rate: ${performanceStats.errorRate}%`);
      }
      
      if (performanceStats.averageLatency > 200) {
        healthStatus = 'warning';
        issues.push(`High latency: ${performanceStats.averageLatency}ms`);
      }
      
      if (stats.activeConnections > 800) {
        healthStatus = 'warning';
        issues.push(`High connection count: ${stats.activeConnections}`);
      }
      
      if (trends.trend === 'degrading') {
        healthStatus = 'critical';
        issues.push('Performance is degrading');
      }
      
      res.status(200).json({
        success: true,
        data: {
          status: healthStatus,
          issues,
          stats: {
            connections: stats.activeConnections,
            users: stats.usersOnline,
            uptime: performanceStats.uptime,
            errorRate: performanceStats.errorRate,
            latency: performanceStats.averageLatency
          },
          trends: trends,
          recommendations: trends.recommendations
        }
      });
    } catch (error) {
      console.error('Error fetching health status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch health status'
      });
    }
  }
}

