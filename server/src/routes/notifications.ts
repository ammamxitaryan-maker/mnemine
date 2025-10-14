import { Router } from 'express';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  sendNotification,
  getNotificationQueueStats,
  clearNotificationQueueEndpoint,
  getNotificationStats
} from '../controllers/notificationController.js';

const router = Router();

// Пользовательские маршруты
router.get('/:telegramId/notifications', getUserNotifications);
router.post('/:telegramId/notifications/mark-read', markNotificationAsRead);

// Админ маршруты
router.post('/admin/notifications/send', sendNotification);
router.get('/admin/notifications/queue-stats', getNotificationQueueStats);
router.post('/admin/notifications/clear-queue', clearNotificationQueueEndpoint);
router.get('/admin/notifications/stats', getNotificationStats);

export default router;
