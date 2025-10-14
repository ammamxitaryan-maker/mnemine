import { Router } from 'express';
import { 
  getDailyPayouts, 
  getTodayPayouts, 
  processTodayPayouts,
  getActiveUsers,
  getInactiveUsers,
  freezeAccounts,
  getDashboardStats
} from '../controllers/adminController.js';
import { 
  calculateAllUsersActivity, 
  autoFreezeInactiveAccounts, 
  getActivityStats 
} from '../utils/activityCalculator.js';

const router = Router();

// Ежедневные выплаты
router.get('/daily-payouts', getDailyPayouts);
router.get('/today-payouts', getTodayPayouts);
router.post('/process-today-payouts', processTodayPayouts);

// Управление пользователями
router.get('/active-users', getActiveUsers);
router.get('/inactive-users', getInactiveUsers);
router.post('/freeze-accounts', freezeAccounts);

// Статистика
router.get('/dashboard-stats', getDashboardStats);

// Активность пользователей
router.get('/activity-stats', async (req, res) => {
  try {
    const stats = await getActivityStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch activity stats' 
    });
  }
});

// Пересчет активности всех пользователей
router.post('/recalculate-activity', async (req, res) => {
  try {
    const result = await calculateAllUsersActivity();
    res.status(200).json({
      success: true,
      message: `Activity recalculated for ${result.processed} users`,
      data: result
    });
  } catch (error) {
    console.error('Error recalculating activity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to recalculate activity' 
    });
  }
});

// Автоматическая заморозка неактивных аккаунтов
router.post('/auto-freeze-inactive', async (req, res) => {
  try {
    const result = await autoFreezeInactiveAccounts();
    res.status(200).json({
      success: true,
      message: `Auto-freeze completed: ${result.frozen} accounts frozen`,
      data: result
    });
  } catch (error) {
    console.error('Error auto-freezing accounts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to auto-freeze accounts' 
    });
  }
});

export default router;
