import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from './responseHelpers.js';

// Advanced validation functions
export const validateTelegramId = (telegramId: string): boolean => {
  return /^\d{5,20}$/.test(telegramId);
};

export const validateAmount = (amount: any): { isValid: boolean; error?: string } => {
  if (typeof amount !== 'number') {
    return { isValid: false, error: 'Amount must be a number' };
  }
  
  if (isNaN(amount) || !isFinite(amount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }
  
  if (amount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }
  
  if (amount > 1000000) {
    return { isValid: false, error: 'Amount cannot exceed 1,000,000 USD' };
  }
  
  // Check for precision issues
  if (amount !== Math.round(amount * 100) / 100) {
    return { isValid: false, error: 'Amount cannot have more than 2 decimal places' };
  }
  
  return { isValid: true };
};

export const validateAddress = (address: string): boolean => {
  // USD TRC20 address validation - more strict
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address) && address.length === 34;
};

export const validateLotteryNumbers = (numbers: any): { isValid: boolean; error?: string } => {
  if (!Array.isArray(numbers)) {
    return { isValid: false, error: 'Numbers must be an array' };
  }
  
  if (numbers.length !== 6) {
    return { isValid: false, error: 'Exactly 6 numbers are required' };
  }
  
  for (const num of numbers) {
    if (typeof num !== 'number' || !Number.isInteger(num)) {
      return { isValid: false, error: 'All numbers must be integers' };
    }
    
    if (num < 1 || num > 49) {
      return { isValid: false, error: 'Numbers must be between 1 and 49' };
    }
  }
  
  // Check for duplicates
  const uniqueNumbers = new Set(numbers);
  if (uniqueNumbers.size !== 6) {
    return { isValid: false, error: 'Numbers must be unique' };
  }
  
  return { isValid: true };
};

export const validateTaskId = (taskId: string): boolean => {
  return typeof taskId === 'string' && taskId.length > 0 && taskId.length <= 100;
};

export const validateBoosterId = (boosterId: string): boolean => {
  return typeof boosterId === 'string' && /^[a-zA-Z0-9_-]+$/.test(boosterId) && boosterId.length <= 50;
};

// Middleware for request validation
export const validateRequestParams = (requiredParams: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = requiredParams.filter(param => !req.params[param]);
    
    if (missing.length > 0) {
      return ResponseHelper.badRequest(res, `Missing required parameters: ${missing.join(', ')}`);
    }
    
    // Validate telegramId if present
    if (req.params.telegramId && !validateTelegramId(req.params.telegramId)) {
      return ResponseHelper.badRequest(res, 'Invalid telegram ID format');
    }
    
    next();
  };
};

export const validateRequestBody = (requiredFields: string[], validators?: { [key: string]: (value: any) => { isValid: boolean; error?: string } }) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missing = requiredFields.filter(field => req.body[field] === undefined || req.body[field] === null);
    
    if (missing.length > 0) {
      return ResponseHelper.badRequest(res, `Missing required fields: ${missing.join(', ')}`);
    }
    
    // Apply custom validators if provided
    if (validators) {
      for (const [field, validator] of Object.entries(validators)) {
        if (req.body[field] !== undefined) {
          const result = validator(req.body[field]);
          if (!result.isValid) {
            return ResponseHelper.badRequest(res, result.error || `Invalid ${field}`);
          }
        }
      }
    }
    
    next();
  };
};

// Rate limiting validation
export const validateRateLimit = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [k, v] of requests.entries()) {
      if (v.resetTime < windowStart) {
        requests.delete(k);
      }
    }
    
    const current = requests.get(key);
    
    if (!current) {
      requests.set(key, { count: 1, resetTime: now });
      return next();
    }
    
    // Rate limiting disabled - allow all requests
    next();
  };
};

// Sanitization functions
export const sanitizeString = (input: string, maxLength: number = 1000): string => {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>"'%;()&+]/g, '') // Remove dangerous characters
    .trim()
    .substring(0, maxLength);
};

export const sanitizeNumber = (input: any): number | null => {
  const num = Number(input);
  return isNaN(num) || !isFinite(num) ? null : num;
};

// Database validation helpers
export const validateDatabaseTransaction = async <T>(
  transaction: () => Promise<T>
): Promise<{ success: boolean; data?: T; error?: string }> => {
  try {
    const data = await transaction();
    return { success: true, data };
  } catch (error) {
    console.error('Database transaction failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
};

// Input validation for specific operations
export const validateDepositRequest = (req: Request, res: Response, next: NextFunction) => {
  const { amount } = req.body;
  const { telegramId } = req.params;
  
  if (!validateTelegramId(telegramId)) {
    return ResponseHelper.badRequest(res, 'Invalid telegram ID format');
  }
  
  const amountValidation = validateAmount(amount);
  if (!amountValidation.isValid) {
    return ResponseHelper.badRequest(res, amountValidation.error);
  }
  
  next();
};

export const validateWithdrawalRequest = (req: Request, res: Response, next: NextFunction) => {
  const { amount, address } = req.body;
  const { telegramId } = req.params;
  
  if (!validateTelegramId(telegramId)) {
    return ResponseHelper.badRequest(res, 'Invalid telegram ID format');
  }
  
  const amountValidation = validateAmount(amount);
  if (!amountValidation.isValid) {
    return ResponseHelper.badRequest(res, amountValidation.error);
  }
  
  if (!validateAddress(address)) {
    return ResponseHelper.badRequest(res, 'Invalid USD TRC20 address format');
  }
  
  next();
};

export const validateLotteryRequest = (req: Request, res: Response, next: NextFunction) => {
  const { numbers } = req.body;
  const { telegramId } = req.params;
  
  if (!validateTelegramId(telegramId)) {
    return ResponseHelper.badRequest(res, 'Invalid telegram ID format');
  }
  
  const numbersValidation = validateLotteryNumbers(numbers);
  if (!numbersValidation.isValid) {
    return ResponseHelper.badRequest(res, numbersValidation.error);
  }
  
  next();
};

