/**
 * Performance Monitoring Utility
 * Tracks and reports performance metrics
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static readonly MAX_METRICS = 1000;
  private static readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second

  /**
   * Record a performance metric
   */
  static record(operation: string, duration: number, success: boolean = true, error?: string) {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      success,
      error,
    };

    this.metrics.push(metric);

    // Keep only the last MAX_METRICS entries
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }

    // Log slow operations
    if (duration > this.SLOW_QUERY_THRESHOLD) {
      console.warn(`[PERFORMANCE] Slow operation detected: ${operation} took ${duration}ms`);
    }
  }

  /**
   * Get performance statistics
   */
  static getStats() {
    const stats = {
      totalOperations: this.metrics.length,
      averageDuration: 0,
      slowOperations: 0,
      errorRate: 0,
      operationsByType: {} as Record<string, { count: number; avgDuration: number }>,
    };

    if (this.metrics.length === 0) {
      return stats;
    }

    // Calculate averages
    const totalDuration = this.metrics.reduce((sum, metric) => sum + metric.duration, 0);
    stats.averageDuration = totalDuration / this.metrics.length;

    // Count slow operations
    stats.slowOperations = this.metrics.filter(m => m.duration > this.SLOW_QUERY_THRESHOLD).length;

    // Calculate error rate
    const errorCount = this.metrics.filter(m => !m.success).length;
    stats.errorRate = (errorCount / this.metrics.length) * 100;

    // Group by operation type
    this.metrics.forEach(metric => {
      if (!stats.operationsByType[metric.operation]) {
        stats.operationsByType[metric.operation] = { count: 0, avgDuration: 0 };
      }
      stats.operationsByType[metric.operation].count++;
    });

    // Calculate average duration per operation type
    Object.keys(stats.operationsByType).forEach(operation => {
      const operationMetrics = this.metrics.filter(m => m.operation === operation);
      const totalDuration = operationMetrics.reduce((sum, m) => sum + m.duration, 0);
      stats.operationsByType[operation].avgDuration = totalDuration / operationMetrics.length;
    });

    return stats;
  }

  /**
   * Get slow operations
   */
  static getSlowOperations(threshold: number = this.SLOW_QUERY_THRESHOLD) {
    return this.metrics
      .filter(m => m.duration > threshold)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10); // Top 10 slowest
  }

  /**
   * Clear all metrics
   */
  static clear() {
    this.metrics = [];
  }

  /**
   * Performance decorator for functions
   */
  static measure<T extends (...args: any[]) => any>(
    operation: string,
    fn: T
  ): T {
    return ((...args: any[]) => {
      const start = performance.now();
      try {
        const result = fn(...args);

        // Handle async functions
        if (result instanceof Promise) {
          return result
            .then(value => {
              const duration = performance.now() - start;
              this.record(operation, duration, true);
              return value;
            })
            .catch(error => {
              const duration = performance.now() - start;
              this.record(operation, duration, false, error.message);
              throw error;
            });
        }

        // Handle sync functions
        const duration = performance.now() - start;
        this.record(operation, duration, true);
        return result;
      } catch (error) {
        const duration = performance.now() - start;
        this.record(operation, duration, false, (error as Error).message);
        throw error;
      }
    }) as T;
  }
}

/**
 * Database performance monitoring
 */
export class DatabasePerformanceMonitor {
  private static queryMetrics: Map<string, number[]> = new Map();

  static recordQuery(operation: string, duration: number) {
    if (!this.queryMetrics.has(operation)) {
      this.queryMetrics.set(operation, []);
    }

    const metrics = this.queryMetrics.get(operation)!;
    metrics.push(duration);

    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  static getQueryStats() {
    const stats: Record<string, { count: number; avgDuration: number; maxDuration: number }> = {};

    for (const [operation, metrics] of this.queryMetrics.entries()) {
      const avgDuration = metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
      const maxDuration = Math.max(...metrics);

      stats[operation] = {
        count: metrics.length,
        avgDuration,
        maxDuration,
      };
    }

    return stats;
  }

  static getSlowQueries(threshold: number = 1000) {
    const slowQueries: Array<{ operation: string; avgTime: number }> = [];

    for (const [operation, metrics] of this.queryMetrics.entries()) {
      const avgTime = metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
      if (avgTime > threshold) {
        slowQueries.push({ operation, avgTime });
      }
    }

    return slowQueries.sort((a, b) => b.avgTime - a.avgTime);
  }
}
