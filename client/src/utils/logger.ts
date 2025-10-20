/**
 * Система логирования для админ панели
 */


// Уровни логирования
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

// Типы логов
export enum LogCategory {
  AUTH = 'auth',
  API = 'api',
  UI = 'ui',
  SYSTEM = 'system',
  USER_ACTION = 'user_action',
  ERROR = 'error',
  PERFORMANCE = 'performance',
}

// Интерфейс лога
export interface LogEntry {
  id: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
  stack?: string;
  url?: string;
  userAgent?: string;
}

// Конфигурация логирования
interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageSize: number;
  enableRemote: boolean;
  remoteEndpoint?: string;
}

class AdminLogger {
  private config: LoggerConfig;
  private logs: LogEntry[] = [];
  private sessionId: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageSize: 1000,
      enableRemote: false,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
  }

  /**
   * Генерация ID сессии
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Создание записи лога
   */
  private createLogEntry(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, unknown>,
    error?: Error
  ): LogEntry {
    return {
      id: Math.random().toString(36).substr(2, 9),
      level,
      category,
      message,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      metadata,
      stack: error?.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };
  }

  /**
   * Запись лога
   */
  private writeLog(entry: LogEntry): void {
    // Проверяем уровень логирования
    if (entry.level < this.config.level) {
      return;
    }

    // Добавляем в массив логов
    this.logs.push(entry);

    // Ограничиваем размер массива
    if (this.logs.length > this.config.maxStorageSize) {
      this.logs = this.logs.slice(-this.config.maxStorageSize);
    }

    // Выводим в консоль
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Сохраняем в localStorage
    if (this.config.enableStorage) {
      this.saveToStorage();
    }

    // Отправляем на сервер
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  /**
   * Вывод в консоль
   */
  private logToConsole(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const prefix = `[${timestamp}] [${entry.category}] [${LogLevel[entry.level]}]`;

    const logData = {
      message: entry.message,
      metadata: entry.metadata,
      sessionId: entry.sessionId,
      url: entry.url,
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.log(prefix, logData);
        break;
      case LogLevel.INFO:
        console.log(prefix, logData);
        break;
      case LogLevel.WARN:
        console.warn(prefix, logData);
        break;
      case LogLevel.ERROR:
        console.error(prefix, logData, entry.stack);
        break;
    }
  }

  /**
   * Сохранение в localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem('admin_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.warn('[LOGGER] Failed to save logs to localStorage:', error);
    }
  }

  /**
   * Загрузка из localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('admin_logs');
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[LOGGER] Failed to load logs from localStorage:', error);
    }
  }

  /**
   * Отправка на сервер
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    try {
      await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.warn('[LOGGER] Failed to send log to remote:', error);
    }
  }

  /**
   * Методы логирования
   */
  debug(message: string, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createLogEntry(LogLevel.DEBUG, LogCategory.SYSTEM, message, metadata));
  }

  info(message: string, category: LogCategory = LogCategory.SYSTEM, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createLogEntry(LogLevel.INFO, category, message, metadata));
  }

  warn(message: string, category: LogCategory = LogCategory.SYSTEM, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createLogEntry(LogLevel.WARN, category, message, metadata));
  }

  error(message: string, error?: Error, category: LogCategory = LogCategory.ERROR, metadata?: Record<string, unknown>): void {
    this.writeLog(this.createLogEntry(LogLevel.ERROR, category, message, metadata, error));
  }

  /**
   * Логирование действий пользователя
   */
  userAction(action: string, metadata?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, LogCategory.USER_ACTION, metadata);
  }

  /**
   * Логирование API запросов
   */
  apiRequest(method: string, url: string, metadata?: Record<string, unknown>): void {
    this.info(`API ${method} ${url}`, LogCategory.API, metadata);
  }

  apiResponse(method: string, url: string, status: number, duration: number, metadata?: Record<string, unknown>): void {
    this.info(`API ${method} ${url} - ${status} (${duration}ms)`, LogCategory.API, {
      ...metadata,
      status,
      duration,
    });
  }

  /**
   * Логирование производительности
   */
  performance(operation: string, duration: number, metadata?: Record<string, unknown>): void {
    this.info(`Performance: ${operation} took ${duration}ms`, LogCategory.PERFORMANCE, {
      ...metadata,
      duration,
    });
  }

  /**
   * Получение логов
   */
  getLogs(filter?: {
    level?: LogLevel;
    category?: LogCategory;
    startTime?: string;
    endTime?: string;
    limit?: number;
  }): LogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter) {
      if (filter.level !== undefined) {
        filteredLogs = filteredLogs.filter(log => log.level >= filter.level!);
      }

      if (filter.category) {
        filteredLogs = filteredLogs.filter(log => log.category === filter.category);
      }

      if (filter.startTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startTime!);
      }

      if (filter.endTime) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endTime!);
      }

      if (filter.limit) {
        filteredLogs = filteredLogs.slice(-filter.limit);
      }
    }

    return filteredLogs.reverse(); // Новые логи сверху
  }

  /**
   * Очистка логов
   */
  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('admin_logs');
  }

  /**
   * Экспорт логов
   */
  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'csv') {
      const headers = ['timestamp', 'level', 'category', 'message', 'sessionId', 'url'];
      const csvContent = [
        headers.join(','),
        ...this.logs.map(log => [
          log.timestamp,
          LogLevel[log.level],
          log.category,
          `"${log.message.replace(/"/g, '""')}"`,
          log.sessionId,
          log.url,
        ].join(','))
      ].join('\n');
      return csvContent;
    }

    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Статистика логов
   */
  getStats(): {
    total: number;
    byLevel: Record<string, number>;
    byCategory: Record<string, number>;
    errors: number;
    warnings: number;
  } {
    const stats = {
      total: this.logs.length,
      byLevel: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
      errors: 0,
      warnings: 0,
    };

    this.logs.forEach(log => {
      const levelName = LogLevel[log.level];
      const categoryName = log.category;

      stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
      stats.byCategory[categoryName] = (stats.byCategory[categoryName] || 0) + 1;

      if (log.level === LogLevel.ERROR) stats.errors++;
      if (log.level === LogLevel.WARN) stats.warnings++;
    });

    return stats;
  }
}

// Создаем глобальный экземпляр логгера
export const logger = new AdminLogger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableStorage: true,
  maxStorageSize: 1000,
  enableRemote: false,
});

// Хук для использования логгера в компонентах
export const useLogger = () => {
  return {
    debug: logger.debug.bind(logger),
    info: logger.info.bind(logger),
    warn: logger.warn.bind(logger),
    error: logger.error.bind(logger),
    userAction: logger.userAction.bind(logger),
    apiRequest: logger.apiRequest.bind(logger),
    apiResponse: logger.apiResponse.bind(logger),
    performance: logger.performance.bind(logger),
    getLogs: logger.getLogs.bind(logger),
    clearLogs: logger.clearLogs.bind(logger),
    exportLogs: logger.exportLogs.bind(logger),
    getStats: logger.getStats.bind(logger),
  };
};
