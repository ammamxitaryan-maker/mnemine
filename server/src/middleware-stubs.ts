// Middleware stubs - all middleware functionality removed
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Request interface to include user property
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      telegramId: string;
      role: string;
      adminId?: string;
      permissions?: string[];
      firstName?: string;
      username?: string;
    };
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
    // Check for admin token first (for admin panel access)
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    const telegramInitData = req.headers['x-telegram-init-data'];

    // Get admin IDs from environment variable, fallback to default for development
    const adminIdsString = process.env.ADMIN_TELEGRAM_IDS || '6760298907';
    const ADMIN_TELEGRAM_IDS = adminIdsString.split(',').map(id => id.trim());

    console.log('[ADMIN_MIDDLEWARE] Request path:', req.path);
    console.log('[ADMIN_MIDDLEWARE] Admin token:', adminToken ? 'Present' : 'Not present');
    console.log('[ADMIN_MIDDLEWARE] Telegram init data:', telegramInitData ? 'Present' : 'Not present');
    console.log('[ADMIN_MIDDLEWARE] Admin IDs:', ADMIN_TELEGRAM_IDS);

    // Check admin token first (for admin panel)
    if (adminToken) {
      try {
        // Try to decode as base64 first (client-side token)
        try {
          const decoded = JSON.parse(Buffer.from(adminToken, 'base64').toString());
          if (decoded.isAdmin && decoded.telegramId && ADMIN_TELEGRAM_IDS.includes(decoded.telegramId)) {
            req.user = {
              id: decoded.telegramId,
              role: 'admin',
              adminId: decoded.telegramId,
              permissions: ['all'],
              telegramId: decoded.telegramId,
              firstName: decoded.firstName,
              username: decoded.username
            };
            console.log('[ADMIN_MIDDLEWARE] Admin access granted via base64 token for user:', decoded.telegramId);
            return next();
          }
        } catch (base64Error) {
          // Fallback to JWT verification
          const decoded = jwt.verify(adminToken, JWT_SECRET) as any;
          if (decoded.isAdmin) {
            // Check if it's a browser admin token (no telegramId required)
            if (decoded.adminId === 'browser-admin' || decoded.telegramId && ADMIN_TELEGRAM_IDS.includes(decoded.telegramId)) {
              req.user = {
                id: decoded.adminId || decoded.telegramId || 'browser-admin',
                role: 'admin',
                adminId: decoded.adminId || decoded.telegramId,
                permissions: ['all'],
                telegramId: decoded.telegramId,
                firstName: decoded.firstName || 'Browser Admin',
                username: decoded.username || 'browser-admin'
              };
              console.log('[ADMIN_MIDDLEWARE] Admin access granted via JWT token for user:', decoded.adminId || decoded.telegramId);
              return next();
            }
          }
        }
      } catch (tokenError) {
        console.log('[ADMIN_MIDDLEWARE] Invalid admin token:', tokenError);
      }
    }

    // Fallback to Telegram init data
    if (!telegramInitData) {
      console.log('[ADMIN_MIDDLEWARE] No authentication data provided');
      return res.status(401).json({
        success: false,
        error: 'No authentication data provided'
      });
    }

    // Parse Telegram init data to get user information
    const urlParams = new URLSearchParams(telegramInitData as string);
    const userStr = urlParams.get('user');

    console.log('[ADMIN_MIDDLEWARE] User string from init data:', userStr);

    if (!userStr) {
      console.log('[ADMIN_MIDDLEWARE] No user data in Telegram init data');
      return res.status(401).json({
        success: false,
        error: 'No user data in Telegram init data'
      });
    }

    let user;
    try {
      user = JSON.parse(userStr);
      console.log('[ADMIN_MIDDLEWARE] Parsed user:', user);
    } catch (parseError) {
      console.log('[ADMIN_MIDDLEWARE] Failed to parse user data:', parseError);
      return res.status(401).json({
        success: false,
        error: 'Invalid user data format'
      });
    }
    const userTelegramId = user.id?.toString();
    console.log('[ADMIN_MIDDLEWARE] User Telegram ID:', userTelegramId);
    console.log('[ADMIN_MIDDLEWARE] Is user in admin list?', ADMIN_TELEGRAM_IDS.includes(userTelegramId));

    // Check if the user's Telegram ID is in the admin list
    if (!ADMIN_TELEGRAM_IDS.includes(userTelegramId)) {
      console.log('[ADMIN_MIDDLEWARE] Access denied - user not in admin list');
      return res.status(403).json({
        success: false,
        error: 'Access denied. Admin privileges required.'
      });
    }

    // Set admin user data
    req.user = {
      id: userTelegramId,
      role: 'admin',
      adminId: userTelegramId,
      permissions: ['all'],
      telegramId: userTelegramId,
      firstName: user.first_name,
      username: user.username
    };
    console.log('[ADMIN_MIDDLEWARE] Admin access granted for user:', userTelegramId);
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
