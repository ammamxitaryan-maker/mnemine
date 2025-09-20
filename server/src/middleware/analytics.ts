import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';

interface AnalyticsData {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  userAgent?: string;
  ip?: string;
  userId?: string;
  timestamp: Date;
}

export const analyticsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const analyticsData: AnalyticsData = {
    endpoint: req.path,
    method: req.method,
    responseTime: 0,
    statusCode: 0,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: (req as any).user?.telegramId,
    timestamp: new Date()
  };

  // Override res.end to capture response data
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    analyticsData.responseTime = Date.now() - startTime;
    analyticsData.statusCode = res.statusCode;
    
    // Log analytics data (in production, send to analytics service)
    if (process.env.NODE_ENV === 'production') {
      logAnalytics(analyticsData);
    } else {
      console.log('[ANALYTICS]', analyticsData);
    }
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

async function logAnalytics(data: AnalyticsData) {
  try {
    // In production, you would send this to your analytics service
    // For now, we'll just log it
    console.log('[ANALYTICS]', {
      ...data,
      timestamp: data.timestamp.toISOString()
    });
    
    // You could also store in database for analysis
    // await prisma.analyticsLog.create({ data });
  } catch (error) {
    console.error('[ANALYTICS] Error logging analytics:', error);
  }
}

export const performanceMetrics = {
  trackApiCall: (endpoint: string, duration: number, statusCode: number) => {
    if (process.env.NODE_ENV === 'production') {
      // Send to monitoring service (e.g., DataDog, New Relic, etc.)
      console.log(`[METRICS] API Call: ${endpoint} - ${duration}ms - ${statusCode}`);
    }
  },
  
  trackUserAction: (userId: string, action: string, metadata?: any) => {
    if (process.env.NODE_ENV === 'production') {
      console.log(`[METRICS] User Action: ${userId} - ${action}`, metadata);
    }
  },
  
  trackError: (error: Error, context?: any) => {
    console.error(`[METRICS] Error: ${error.message}`, {
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
};
