/**
 * Request logging middleware
 * Provides structured logging for HTTP requests with performance metrics
 */

import { Request, Response, NextFunction } from 'express';
import { logger, LogContext, generateRequestId, PerformanceTimer } from '../utils/logger.js';

// Extend Request interface to include our custom properties
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      startTime: number;
      performanceTimer: PerformanceTimer;
    }
  }
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  // Generate unique request ID for tracing
  req.requestId = generateRequestId();
  req.startTime = Date.now();
  
  // Create performance timer
  req.performanceTimer = new PerformanceTimer(LogContext.API, `${req.method} ${req.path}`);

  // Log request start
  logger.api(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    headers: {
      'user-agent': req.get('User-Agent'),
      'content-type': req.get('Content-Type'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer'),
    },
    ip: req.ip,
    body: req.method !== 'GET' ? req.body : undefined,
  }, {
    requestId: req.requestId,
    userId: req.headers['x-user-id'] as string,
  });

  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - req.startTime;
    
    // Log response
    logger.api(`${req.method} ${req.path} - ${res.statusCode}`, {
      statusCode: res.statusCode,
      responseTime: duration,
      contentLength: res.get('Content-Length'),
    }, {
      requestId: req.requestId,
      duration,
    });

    // Log performance metrics
    req.performanceTimer.end({
      statusCode: res.statusCode,
      responseTime: duration,
    }, {
      requestId: req.requestId,
    });

    // Log errors for 4xx and 5xx responses
    if (res.statusCode >= 400) {
      logger.error(LogContext.API, `Request failed: ${req.method} ${req.path}`, {
        statusCode: res.statusCode,
        duration,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method !== 'GET' ? req.body : undefined,
      }, {
        requestId: req.requestId,
        duration,
      });
    }

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Middleware for logging WebSocket connections
export const websocketLogger = (req: Request, res: Response, next: NextFunction): void => {
  const isWebSocket = req.headers.upgrade === 'websocket';
  
  if (isWebSocket) {
    logger.websocket('WebSocket connection attempt', {
      path: req.path,
      headers: {
        'user-agent': req.get('User-Agent'),
        'origin': req.get('Origin'),
        'sec-websocket-protocol': req.get('Sec-WebSocket-Protocol'),
      },
      ip: req.ip,
    }, {
      requestId: req.requestId,
    });
  }

  next();
};

// Middleware for logging authentication attempts
export const authLogger = (req: Request, res: Response, next: NextFunction): void => {
  const isAuthRoute = req.path.includes('/auth') || req.path.includes('/login');
  
  if (isAuthRoute) {
    logger.auth(`Authentication attempt: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      hasTelegramData: !!req.headers['x-telegram-init-data'],
    }, {
      requestId: req.requestId,
    });
  }

  next();
};

// Middleware for logging business operations
export const businessLogger = (req: Request, res: Response, next: NextFunction): void => {
  const businessRoutes = ['/slots', '/lottery', '/swap', '/withdraw', '/deposit'];
  const isBusinessRoute = businessRoutes.some(route => req.path.includes(route));
  
  if (isBusinessRoute) {
    logger.business(`Business operation: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      operation: req.path.split('/').pop(),
      amount: req.body?.amount,
      currency: req.body?.currency,
    }, {
      requestId: req.requestId,
      userId: req.headers['x-user-id'] as string,
    });
  }

  next();
};
