/**
 * Centralized logging system for NONMINE application
 * Provides structured logging with different levels and contexts
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogContext {
  SERVER = 'SERVER',
  DATABASE = 'DATABASE',
  WEBSOCKET = 'WEBSOCKET',
  API = 'API',
  AUTH = 'AUTH',
  TELEGRAM = 'TELEGRAM',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  BUSINESS = 'BUSINESS',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context: LogContext;
  message: string;
  data?: any;
  userId?: string;
  requestId?: string;
  duration?: number;
}

class Logger {
  private static instance: Logger;
  private currentLevel: LogLevel;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.currentLevel = this.isProduction ? LogLevel.INFO : LogLevel.DEBUG;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLevel(level: LogLevel): void {
    this.currentLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const { timestamp, level, context, message, data, userId, requestId, duration } = entry;

    let formatted = `[${timestamp}] [${LogLevel[level]}] [${context}] ${message}`;

    if (userId) formatted += ` | User: ${userId}`;
    if (requestId) formatted += ` | Request: ${requestId}`;
    if (duration !== undefined) formatted += ` | Duration: ${duration}ms`;

    return formatted;
  }

  private log(level: LogLevel, context: LogContext, message: string, data?: any, meta?: {
    userId?: string;
    requestId?: string;
    duration?: number;
  }): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
      ...meta,
    };

    const formattedMessage = this.formatMessage(entry);

    // Choose appropriate console method
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, data ? data : '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, data ? data : '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, data ? data : '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, data ? data : '');
        break;
    }

    // In production, you might want to send logs to external service
    if (this.isProduction && level >= LogLevel.ERROR) {
      this.sendToExternalService(entry);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service (e.g., Sentry, LogRocket)
    // For now, just ensure critical errors are visible
  }

  // Public logging methods
  public debug(context: LogContext, message: string, data?: any, meta?: any): void {
    this.log(LogLevel.DEBUG, context, message, data, meta);
  }

  public info(context: LogContext, message: string, data?: any, meta?: any): void {
    this.log(LogLevel.INFO, context, message, data, meta);
  }

  public warn(context: LogContext, message: string, data?: any, meta?: any): void {
    this.log(LogLevel.WARN, context, message, data, meta);
  }

  public error(context: LogContext, message: string, error?: Error | any, meta?: any): void {
    const errorData = error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name,
    } : error;

    this.log(LogLevel.ERROR, context, message, errorData, meta);
  }

  // Convenience methods for common contexts
  public server(message: string, data?: any, meta?: any): void {
    this.info(LogContext.SERVER, message, data, meta);
  }

  public database(message: string, data?: any, meta?: any): void {
    this.info(LogContext.DATABASE, message, data, meta);
  }

  public websocket(message: string, data?: any, meta?: any): void {
    this.info(LogContext.WEBSOCKET, message, data, meta);
  }

  public api(message: string, data?: any, meta?: any): void {
    this.info(LogContext.API, message, data, meta);
  }

  public auth(message: string, data?: any, meta?: any): void {
    this.info(LogContext.AUTH, message, data, meta);
  }

  public telegram(message: string, data?: any, meta?: any): void {
    this.info(LogContext.TELEGRAM, message, data, meta);
  }

  public performance(message: string, data?: any, meta?: any): void {
    this.info(LogContext.PERFORMANCE, message, data, meta);
  }

  public security(message: string, data?: any, meta?: any): void {
    this.warn(LogContext.SECURITY, message, data, meta);
  }

  public business(message: string, data?: any, meta?: any): void {
    this.info(LogContext.BUSINESS, message, data, meta);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (context: LogContext, message: string, data?: any, meta?: any) =>
    logger.debug(context, message, data, meta),
  info: (context: LogContext, message: string, data?: any, meta?: any) =>
    logger.info(context, message, data, meta),
  warn: (context: LogContext, message: string, data?: any, meta?: any) =>
    logger.warn(context, message, data, meta),
  error: (context: LogContext, message: string, error?: Error | any, meta?: any) =>
    logger.error(context, message, error, meta),

  // Context-specific shortcuts
  server: (message: string, data?: any, meta?: any) => logger.server(message, data, meta),
  database: (message: string, data?: any, meta?: any) => logger.database(message, data, meta),
  websocket: (message: string, data?: any, meta?: any) => logger.websocket(message, data, meta),
  api: (message: string, data?: any, meta?: any) => logger.api(message, data, meta),
  auth: (message: string, data?: any, meta?: any) => logger.auth(message, data, meta),
  telegram: (message: string, data?: any, meta?: any) => logger.telegram(message, data, meta),
  performance: (message: string, data?: any, meta?: any) => logger.performance(message, data, meta),
  security: (message: string, data?: any, meta?: any) => logger.security(message, data, meta),
  business: (message: string, data?: any, meta?: any) => logger.business(message, data, meta),
};

// Performance timing utility
export class PerformanceTimer {
  private startTime: number;
  private context: LogContext;
  private operation: string;

  constructor(context: LogContext, operation: string) {
    this.context = context;
    this.operation = operation;
    this.startTime = Date.now();
  }

  public end(data?: any, meta?: any): number {
    const duration = Date.now() - this.startTime;
    logger.performance(`${this.operation} completed`, data, { ...meta, duration });
    return duration;
  }

  public checkpoint(message: string, data?: any): void {
    const elapsed = Date.now() - this.startTime;
    logger.performance(`${this.operation} - ${message}`, data, { elapsed });
  }
}

// Request ID generator for tracing
export const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
