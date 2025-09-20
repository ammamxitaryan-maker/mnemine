import { Request, Response, NextFunction } from 'express';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Log request
  console.log(`[REQUEST] ${req.method} ${req.url} - ${req.ip} - ${req.get('User-Agent') || 'Unknown'}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    
    // Log response
    console.log(`[RESPONSE] ${req.method} ${req.url} - ${statusCode} - ${duration}ms`);
    
    // Call original end and return the result
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};
