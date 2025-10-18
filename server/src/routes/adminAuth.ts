import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

// Admin login endpoint for browser access
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Get admin password from environment
    const adminPassword = process.env.ADMIN_PASSWORD || 'nemesisN3M3616';

    if (password !== adminPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin password'
      });
    }

    // Create admin token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';
    const adminToken = jwt.sign(
      {
        isAdmin: true,
        adminId: 'browser-admin',
        permissions: ['all'],
        loginTime: Date.now()
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token: adminToken,
      message: 'Admin login successful'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Admin logout endpoint
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Admin logout successful'
  });
});

// Verify admin token
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret';

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      if (!decoded.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Invalid admin token'
        });
      }

      res.json({
        success: true,
        admin: {
          id: decoded.adminId,
          permissions: decoded.permissions,
          loginTime: decoded.loginTime
        }
      });

    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;