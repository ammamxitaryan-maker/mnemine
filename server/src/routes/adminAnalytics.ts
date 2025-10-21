import { Router } from 'express';
import { isAdmin } from '../middleware-stubs.js';
import prisma from '../prisma.js';

const router = Router();

// GET /api/admin/analytics/advanced - Получить расширенную аналитику
router.get('/advanced', isAdmin, async (req, res) => {
  try {
    const { range = '7d' } = req.query;

    // Вычисляем дату начала на основе диапазона
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case '1d':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Получаем данные о доходах
    const revenueData = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      _sum: { amount: true },
      _count: true
    });

    const dailyRevenue = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
      },
      _sum: { amount: true }
    });

    const weeklyRevenue = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      _sum: { amount: true }
    });

    const monthlyRevenue = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: {
          gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _sum: { amount: true }
    });

    // Получаем данные о пользователях
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: {
        lastActivityAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }
    });
    const newUsers = await prisma.user.count({
      where: {
        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
      }
    });

    // Получаем данные о транзакциях
    const totalTransactions = await prisma.transaction.count({
      where: { createdAt: { gte: startDate } }
    });
    const successfulTransactions = await prisma.transaction.count({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      }
    });
    const failedTransactions = await prisma.transaction.count({
      where: {
        status: 'FAILED',
        createdAt: { gte: startDate }
      }
    });

    const avgTransactionAmount = await prisma.transaction.aggregate({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: startDate }
      },
      _avg: { amount: true }
    });

    // Вычисляем рост (упрощенная логика)
    const previousPeriodStart = new Date(startDate.getTime() - (now.getTime() - startDate.getTime()));
    const previousRevenue = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      },
      _sum: { amount: true }
    });

    const currentRevenue = revenueData._sum.amount || 0;
    const previousRevenueAmount = previousRevenue._sum.amount || 0;
    const revenueGrowth = previousRevenueAmount > 0
      ? ((currentRevenue - previousRevenueAmount) / previousRevenueAmount) * 100
      : 0;

    const previousUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    });
    const userGrowth = previousUsers > 0
      ? ((newUsers - previousUsers) / previousUsers) * 100
      : 0;

    // Метрики производительности (заглушки)
    const performance = {
      responseTime: Math.random() * 100 + 50, // 50-150ms
      uptime: 99.9,
      errorRate: Math.random() * 2, // 0-2%
      throughput: Math.random() * 1000 + 500 // 500-1500 req/s
    };

    const analyticsData = {
      revenue: {
        total: currentRevenue,
        daily: dailyRevenue._sum.amount || 0,
        weekly: weeklyRevenue._sum.amount || 0,
        monthly: monthlyRevenue._sum.amount || 0,
        growth: revenueGrowth
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        new: newUsers,
        growth: userGrowth
      },
      transactions: {
        total: totalTransactions,
        successful: successfulTransactions,
        failed: failedTransactions,
        avgAmount: avgTransactionAmount._avg.amount || 0
      },
      performance
    };

    res.json({
      success: true,
      data: analyticsData
    });
  } catch (error) {
    console.error('Error fetching advanced analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics data' });
  }
});

// POST /api/admin/analytics/export - Экспорт аналитики
router.post('/export', isAdmin, async (req, res) => {
  try {
    const { format, dateRange, metrics } = req.body;

    // Здесь должна быть логика экспорта данных
    // Для демонстрации возвращаем JSON
    const exportData = {
      timestamp: new Date().toISOString(),
      range: dateRange,
      metrics,
      data: {} // Здесь будут реальные данные
    };

    if (format === 'pdf') {
      // Логика генерации PDF
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics_report.pdf');
      res.send('PDF content would be here');
    } else if (format === 'excel') {
      // Логика генерации Excel
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics_report.xlsx');
      res.send('Excel content would be here');
    } else {
      // CSV или JSON
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=analytics_report.json');
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to export analytics' });
  }
});

export default router;
