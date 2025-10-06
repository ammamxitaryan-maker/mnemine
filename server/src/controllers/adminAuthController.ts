import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const JWT_SECRET = process.env.JWT_SECRET;

// Validate required environment variables
if (!ADMIN_PASSWORD && process.env.NODE_ENV === 'production') {
  throw new Error('ADMIN_PASSWORD must be set in production environment');
}
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET must be set in production environment');
}

// Development fallbacks only
const ADMIN_PASSWORD_DEV = ADMIN_PASSWORD || 'admin-dev-password-change-me';
const JWT_SECRET_DEV = JWT_SECRET || 'jwt-secret-dev-only';

// POST /api/admin/login - Аутентификация админа
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    if (password !== ADMIN_PASSWORD_DEV) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        adminId: 'ADMIN_PANEL',
        permissions: ['all'],
        iat: Math.floor(Date.now() / 1000)
      },
      JWT_SECRET_DEV,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      success: true,
      token: token,
      admin: {
        adminId: 'ADMIN_PANEL',
        permissions: ['all']
      }
    });

  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// GET /api/admin/verify-token - Проверка токена
export const verifyToken = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET_DEV) as any;
      
      res.status(200).json({
        success: true,
        admin: {
          adminId: decoded.adminId,
          permissions: decoded.permissions
        }
      });
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};
