import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 } as AppError;
  }

  // Mongoose duplicate key
  if (err.name === 'MongoError' && (err as any).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { message, statusCode: 400 } as AppError;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message).join(', ');
    error = { message, statusCode: 400 } as AppError;
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    switch (prismaError.code) {
      case 'P2002':
        error = { message: 'Duplicate field value entered', statusCode: 400 } as AppError;
        break;
      case 'P2025':
        error = { message: 'Record not found', statusCode: 404 } as AppError;
        break;
      default:
        error = { message: 'Database error', statusCode: 500 } as AppError;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = { message: 'Invalid token', statusCode: 401 } as AppError;
  }

  if (err.name === 'TokenExpiredError') {
    error = { message: 'Token expired', statusCode: 401 } as AppError;
  }

  // Rate limit errors
  if (err.message && err.message.includes('Too many requests')) {
    error = { message: err.message, statusCode: 429 } as AppError;
  }

  // CORS errors
  if (err.message && err.message.includes('CORS')) {
    error = { message: 'CORS policy violation', statusCode: 403 } as AppError;
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(isDevelopment && { 
      stack: err.stack,
      details: error
    }),
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  });
};
