import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../utils/responseHelpers';

// Request validation middleware
export const validateRequest = (requiredFields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const body = req.body;
    const params = req.params;
    const query = req.query;

    const allData = { ...body, ...params, ...query };
    const missing = requiredFields.filter(field => !allData[field]);

    if (missing.length > 0) {
      return ResponseHelper.badRequest(res, `Missing required fields: ${missing.join(', ')}`);
    }

    next();
  };
};

// Rate limiting middleware with custom options
export const customRateLimit = (options: {
  windowMs: number;
  max: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // This would integrate with your existing rate limiting logic
    // For now, just pass through
    next();
  };
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const originalSend = res.send;

  res.send = function (body) {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    return originalSend.call(this, body);
  };

  next();
};

// Error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return ResponseHelper.badRequest(res, err.message);
  }

  if (err.name === 'UnauthorizedError') {
    return ResponseHelper.unauthorized(res, err.message);
  }

  if (err.name === 'ForbiddenError') {
    return ResponseHelper.forbidden(res, err.message);
  }

  if (err.name === 'NotFoundError') {
    return ResponseHelper.notFound(res, err.message);
  }

  // Default to internal server error
  ResponseHelper.internalError(res, 'An unexpected error occurred');
};

// CORS middleware with custom options
export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://mnemine-app.onrender.com',
      'https://mnemine-production.onrender.com',
      'https://mnemine-production-fixed.onrender.com',
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID', 'X-Retry-Count'],
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Basic sanitization - remove potentially dangerous characters
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/[<>\"']/g, '');
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const key in obj) {
        sanitized[key] = sanitize(obj[key]);
      }
      return sanitized;
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

// Performance monitoring middleware
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
    
    // Log slow requests
    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path} took ${duration.toFixed(2)}ms`);
    }
    
    // You could send metrics to monitoring service here
  });

  next();
};
