export function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Optional but recommended environment variables
  const recommendedEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'SESSION_SECRET'
  ];

  const missingRecommended = recommendedEnvVars.filter(varName => !process.env[varName]);

  if (missingRecommended.length > 0) {
    console.warn(`[VALIDATION] Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    console.warn('[VALIDATION] These variables will use default values, which is not recommended for production');
  }

  // Validate JWT secret length if provided
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate encryption key length if provided
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
    console.error('[ENV] ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY.length);
    console.warn('[ENV] ENCRYPTION_KEY is too short (minimum 32 characters)');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters in production');
    }
    process.env.ENCRYPTION_KEY = 'nonmine-encryption-key-32chars-1234';
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.warn('Warning: DATABASE_URL should be a valid PostgreSQL connection string');
  }

  console.log('[VALIDATION] Environment variables validated successfully');
}

export function validateAmount(amount: any): boolean {
  return typeof amount === 'number' &&
    !isNaN(amount) &&
    isFinite(amount) &&
    amount >= 0.001 && // Very low minimum
    amount <= 1000000; // Max 1M USD
}

// Response helper functions
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ResponseHelper {
  static success<T>(res: any, data: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message
    };
    res.status(statusCode).json(response);
  }

  static error(res: any, error: string, statusCode: number = 500): void {
    const response: ApiResponse = {
      success: false,
      error
    };
    res.status(statusCode).json(response);
  }

  static notFound(res: any, resource: string = 'Resource'): void {
    this.error(res, `${resource} not found`, 404);
  }

  static unauthorized(res: any, message: string = 'Unauthorized'): void {
    this.error(res, message, 401);
  }

  static forbidden(res: any, message: string = 'Forbidden'): void {
    this.error(res, message, 403);
  }

  static badRequest(res: any, message: string = 'Bad Request'): void {
    this.error(res, message, 400);
  }

  static internalError(res: any, message: string = 'Internal Server Error'): void {
    this.error(res, message, 500);
  }

  static conflict(res: any, message: string = 'Conflict'): void {
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

export function validateAddress(address: string): boolean {
  // USD TRC20 address validation
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

export function sanitizeInput(input: string): string | null {
  if (!input || typeof input !== 'string') return null;

  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>"'%;()&+]/g, '') // Remove dangerous characters
    .trim()
    .substring(0, 1000); // Limit length

  return sanitized.length > 0 ? sanitized : null;
}

export function validateTelegramId(telegramId: string): boolean {
  return /^\d+$/.test(telegramId) && telegramId.length >= 5 && telegramId.length <= 20;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

