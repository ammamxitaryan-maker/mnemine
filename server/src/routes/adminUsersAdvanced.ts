import { Router } from 'express';
import { isAdmin } from '../middleware-stubs.js';
import prisma from '../prisma.js';

const router = Router();

// GET /api/admin/users/advanced - Получить расширенную информацию о пользователях
router.get('/advanced', isAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        wallets: {
          where: { currency: 'NON' }
        },
        _count: {
          select: {
            referrals: true,
            transactions: true,
            lotteryTickets: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const usersWithAdvancedData = users.map(user => {
      const usdWallet = user.wallets[0];
      const totalDeposits = user._count.transactions; // Упрощенная логика
      const totalWithdrawals = 0; // Нужно добавить логику для подсчета выводов

      // Вычисляем риск-скор (упрощенная логика)
      let riskScore = 0;
      if (user.isFrozen) riskScore += 50; // Using isFrozen instead of isBanned
      if (!user.captchaValidated) riskScore += 20; // Using captchaValidated instead of isVerified
      if (user._count.transactions === 0) riskScore += 10;
      if (user._count.referrals === 0) riskScore += 5;

      // Определяем KYC статус
      let kycStatus = 'none';
      if (user.captchaValidated) kycStatus = 'approved'; // Using captchaValidated instead of isVerified

      // Определяем роль
      let role = 'user';
      if (user.role === 'ADMIN') role = 'admin';
      else if (user.role === 'MANAGER') role = 'moderator';
      else if (user.role === 'STAFF') role = 'staff';

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        telegramId: user.telegramId,
        isActive: user.isActive,
        isFrozen: user.isFrozen,
        captchaValidated: user.captchaValidated,
        role,
        balance: usdWallet?.balance || 0,
        totalDeposits,
        totalWithdrawals,
        lastActivity: user.lastActivityAt,
        registrationDate: user.createdAt,
        loginCount: 0, // Login count not available in schema
        referralCount: user._count.referrals,
        kycStatus,
        riskScore,
        tags: [] // Можно добавить логику для тегов
      };
    });

    res.json({
      success: true,
      data: usersWithAdvancedData
    });
  } catch (error) {
    console.error('Error fetching advanced users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// POST /api/admin/users/bulk-action - Массовые действия с пользователями
router.post('/bulk-action', isAdmin, async (req, res) => {
  try {
    const { action, userIds, data } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ success: false, error: 'No user IDs provided' });
    }

    let result;

    switch (action) {
      case 'activate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: true }
        });
        break;

      case 'deactivate':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isActive: false }
        });
        break;

      case 'ban':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isFrozen: true, isActive: false }
        });
        break;

      case 'unban':
        result = await prisma.user.updateMany({
          where: { id: { in: userIds } },
          data: { isFrozen: false }
        });
        break;

      case 'sendMessage':
        // Логика отправки сообщения
        // Здесь должна быть интеграция с системой уведомлений
        result = { count: userIds.length };
        break;

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    res.json({
      success: true,
      message: `Action ${action} completed successfully`,
      affectedUsers: result.count || userIds.length
    });
  } catch (error) {
    console.error('Error performing bulk action:', error);
    res.status(500).json({ success: false, error: 'Failed to perform bulk action' });
  }
});

// POST /api/admin/users/export - Экспорт пользователей
router.post('/export', isAdmin, async (req, res) => {
  try {
    const { format, filters, userIds } = req.body;

    let whereClause = {};

    if (userIds && userIds.length > 0) {
      whereClause = { id: { in: userIds } };
    }

    // Применяем фильтры
    if (filters) {
      if (filters.role && filters.role !== 'all') {
        switch (filters.role) {
          case 'admin':
            whereClause = { ...whereClause, role: 'ADMIN' };
            break;
          case 'moderator':
            whereClause = { ...whereClause, role: 'MANAGER' };
            break;
          case 'staff':
            whereClause = { ...whereClause, role: 'STAFF' };
            break;
          case 'user':
            whereClause = { ...whereClause, role: 'USER' };
            break;
        }
      }

      if (filters.status && filters.status !== 'all') {
        switch (filters.status) {
          case 'active':
            whereClause = { ...whereClause, isActive: true, isFrozen: false };
            break;
          case 'inactive':
            whereClause = { ...whereClause, isActive: false };
            break;
          case 'banned':
            whereClause = { ...whereClause, isFrozen: true };
            break;
          case 'verified':
            whereClause = { ...whereClause, captchaValidated: true };
            break;
        }
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        wallets: {
          where: { currency: 'NON' }
        }
      }
    });

    const exportData = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      telegramId: user.telegramId,
      isActive: user.isActive,
      isFrozen: user.isFrozen,
      captchaValidated: user.captchaValidated,
      balance: user.wallets[0]?.balance || 0,
      createdAt: user.createdAt,
      lastActivity: user.lastActivityAt
    }));

    if (format === 'csv') {
      const csvHeader = Object.keys(exportData[0] || {}).join(',');
      const csvRows = exportData.map(user =>
        Object.values(user).map(value =>
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      const csvContent = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
      res.send(csvContent);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=users_export.json');
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting users:', error);
    res.status(500).json({ success: false, error: 'Failed to export users' });
  }
});

// PUT /api/admin/users/:userId/:action - Действия с конкретным пользователем
router.put('/:userId/:action', isAdmin, async (req, res) => {
  try {
    const { userId, action } = req.params;
    const { data } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    let result;

    switch (action) {
      case 'activate':
        result = await prisma.user.update({
          where: { id: userId },
          data: { isActive: true }
        });
        break;

      case 'deactivate':
        result = await prisma.user.update({
          where: { id: userId },
          data: { isActive: false }
        });
        break;

      case 'ban':
        result = await prisma.user.update({
          where: { id: userId },
          data: { isFrozen: true, isActive: false }
        });
        break;

      case 'unban':
        result = await prisma.user.update({
          where: { id: userId },
          data: { isFrozen: false }
        });
        break;

      case 'verify':
        result = await prisma.user.update({
          where: { id: userId },
          data: { captchaValidated: true }
        });
        break;

      case 'unverify':
        result = await prisma.user.update({
          where: { id: userId },
          data: { captchaValidated: false }
        });
        break;

      case 'setRole':
        if (!data?.role) {
          return res.status(400).json({ success: false, error: 'Role not provided' });
        }

        const updateData = {
          role: data.role.toUpperCase() as 'USER' | 'ADMIN' | 'MANAGER' | 'STAFF'
        };

        result = await prisma.user.update({
          where: { id: userId },
          data: updateData
        });
        break;

      default:
        return res.status(400).json({ success: false, error: 'Invalid action' });
    }

    res.json({
      success: true,
      message: `User ${action} completed successfully`,
      user: result
    });
  } catch (error) {
    console.error('Error performing user action:', error);
    res.status(500).json({ success: false, error: 'Failed to perform user action' });
  }
});

export default router;
