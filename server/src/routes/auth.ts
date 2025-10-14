import { Router } from 'express';
import { AuthService } from '../services/authService.js';

const router = Router();

router.post('/validate', async (req, res) => {
  try {
    const { initData, startParam } = req.body;

    // Validate Telegram data
    const validation = AuthService.validateTelegramData(initData);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.error });
    }

    // Find or create user
    const result = await AuthService.findOrCreateUser(validation.userData!, startParam);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    console.log('[AUTH] Authentication successful for user:', validation.userData!.id);
    console.log('[AUTH] User created/updated:', result.user ? result.user.id : 'NULL');

    res.status(200).json({ 
      message: 'Authentication successful', 
      user: result.user 
    });

  } catch (error) {
    console.error('[AUTH] CRITICAL: Error during validation or DB operation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;