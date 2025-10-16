import { Router } from 'express';
import { UserStatsService } from '../services/userStatsService.js';

const router = Router();

/**
 * GET /api/stats/users
 * Получение статистики пользователей
 */
router.get('/users', UserStatsService.getUserStats.bind(UserStatsService));

/**
 * POST /api/stats/users/reset
 * Сброс статистики (только для админов)
 */
router.post('/users/reset', (req, res) => {
  try {
    // Проверяем права администратора
    const adminToken = req.headers.authorization?.replace('Bearer ', '');
    if (!adminToken || adminToken !== process.env.ADMIN_TOKEN) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    UserStatsService.resetStats();
    
    res.status(200).json({
      success: true,
      message: 'User statistics reset successfully'
    });
  } catch (error) {
    console.error('Error resetting user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user statistics'
    });
  }
});

export default router;
