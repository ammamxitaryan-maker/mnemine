import { Request, Response, NextFunction } from 'express';

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startUsage = process.cpuUsage();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture metrics
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const endUsage = process.cpuUsage(startUsage);
    const duration = endTime - startTime;

    // Calculate metrics
    const metrics = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      cpuUsage: endUsage.user + endUsage.system,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
    };

    // Log slow requests
    if (duration > 1000) {
      console.warn('[PERFORMANCE] Slow request detected:', metrics);
    }

    // Log metrics for monitoring (in production, send to monitoring service)
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to monitoring service (DataDog, New Relic, etc.)
      console.log('[METRICS]', JSON.stringify(metrics));
    }

    // Call original end function
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Memory usage monitoring
export const memoryMonitor = () => {
  const interval = setInterval(() => {
    const usage = process.memoryUsage();
    const usageInMB = {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    };

    // Log memory usage every 5 minutes
    console.log('[MEMORY] Usage:', usageInMB);

    // Alert if memory usage is high
    if (usageInMB.heapUsed > 500) { // 500MB threshold
      console.warn('[MEMORY] High memory usage detected:', usageInMB);
    }
  }, 5 * 60 * 1000); // 5 minutes

  return interval;
};

// Error tracking middleware
export const errorTracker = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    body: req.body,
    query: req.query,
    params: req.params,
  };

  // Log error
  console.error('[ERROR]', JSON.stringify(errorData));

  // In production, send to error tracking service (Sentry, LogRocket, etc.)
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to error tracking service
    // Sentry.captureException(error, { extra: errorData });
  }

  next(error);
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const originalEnd = res.end;

  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    
    const logData = {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };

    // Log all requests in development, only errors in production
    if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
      console.log('[REQUEST]', JSON.stringify(logData));
    }

    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Database query monitoring
export const queryMonitor = (query: string, duration: number, params?: any[]) => {
  if (duration > 1000) { // Log slow queries (>1s)
    console.warn('[DATABASE] Slow query detected:', {
      query: query.substring(0, 200), // Truncate for logging
      duration: duration,
      params: params,
      timestamp: new Date().toISOString(),
    });
  }

  // Log all queries in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[DATABASE] Query executed:', {
      query: query.substring(0, 100),
      duration: duration,
    });
  }
};

// Health check endpoint data
export const getHealthData = () => {
  const usage = process.memoryUsage();
  const uptime = process.uptime();
  
  return {
    status: 'healthy',
    uptime: uptime,
    memory: {
      rss: Math.round(usage.rss / 1024 / 1024),
      heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
      external: Math.round(usage.external / 1024 / 1024),
    },
    cpu: process.cpuUsage(),
    version: process.env.npm_package_version || '1.0.0',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    timestamp: new Date().toISOString(),
  };
};
