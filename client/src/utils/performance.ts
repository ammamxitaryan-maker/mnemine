/**
 * Система мониторинга производительности
 */

import { logger } from './logger';

// Метрики производительности
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// Статистика производительности
interface PerformanceStats {
  totalCalls: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  lastDuration: number;
  slowestCalls: Array<{ name: string; duration: number; timestamp: string }>;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>();
  private stats = new Map<string, PerformanceStats>();
  private slowestCalls: Array<{ name: string; duration: number; timestamp: string }> = [];

  /**
   * Начать измерение производительности
   */
  start(name: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata,
    };

    this.metrics.set(name, metric);
  }

  /**
   * Завершить измерение производительности
   */
  end(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`[PERFORMANCE] No metric found for: ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Обновляем статистику
    this.updateStats(name, duration);

    // Логируем медленные операции
    if (duration > 1000) { // Более 1 секунды
      logger.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, 'performance', {
        duration,
        metadata: metric.metadata,
      });
    }

    // Удаляем из активных метрик
    this.metrics.delete(name);

    return duration;
  }

  /**
   * Обновить статистику
   */
  private updateStats(name: string, duration: number): void {
    const existing = this.stats.get(name);
    const timestamp = new Date().toISOString();

    if (existing) {
      existing.totalCalls++;
      existing.averageDuration = (existing.averageDuration * (existing.totalCalls - 1) + duration) / existing.totalCalls;
      existing.minDuration = Math.min(existing.minDuration, duration);
      existing.maxDuration = Math.max(existing.maxDuration, duration);
      existing.lastDuration = duration;

      // Обновляем список самых медленных вызовов
      this.slowestCalls.push({ name, duration, timestamp });
      this.slowestCalls.sort((a, b) => b.duration - a.duration);
      this.slowestCalls = this.slowestCalls.slice(0, 10); // Оставляем только 10 самых медленных
    } else {
      this.stats.set(name, {
        totalCalls: 1,
        averageDuration: duration,
        minDuration: duration,
        maxDuration: duration,
        lastDuration: duration,
        slowestCalls: [{ name, duration, timestamp }],
      });
    }
  }

  /**
   * Получить статистику для операции
   */
  getStats(name: string): PerformanceStats | null {
    return this.stats.get(name) || null;
  }

  /**
   * Получить все статистики
   */
  getAllStats(): Map<string, PerformanceStats> {
    return new Map(this.stats);
  }

  /**
   * Получить самые медленные операции
   */
  getSlowestCalls(limit: number = 10): Array<{ name: string; duration: number; timestamp: string }> {
    return this.slowestCalls.slice(0, limit);
  }

  /**
   * Очистить статистику
   */
  clearStats(): void {
    this.stats.clear();
    this.slowestCalls = [];
  }

  /**
   * Получить активные метрики
   */
  getActiveMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Проверить, есть ли активные метрики
   */
  hasActiveMetrics(): boolean {
    return this.metrics.size > 0;
  }
}

// Создаем глобальный экземпляр монитора
export const performanceMonitor = new PerformanceMonitor();

/**
 * Декоратор для измерения производительности функций
 */
export function measurePerformance(name?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const metricName = name || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      performanceMonitor.start(metricName);

      try {
        const result = await method.apply(this, args);
        const duration = performanceMonitor.end(metricName);

        if (duration !== null) {
          logger.performance(metricName, duration);
        }

        return result;
      } catch (error) {
        performanceMonitor.end(metricName);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Хук для измерения производительности в React компонентах
 */
export const usePerformance = () => {
  const start = (name: string, metadata?: Record<string, any>) => {
    performanceMonitor.start(name, metadata);
  };

  const end = (name: string) => {
    return performanceMonitor.end(name);
  };

  const measure = async <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> => {
    start(name, metadata);
    try {
      const result = await fn();
      end(name);
      return result;
    } catch (error) {
      end(name);
      throw error;
    }
  };

  const measureSync = <T>(name: string, fn: () => T, metadata?: Record<string, any>): T => {
    start(name, metadata);
    try {
      const result = fn();
      end(name);
      return result;
    } catch (error) {
      end(name);
      throw error;
    }
  };

  return {
    start,
    end,
    measure,
    measureSync,
    getStats: performanceMonitor.getStats.bind(performanceMonitor),
    getAllStats: performanceMonitor.getAllStats.bind(performanceMonitor),
    getSlowestCalls: performanceMonitor.getSlowestCalls.bind(performanceMonitor),
    clearStats: performanceMonitor.clearStats.bind(performanceMonitor),
    getActiveMetrics: performanceMonitor.getActiveMetrics.bind(performanceMonitor),
    hasActiveMetrics: performanceMonitor.hasActiveMetrics.bind(performanceMonitor),
  };
};

/**
 * Мониторинг Web Vitals
 */
export const initWebVitals = () => {
  // Core Web Vitals
  if ('web-vital' in window) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS((metric) => {
        logger.performance('CLS', metric.value, { metric: 'CLS', rating: metric.rating });
      });

      getFID((metric) => {
        logger.performance('FID', metric.value, { metric: 'FID', rating: metric.rating });
      });

      getFCP((metric) => {
        logger.performance('FCP', metric.value, { metric: 'FCP', rating: metric.rating });
      });

      getLCP((metric) => {
        logger.performance('LCP', metric.value, { metric: 'LCP', rating: metric.rating });
      });

      getTTFB((metric) => {
        logger.performance('TTFB', metric.value, { metric: 'TTFB', rating: metric.rating });
      });
    });
  }

  // Мониторинг загрузки ресурсов
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          logger.performance('Page Load', navEntry.loadEventEnd - navEntry.loadEventStart, {
            type: 'navigation',
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
          });
        } else if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          if (resourceEntry.duration > 1000) { // Ресурсы, загружающиеся более 1 секунды
            logger.warn(`Slow resource load: ${resourceEntry.name}`, 'performance', {
              duration: resourceEntry.duration,
              size: resourceEntry.transferSize,
              type: resourceEntry.initiatorType,
            });
          }
        }
      }
    });

    observer.observe({ entryTypes: ['navigation', 'resource'] });
  }
};

/**
 * Мониторинг ошибок JavaScript
 */
export const initErrorMonitoring = () => {
  // Ошибки JavaScript
  window.addEventListener('error', (event) => {
    logger.error('JavaScript Error', event.error, 'error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
    });
  });

  // Необработанные промисы
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled Promise Rejection', event.reason, 'error', {
      reason: event.reason,
      promise: event.promise,
    });
  });
};

/**
 * Мониторинг использования памяти
 */
export const getMemoryUsage = (): {
  used: number;
  total: number;
  limit: number;
  percentage: number;
} | null => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100,
    };
  }
  return null;
};

/**
 * Мониторинг сетевых запросов
 */
export const initNetworkMonitoring = () => {
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          const duration = resourceEntry.responseEnd - resourceEntry.requestStart;

          logger.apiResponse(
            'FETCH',
            resourceEntry.name,
            resourceEntry.responseStatus || 200,
            duration,
            {
              size: resourceEntry.transferSize,
              type: resourceEntry.initiatorType,
            }
          );
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
  }
};
