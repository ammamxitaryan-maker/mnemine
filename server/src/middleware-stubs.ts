// Middleware stubs - all middleware functionality removed
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'jwt-secret-dev-only-not-for-production';

export const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const extractUserIdFromParams = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Check Telegram init data for admin access
    const telegramInitData = req.headers['x-telegram-init-data'];
    // Get admin IDs from environment variable, fallback to default for development
    const adminIdsString = process.env.ADMIN_TELEGRAM_IDS || '6760298907';
    const ADMIN_TELEGRAM_IDS = adminIdsString.split(',').map(id => id.trim());
    
    if (!telegramInitData) {
      return res.status(401).json({
        success: false,
        error: 'No Telegram authentication data provided'
      });
    }

    // Parse Telegram init data to get user information
    const urlParams = new URLSearchParams(telegramInitData as string);
    const userStr = urlParams.get('user');
    
    if (!userStr) {
      return res.status(401).json({
        success: false,
        error: 'No user data in Telegram init data'
      });
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (parseError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid user data format'
      });
    }
    const userTelegramId = user.id?.toString();

    // Check if the user's Telegram ID is in the admin list
    if (!ADMIN_TELEGRAM_IDS.includes(userTelegramId)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    // Set admin user data
    req.user = { 
      adminId: userTelegramId, 
      permissions: ['all'],
      telegramId: userTelegramId,
      firstName: user.first_name,
      username: user.username
    };
    next();
  } catch (error) {
    console.error('Admin authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Admin authentication error'
    });
  }
};

export const realTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const rateLimitMiddleware = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};

export const dataFreshnessMiddleware = (maxAge: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    next();
  };
};
