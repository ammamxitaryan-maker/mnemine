import { Router } from 'express';
import { isAdmin } from '../middleware-stubs.js';
import prisma from '../prisma.js';

const router = Router();

// GET /api/admin/users/locations - Получить локации пользователей
router.get('/users/locations', isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        lastSeenAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Последние 24 часа
        }
      },
      select: {
        id: true,
        firstName: true,
        username: true,
        telegramId: true,
        lastSeenAt: true,
        wallets: {
          where: { currency: 'NON' },
          select: { balance: true }
        }
      }
    });

    // Генерируем фейковые данные для демонстрации
    const fakeLocations = users.map(user => ({
      id: `loc_${user.id}`,
      userId: user.id,
      firstName: user.firstName,
      username: user.username,
      country: 'Unknown', // Location data not available in schema
      city: 'Unknown', // Location data not available in schema
      latitude: Math.random() * 180 - 90, // Mock data
      longitude: Math.random() * 360 - 180, // Mock data
      lastSeen: user.lastSeenAt?.toISOString() || new Date().toISOString(),
      isOnline: Math.random() > 0.3, // 70% онлайн
      activity: ['mining', 'lottery', 'wallet', 'idle'][Math.floor(Math.random() * 4)]
    }));

    res.json({
      success: true,
      data: fakeLocations
    });
  } catch (error) {
    console.error('Error fetching user locations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user locations' });
  }
});

// GET /api/admin/users/country-stats - Статистика по странам
router.get('/users/country-stats', isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        lastSeenAt: true,
        wallets: {
          where: { currency: 'NON' },
          select: { balance: true }
        }
      }
    });

    // Группируем по странам
    const countryStats = users.reduce((acc, user) => {
      const country = 'Unknown'; // Location data not available in schema
      if (!acc[country]) {
        acc[country] = {
          country,
          userCount: 0,
          onlineCount: 0,
          totalRevenue: 0
        };
      }

      acc[country].userCount++;
      if (user.lastSeenAt && (Date.now() - user.lastSeenAt.getTime()) < 30 * 60 * 1000) {
        acc[country].onlineCount++;
      }
      acc[country].totalRevenue += user.wallets[0]?.balance || 0;

      return acc;
    }, {} as Record<string, any>);

    const stats = Object.values(countryStats).sort((a: any, b: any) => b.userCount - a.userCount);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching country stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch country stats' });
  }
});

// GET /api/admin/analytics/heatmap - Данные для тепловой карты
router.get('/analytics/heatmap', isAdmin, async (req, res) => {
  try {
    const { range = 'week' } = req.query;

    // Генерируем фейковые данные для тепловой карты
    const heatmapData = [];
    const days = 7; // Неделя
    const hours = 24;

    for (let day = 0; day < days; day++) {
      for (let hour = 0; hour < hours; hour++) {
        // Создаем паттерн активности (больше активности в рабочие часы)
        const isWeekend = day >= 5;
        const isWorkHour = hour >= 9 && hour <= 18;
        const baseActivity = isWeekend ? 0.3 : (isWorkHour ? 0.8 : 0.4);

        const activity = Math.floor(Math.random() * 100 * baseActivity);
        const users = Math.floor(activity * 0.7);
        const revenue = Math.floor(activity * 0.1 * (Math.random() * 10 + 1));

        heatmapData.push({
          hour,
          day,
          activity,
          users,
          revenue
        });
      }
    }

    // Статистика
    const totalActivity = heatmapData.reduce((sum, d) => sum + d.activity, 0);
    const avgActivity = totalActivity / heatmapData.length;

    // Находим пиковые значения
    const peakHour = heatmapData.reduce((max, d) => d.activity > max.activity ? d : max, heatmapData[0]);
    const peakDay = heatmapData.reduce((max, d) => d.activity > max.activity ? d : max, heatmapData[0]);

    const stats = {
      peakHour: { hour: peakHour.hour, activity: peakHour.activity },
      peakDay: { day: ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'][peakDay.day] },
      totalActivity,
      avgActivity,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };

    res.json({
      success: true,
      data: {
        heatmap: heatmapData,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch heatmap data' });
  }
});

// GET /api/admin/monitoring/errors - Получить ошибки системы
router.get('/monitoring/errors', isAdmin, async (req, res) => {
  try {
    // Генерируем фейковые данные ошибок
    const errorTypes = ['error', 'warning', 'critical', 'info'];
    const categories = ['payment', 'system', 'user', 'security', 'performance'];
    const errorMessages = [
      'Database connection timeout',
      'Payment processing failed',
      'User authentication error',
      'Memory usage exceeded limit',
      'API rate limit exceeded',
      'Invalid transaction data',
      'WebSocket connection lost',
      'File upload failed'
    ];

    const errors: any[] = [];
    const errorCount = Math.floor(Math.random() * 20) + 5; // 5-25 ошибок

    for (let i = 0; i < errorCount; i++) {
      const type = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const message = errorMessages[Math.floor(Math.random() * errorMessages.length)];

      errors.push({
        id: `error_${i}`,
        type,
        category,
        title: message,
        message: `${message} occurred at ${new Date().toISOString()}`,
        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
        userId: Math.random() > 0.7 ? `user_${Math.floor(Math.random() * 100)}` : undefined,
        userInfo: Math.random() > 0.7 ? {
          firstName: 'User',
          username: 'user' + Math.floor(Math.random() * 100),
          telegramId: '123456789'
        } : undefined,
        metadata: {
          stack: 'Error stack trace...',
          requestId: `req_${Math.floor(Math.random() * 1000)}`,
          timestamp: new Date().toISOString()
        },
        resolved: Math.random() > 0.8,
        severity: Math.floor(Math.random() * 10) + 1
      });
    }

    // Статистика
    const stats = {
      totalErrors: errors.length,
      criticalErrors: errors.filter(e => e.type === 'critical').length,
      unresolvedErrors: errors.filter(e => !e.resolved).length,
      errorRate: Math.random() * 5, // 0-5%
      avgResolutionTime: Math.floor(Math.random() * 60) + 5, // 5-65 минут
      topCategories: categories.map(cat => ({
        category: cat,
        count: errors.filter(e => e.category === cat).length
      })).sort((a, b) => b.count - a.count)
    };

    res.json({
      success: true,
      data: {
        errors,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching errors:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch errors' });
  }
});

// POST /api/admin/monitoring/errors/:id/resolve - Решить ошибку
router.post('/monitoring/errors/:id/resolve', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // В реальном приложении здесь была бы логика обновления статуса ошибки
    res.json({
      success: true,
      message: 'Error resolved successfully'
    });
  } catch (error) {
    console.error('Error resolving error:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve error' });
  }
});

// GET /api/admin/broadcast/segments - Получить сегменты пользователей
router.get('/broadcast/segments', isAdmin, async (req, res) => {
  try {
    const segments = [
      {
        name: 'all',
        description: 'Все пользователи платформы',
        count: 12547,
        filters: {}
      },
      {
        name: 'active',
        description: 'Пользователи, активные за последние 7 дней',
        count: 8934,
        filters: { lastActivity: '7d' }
      },
      {
        name: 'inactive',
        description: 'Пользователи, неактивные более 30 дней',
        count: 1247,
        filters: { lastActivity: '30d', inactive: true }
      },
      {
        name: 'vip',
        description: 'Пользователи с балансом более $1000',
        count: 234,
        filters: { minBalance: 1000 }
      },
      {
        name: 'new',
        description: 'Новые пользователи за последние 30 дней',
        count: 1876,
        filters: { registrationDate: '30d' }
      }
    ];

    res.json({
      success: true,
      data: segments
    });
  } catch (error) {
    console.error('Error fetching segments:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch segments' });
  }
});

// POST /api/admin/broadcast/calculate-recipients - Подсчитать получателей
router.post('/broadcast/calculate-recipients', isAdmin, async (req, res) => {
  try {
    const { targetAudience, customFilters } = req.body;

    // В реальном приложении здесь была бы логика подсчета пользователей
    const counts = {
      all: 12547,
      active: 8934,
      inactive: 1247,
      vip: 234,
      new: 1876,
      custom: Math.floor(Math.random() * 5000) + 1000
    };

    res.json({
      success: true,
      data: {
        count: counts[targetAudience as keyof typeof counts] || 0
      }
    });
  } catch (error) {
    console.error('Error calculating recipients:', error);
    res.status(500).json({ success: false, error: 'Failed to calculate recipients' });
  }
});

// POST /api/admin/broadcast/send - Отправить сообщение
router.post('/broadcast/send', isAdmin, async (req, res) => {
  try {
    const { title, content, targetAudience, immediate } = req.body;

    // В реальном приложении здесь была бы логика отправки сообщений
    console.log('Broadcasting message:', { title, content, targetAudience, immediate });

    res.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: `msg_${Date.now()}`,
        recipientCount: Math.floor(Math.random() * 10000) + 1000
      }
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ success: false, error: 'Failed to send broadcast' });
  }
});

// GET /api/admin/broadcast/stats - Статистика рассылок
router.get('/broadcast/stats', isAdmin, async (req, res) => {
  try {
    const stats = {
      totalSent: 1247,
      totalDelivered: 1189,
      totalRead: 892,
      deliveryRate: 95.3,
      readRate: 75.1,
      avgDeliveryTime: 2.3
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching broadcast stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch broadcast stats' });
  }
});

export default router;
