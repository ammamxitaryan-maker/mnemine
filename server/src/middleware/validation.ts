/**
 * Validation middleware for API endpoints
 * Provides automatic request validation using Zod schemas
 */

import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { logger, LogContext } from '../utils/logger.js';
import { createErrorResponse } from '../types/api.js';

// Extend Request interface to include validated data
declare module 'express-serve-static-core' {
  interface Request {
    validatedData?: Record<string, unknown>;
  }
}

// Validation middleware factory
export const validateRequest = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const data = req[source];
      
      // Validate the data
      const validatedData = schema.parse(data);
      
      // Store validated data in request
      req.validatedData = validatedData;
      
      // Log successful validation
      logger.debug(LogContext.API, `Request validation successful for ${req.method} ${req.path}`, {
        source,
        fields: Object.keys(validatedData),
      }, {
        requestId: req.requestId,
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format validation errors
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
          code: err.code,
        }));
        
        logger.warn(LogContext.API, `Request validation failed for ${req.method} ${req.path}`, {
          source,
          errors: validationErrors,
          data: req[source],
        }, {
          requestId: req.requestId,
        });
        
        // Return validation error response
        res.status(400).json(createErrorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          req.requestId
        ));
        return;
      }
      
      // Handle unexpected errors
      logger.error(LogContext.API, 'Unexpected validation error', error, {
        requestId: req.requestId,
      });
      
      res.status(500).json(createErrorResponse(
        'Internal server error during validation',
        'INTERNAL_ERROR',
        req.requestId
      ));
    }
  };
};

// Multiple validation middleware
export const validateMultiple = (validations: Array<{
  schema: ZodSchema;
  source: 'body' | 'query' | 'params';
}>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validatedData: Record<string, unknown> = {};
      
      for (const { schema, source } of validations) {
        const data = req[source];
        const result = schema.parse(data);
        
        // Merge validated data
        Object.assign(validatedData, result);
      }
      
      // Store all validated data
      req.validatedData = validatedData;
      
      logger.debug(LogContext.API, `Multiple validation successful for ${req.method} ${req.path}`, {
        sources: validations.map(v => v.source),
        fields: Object.keys(validatedData),
      }, {
        requestId: req.requestId,
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          value: err.input,
          code: err.code,
        }));
        
        logger.warn(LogContext.API, `Multiple validation failed for ${req.method} ${req.path}`, {
          errors: validationErrors,
        }, {
          requestId: req.requestId,
        });
        
        res.status(400).json(createErrorResponse(
          'Validation failed',
          'VALIDATION_ERROR',
          req.requestId
        ));
        return;
      }
      
      logger.error(LogContext.API, 'Unexpected multiple validation error', error, {
        requestId: req.requestId,
      });
      
      res.status(500).json(createErrorResponse(
        'Internal server error during validation',
        'INTERNAL_ERROR',
        req.requestId
      ));
    }
  };
};

// Response validation middleware
export const validateResponse = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    
    res.send = function(data: unknown) {
      try {
        // Only validate if data is an object
        if (typeof data === 'object' && data !== null) {
          const validatedData = schema.parse(data);
          
          logger.debug(LogContext.API, `Response validation successful for ${req.method} ${req.path}`, {
            fields: Object.keys(validatedData),
          }, {
            requestId: req.requestId,
          });
          
          return originalSend.call(this, validatedData);
        }
        
        return originalSend.call(this, data);
      } catch (error) {
        if (error instanceof ZodError) {
          logger.error(LogContext.API, `Response validation failed for ${req.method} ${req.path}`, {
            errors: error.errors,
            data,
          }, {
            requestId: req.requestId,
          });
          
          // Return validation error response
          return originalSend.call(this, createErrorResponse(
            'Response validation failed',
            'RESPONSE_VALIDATION_ERROR',
            req.requestId
          ));
        }
        
        logger.error(LogContext.API, 'Unexpected response validation error', error, {
          requestId: req.requestId,
        });
        
        return originalSend.call(this, data);
      }
    };
    
    next();
  };
};

// Sanitization middleware
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize string inputs
    const sanitizeString = (str: string): string => {
      return str
        .trim()
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
    };
    
    const sanitizeObject = (obj: unknown): unknown => {
      if (typeof obj === 'string') {
        return sanitizeString(obj);
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const sanitized: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
      }
      
      return obj;
    };
    
    // Sanitize request body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body) as typeof req.body;
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query) as typeof req.query;
    }
    
    logger.debug(LogContext.API, `Input sanitization completed for ${req.method} ${req.path}`, {
      hasBody: !!req.body,
      hasQuery: !!req.query,
    }, {
      requestId: req.requestId,
    });
    
    next();
  } catch (error) {
    logger.error(LogContext.API, 'Input sanitization error', error, {
      requestId: req.requestId,
    });
    
    res.status(500).json(createErrorResponse(
      'Input sanitization failed',
      'SANITIZATION_ERROR',
      req.requestId
    ));
  }
};

// Rate limiting validation
export const validateRateLimit = (req: Request, res: Response, next: NextFunction): void => {
  // This would integrate with your rate limiting system
  // For now, just log the request
  logger.debug(LogContext.API, `Rate limit check for ${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  }, {
    requestId: req.requestId,
  });
  
  next();
};

// Content type validation
export const validateContentType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentType = req.get('Content-Type');
    
    if (req.method === 'GET' || req.method === 'DELETE') {
      // GET and DELETE requests don't need content type validation
      next();
      return;
    }
    
    if (!contentType) {
      logger.warn(LogContext.API, `Missing Content-Type header for ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      }, {
        requestId: req.requestId,
      });
      
      res.status(400).json(createErrorResponse(
        'Content-Type header is required',
        'MISSING_CONTENT_TYPE',
        req.requestId
      ));
      return;
    }
    
    const isValidType = allowedTypes.some(type => contentType.includes(type));
    
    if (!isValidType) {
      logger.warn(LogContext.API, `Invalid Content-Type for ${req.method} ${req.path}`, {
        contentType,
        allowedTypes,
        ip: req.ip,
      }, {
        requestId: req.requestId,
      });
      
      res.status(400).json(createErrorResponse(
        `Content-Type must be one of: ${allowedTypes.join(', ')}`,
        'INVALID_CONTENT_TYPE',
        req.requestId
      ));
      return;
    }
    
    next();
  };
};

// Export validation helpers
export const getValidatedData = <T>(req: Request): T => {
  return req.validatedData as T;
};

export const hasValidatedData = (req: Request): boolean => {
  return req.validatedData !== undefined;
};
