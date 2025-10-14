import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ResponseHelper {
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    res.status(statusCode).json(response);
  }

  static error(res: Response, error: string, statusCode: number = 500): void {
    const response: ApiResponse = {
      success: false,
      error
    };
    res.status(statusCode).json(response);
  }

  static notFound(res: Response, resource: string = 'Resource'): void {
    this.error(res, `${resource} not found`, 404);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): void {
    this.error(res, message, 403);
  }

  static badRequest(res: Response, message: string = 'Bad Request'): void {
    this.error(res, message, 400);
  }

  static internalError(res: Response, message: string = 'Internal Server Error'): void {
    this.error(res, message, 500);
  }

  static conflict(res: Response, message: string = 'Conflict'): void {
    this.error(res, message, 409);
  }
}

// Async error handler wrapper
export const asyncHandler = (fn: (...args: any[]) => Promise<any>) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Validation helper
export const validateRequired = (data: any, fields: string[]): string[] => {
  const missing: string[] = [];
  fields.forEach(field => {
    if (!data[field]) {
      missing.push(field);
    }
  });
  return missing;
};
