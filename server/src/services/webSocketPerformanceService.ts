import { performance } from 'perf_hooks';
import { UnifiedWebSocketManager } from './unifiedWebSocketManager.js';

interface WebSocketMetrics {
  messageCount: number;
  bytesTransferred: number;
  averageLatency: number;
  connectionDuration: number;
  errorCount: number;
  lastActivity: Date;
}

interface PerformanceStats {
  totalMessages: number;
  totalBytes: number;
  averageLatency: number;
  peakConnections: number;
  currentConnections: number;
  errorRate: number;
  uptime: number;
}

export class WebSocketPerformanceService {
  private static instance: WebSocketPerformanceService;
  private metrics: Map<string, WebSocketMetrics> = new Map();
  private performanceHistory: Array<{ timestamp: Date; stats: PerformanceStats }> = [];
  private startTime: Date;
  private peakConnections: number = 0;

  private constructor() {
    this.startTime = new Date();
    this.startPerformanceMonitoring();
  }

  public static getInstance(): WebSocketPerformanceService {
    if (!WebSocketPerformanceService.instance) {
      WebSocketPerformanceService.instance = new WebSocketPerformanceService();
    }
    return WebSocketPerformanceService.instance;
  }

  /**
   * Record message metrics
   */
  public recordMessage(connectionId: string, messageSize: number, latency: number): void {
    const existing = this.metrics.get(connectionId) || {
      messageCount: 0,
      bytesTransferred: 0,
      averageLatency: 0,
      connectionDuration: 0,
      errorCount: 0,
      lastActivity: new Date()
    };

    existing.messageCount++;
    existing.bytesTransferred += messageSize;
    existing.averageLatency = (existing.averageLatency + latency) / 2;
    existing.lastActivity = new Date();

    this.metrics.set(connectionId, existing);
  }

  /**
   * Record connection error
   */
  public recordError(connectionId: string): void {
    const existing = this.metrics.get(connectionId) || {
      messageCount: 0,
      bytesTransferred: 0,
      averageLatency: 0,
      connectionDuration: 0,
      errorCount: 0,
      lastActivity: new Date()
    };

    existing.errorCount++;
    this.metrics.set(connectionId, existing);
  }

  /**
   * Record connection duration
   */
  public recordConnectionDuration(connectionId: string, duration: number): void {
    const existing = this.metrics.get(connectionId);
    if (existing) {
      existing.connectionDuration = duration;
      this.metrics.set(connectionId, existing);
    }
  }

  /**
   * Remove connection metrics
   */
  public removeConnection(connectionId: string): void {
    this.metrics.delete(connectionId);
  }

  /**
   * Get performance statistics
   */
  public getPerformanceStats(): PerformanceStats {
    const wsManager = UnifiedWebSocketManager.getInstance();
    const wsStats = wsManager.getStats();
    
    const totalMessages = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.messageCount, 0);
    const totalBytes = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.bytesTransferred, 0);
    const totalErrors = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.errorCount, 0);
    const averageLatency = Array.from(this.metrics.values()).reduce((sum, m) => sum + m.averageLatency, 0) / this.metrics.size || 0;
    
    this.peakConnections = Math.max(this.peakConnections, wsStats.activeConnections);
    
    const uptime = Date.now() - this.startTime.getTime();
    const errorRate = totalMessages > 0 ? (totalErrors / totalMessages) * 100 : 0;

    return {
      totalMessages,
      totalBytes,
      averageLatency: Math.round(averageLatency * 100) / 100,
      peakConnections: this.peakConnections,
      currentConnections: wsStats.activeConnections,
      errorRate: Math.round(errorRate * 100) / 100,
      uptime: Math.round(uptime / 1000) // seconds
    };
  }

  /**
   * Get connection-specific metrics
   */
  public getConnectionMetrics(connectionId: string): WebSocketMetrics | null {
    return this.metrics.get(connectionId) || null;
  }

  /**
   * Get top connections by activity
   */
  public getTopConnections(limit: number = 10): Array<{ connectionId: string; metrics: WebSocketMetrics }> {
    return Array.from(this.metrics.entries())
      .sort(([, a], [, b]) => b.messageCount - a.messageCount)
      .slice(0, limit)
      .map(([connectionId, metrics]) => ({ connectionId, metrics }));
  }

  /**
   * Get performance trends
   */
  public getPerformanceTrends(): {
    trend: 'improving' | 'degrading' | 'stable';
    change: number;
    recommendations: string[];
  } {
    if (this.performanceHistory.length < 2) {
      return { trend: 'stable', change: 0, recommendations: ['Insufficient data for trend analysis'] };
    }

    const recent = this.performanceHistory.slice(-5);
    const older = this.performanceHistory.slice(-10, -5);

    const recentAvgLatency = recent.reduce((sum, entry) => sum + entry.stats.averageLatency, 0) / recent.length;
    const olderAvgLatency = older.length > 0 ? older.reduce((sum, entry) => sum + entry.stats.averageLatency, 0) / older.length : recentAvgLatency;

    const change = ((recentAvgLatency - olderAvgLatency) / olderAvgLatency) * 100;
    const recommendations: string[] = [];

    let trend: 'improving' | 'degrading' | 'stable' = 'stable';
    if (change > 10) {
      trend = 'degrading';
      recommendations.push('Latency is increasing. Consider optimizing message handling.');
      recommendations.push('Check for network issues or server overload.');
    } else if (change < -10) {
      trend = 'improving';
      recommendations.push('Performance is improving. Monitor for consistency.');
    } else {
      recommendations.push('Performance is stable. Continue monitoring.');
    }

    // Add specific recommendations based on current stats
    const currentStats = this.getPerformanceStats();
    if (currentStats.errorRate > 5) {
      recommendations.push('High error rate detected. Investigate connection stability.');
    }
    if (currentStats.averageLatency > 100) {
      recommendations.push('High latency detected. Consider message batching or compression.');
    }
    if (currentStats.currentConnections > 500) {
      recommendations.push('High connection count. Consider connection pooling optimization.');
    }

    return { trend, change: Math.round(change * 100) / 100, recommendations };
  }

  /**
   * Start performance monitoring
   */
  private startPerformanceMonitoring(): void {
    setInterval(() => {
      const stats = this.getPerformanceStats();
      this.performanceHistory.push({
        timestamp: new Date(),
        stats
      });

      // Keep only last 100 entries
      if (this.performanceHistory.length > 100) {
        this.performanceHistory = this.performanceHistory.slice(-100);
      }

      // Log performance warnings
      if (stats.errorRate > 10) {
        console.warn(`[WebSocket] High error rate: ${stats.errorRate}%`);
      }
      if (stats.averageLatency > 200) {
        console.warn(`[WebSocket] High latency: ${stats.averageLatency}ms`);
      }
    }, 60000); // 1 minute
  }

  /**
   * Get performance history
   */
  public getPerformanceHistory(): Array<{ timestamp: Date; stats: PerformanceStats }> {
    return [...this.performanceHistory];
  }

  /**
   * Clear performance data
   */
  public clearPerformanceData(): void {
    this.metrics.clear();
    this.performanceHistory = [];
    this.peakConnections = 0;
    this.startTime = new Date();
    console.log('[WebSocket] Performance data cleared');
  }

  /**
   * Get comprehensive performance report
   */
  public getPerformanceReport(): {
    current: PerformanceStats;
    trends: { trend: 'improving' | 'degrading' | 'stable'; change: number; recommendations: string[] };
    topConnections: Array<{ connectionId: string; metrics: WebSocketMetrics }>;
    history: Array<{ timestamp: Date; stats: PerformanceStats }>;
  } {
    return {
      current: this.getPerformanceStats(),
      trends: this.getPerformanceTrends(),
      topConnections: this.getTopConnections(10),
      history: this.getPerformanceHistory()
    };
  }
}

