import { Router } from 'express';
import { AuthService } from '../services/authService.js';

const router = Router();

// Simple endpoint for login via Telegram
router.post('/login', async (req, res) => {
  try {
    const { id, username, first_name, last_name } = req.body;

    // Validate user data
    const validation = AuthService.validateSimpleUserData({ id, username, first_name, last_name });
    if (!validation.isValid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.error 
      });
    }

    // Find or create user
    const result = await AuthService.findOrCreateUser({
      id: Number(id),
      username,
      first_name,
      last_name
    });

    if (!result.success) {
      return res.status(500).json({ 
        success: false, 
        message: result.error 
      });
    }

    res.json({ 
      success: true, 
      user: result.user 
    });

  } catch (error) {
    console.error('[LOGIN] Error during login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

export default router;