/**
 * Performance Monitor Script - Comprehensive performance monitoring and optimization
 * 
 * This script provides performance monitoring capabilities while strictly preserving
 * all existing functionality. No features are modified or disabled.
 */

import { performance } from 'perf_hooks';
import { PrismaClient } from '@prisma/client';
import { AdvancedLRUCache } from '../optimizations/AdvancedCacheSystem.js';
import { DatabaseOptimizerEnhanced } from '../optimizations/DatabaseOptimizerEnhanced.js';

// Performance monitoring configuration
interface PerformanceConfig {
  enableDatabaseMonitoring: boolean;
  enableCacheMonitoring: boolean;
  enableMemoryMonitoring: boolean;
  enableQueryMonitoring: boolean;
  monitoringInterval: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// Performance metrics interface
interface PerformanceMetrics {
  timestamp: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  database: {
    connectionCount: number;
    queryCount: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    size: number;
    memoryUsage: number;
  };
  system: {
    uptime: number;
    cpuUsage: number;
    loadAverage: number[];
  };
}

// Default configuration
const DEFAULT_CONFIG: PerformanceConfig = {
  enableDatabaseMonitoring: true,
  enableCacheMonitoring: true,
  enableMemoryMonitoring: true,
  enableQueryMonitoring: true,
  monitoringInterval: 30000, // 30 seconds
  logLevel: 'info',
};

/**
 * Performance Monitor Class
 */
export class PerformanceMonitor {
  private config: PerformanceConfig;
  private prisma: PrismaClient;
  private cache: AdvancedLRUCache<any>;
  private dbOptimizer: DatabaseOptimizerEnhanced;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metrics: PerformanceMetrics[] = [];

  constructor(
    prisma: PrismaClient,
    cache: AdvancedLRUCache<any>,
    dbOptimizer: DatabaseOptimizerEnhanced,
    config: Partial<PerformanceConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.prisma = prisma;
    this.cache = cache;
    this.dbOptimizer = dbOptimizer;
  }

  /**
   * Start performance monitoring
   */
  start(): void {
    if (this.isMonitoring) {
      console.log('[PerformanceMonitor] Already monitoring');
      return;
    }

    this.isMonitoring = true;
    console.log('[PerformanceMonitor] Starting performance monitoring...');

    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.config.monitoringInterval);

    // Collect initial metrics
    this.collectMetrics();
  }

  /**
   * Stop performance monitoring
   */
  stop(): void {
    if (!this.isMonitoring) {
      console.log('[PerformanceMonitor] Not monitoring');
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    console.log('[PerformanceMonitor] Performance monitoring stopped');
  }

  /**
   * Collect performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      const metrics: PerformanceMetrics = {
        timestamp: Date.now(),
        memory: await this.getMemoryMetrics(),
        database: await this.getDatabaseMetrics(),
        cache: this.getCacheMetrics(),
        system: this.getSystemMetrics(),
      };

      this.metrics.push(metrics);

      // Keep only last 100 metrics
      if (this.metrics.length > 100) {
        this.metrics = this.metrics.slice(-100);
      }

      // Log metrics based on log level
      this.logMetrics(metrics);

      // Check for performance issues
      this.checkPerformanceIssues(metrics);

    } catch (error) {
      console.error('[PerformanceMonitor] Error collecting metrics:', error);
    }
  }

  /**
   * Get memory metrics
   */
  private async getMemoryMetrics(): Promise<PerformanceMetrics['memory']> {
    if (!this.config.enableMemoryMonitoring) {
      return { used: 0, total: 0, percentage: 0 };
    }

    const memUsage = process.memoryUsage();
    const totalMemory = require('os').totalmem();
    
    return {
      used: memUsage.heapUsed,
      total: totalMemory,
      percentage: (memUsage.heapUsed / totalMemory) * 100,
    };
  }

  /**
   * Get database metrics
   */
  private async getDatabaseMetrics(): Promise<PerformanceMetrics['database']> {
    if (!this.config.enableDatabaseMonitoring) {
      return { connectionCount: 0, queryCount: 0, averageQueryTime: 0, slowQueries: 0 };
    }

    try {
      const stats = this.dbOptimizer.getQueryStats();
      const connectionStatus = await this.dbOptimizer.getConnectionStatus();
      
      return {
        connectionCount: 1, // Prisma manages connections internally
        queryCount: stats.totalQueries,
        averageQueryTime: stats.averageExecutionTime,
        slowQueries: stats.slowestQueries.length,
      };
    } catch (error) {
      console.error('[PerformanceMonitor] Error getting database metrics:', error);
      return { connectionCount: 0, queryCount: 0, averageQueryTime: 0, slowQueries: 0 };
    }
  }

  /**
   * Get cache metrics
   */
  private getCacheMetrics(): PerformanceMetrics['cache'] {
    if (!this.config.enableCacheMonitoring) {
      return { hitRate: 0, missRate: 0, size: 0, memoryUsage: 0 };
    }

    const stats = this.cache.getStats();
    
    return {
      hitRate: stats.hitRate,
      missRate: 1 - stats.hitRate,
      size: stats.size,
      memoryUsage: 0, // Cache memory usage is not directly measurable
    };
  }

  /**
   * Get system metrics
   */
  private getSystemMetrics(): PerformanceMetrics['system'] {
    const uptime = process.uptime();
    const loadAverage = require('os').loadavg();
    
    return {
      uptime,
      cpuUsage: 0, // CPU usage requires additional monitoring
      loadAverage,
    };
  }

  /**
   * Log metrics based on log level
   */
  private logMetrics(metrics: PerformanceMetrics): void {
    const logLevels = ['debug', 'info', 'warn', 'error'];
    const currentLevel = logLevels.indexOf(this.config.logLevel);
    
    if (currentLevel <= 1) { // info or debug
      console.log('[PerformanceMonitor] Metrics:', {
        memory: `${(metrics.memory.used / 1024 / 1024).toFixed(2)}MB`,
        database: {
          queries: metrics.database.queryCount,
          avgTime: `${metrics.database.averageQueryTime.toFixed(2)}ms`,
        },
        cache: {
          hitRate: `${(metrics.cache.hitRate * 100).toFixed(1)}%`,
          size: metrics.cache.size,
        },
        uptime: `${(metrics.system.uptime / 3600).toFixed(1)}h`,
      });
    }
  }

  /**
   * Check for performance issues
   */
  private checkPerformanceIssues(metrics: PerformanceMetrics): void {
    const issues: string[] = [];

    // Check memory usage
    if (metrics.memory.percentage > 80) {
      issues.push(`High memory usage: ${metrics.memory.percentage.toFixed(1)}%`);
    }

    // Check database performance
    if (metrics.database.averageQueryTime > 1000) {
      issues.push(`Slow database queries: ${metrics.database.averageQueryTime.toFixed(2)}ms average`);
    }

    if (metrics.database.slowQueries > 5) {
      issues.push(`Multiple slow queries detected: ${metrics.database.slowQueries}`);
    }

    // Check cache performance
    if (metrics.cache.hitRate < 0.7) {
      issues.push(`Low cache hit rate: ${(metrics.cache.hitRate * 100).toFixed(1)}%`);
    }

    // Log issues
    if (issues.length > 0) {
      console.warn('[PerformanceMonitor] Performance issues detected:', issues);
    }
  }

  /**
   * Get performance report
   */
  getPerformanceReport(): {
    current: PerformanceMetrics | null;
    average: Partial<PerformanceMetrics>;
    issues: string[];
    recommendations: string[];
  } {
    const current = this.metrics[this.metrics.length - 1] || null;
    
    // Calculate averages
    const average: Partial<PerformanceMetrics> = {};
    if (this.metrics.length > 0) {
      average.memory = {
        used: this.metrics.reduce((sum, m) => sum + m.memory.used, 0) / this.metrics.length,
        total: this.metrics[0].memory.total,
        percentage: this.metrics.reduce((sum, m) => sum + m.memory.percentage, 0) / this.metrics.length,
      };
      
      average.database = {
        connectionCount: this.metrics.reduce((sum, m) => sum + m.database.connectionCount, 0) / this.metrics.length,
        queryCount: this.metrics.reduce((sum, m) => sum + m.database.queryCount, 0) / this.metrics.length,
        averageQueryTime: this.metrics.reduce((sum, m) => sum + m.database.averageQueryTime, 0) / this.metrics.length,
        slowQueries: this.metrics.reduce((sum, m) => sum + m.database.slowQueries, 0) / this.metrics.length,
      };
      
      average.cache = {
        hitRate: this.metrics.reduce((sum, m) => sum + m.cache.hitRate, 0) / this.metrics.length,
        missRate: this.metrics.reduce((sum, m) => sum + m.cache.missRate, 0) / this.metrics.length,
        size: this.metrics.reduce((sum, m) => sum + m.cache.size, 0) / this.metrics.length,
        memoryUsage: this.metrics.reduce((sum, m) => sum + m.cache.memoryUsage, 0) / this.metrics.length,
      };
    }

    // Identify issues
    const issues: string[] = [];
    if (current) {
      if (current.memory.percentage > 80) issues.push('High memory usage');
      if (current.database.averageQueryTime > 1000) issues.push('Slow database queries');
      if (current.cache.hitRate < 0.7) issues.push('Low cache hit rate');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (current?.memory.percentage > 80) {
      recommendations.push('Consider increasing memory allocation or optimizing memory usage');
    }
    if (current?.database.averageQueryTime > 1000) {
      recommendations.push('Optimize database queries or add indexes');
    }
    if (current?.cache.hitRate < 0.7) {
      recommendations.push('Increase cache size or improve cache strategy');
    }

    return {
      current,
      average,
      issues,
      recommendations,
    };
  }

  /**
   * Export metrics to JSON
   */
  exportMetrics(): string {
    return JSON.stringify({
      config: this.config,
      metrics: this.metrics,
      report: this.getPerformanceReport(),
    }, null, 2);
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
    console.log('[PerformanceMonitor] Metrics history cleared');
  }
}

// Export the class
export default PerformanceMonitor;
