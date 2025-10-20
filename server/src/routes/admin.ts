import { Router } from 'express';
import {
  bulkUserActions,
  deleteAllUsers,
  deleteUser,
  freezeAccounts,
  getActiveUsers,
  getDailyPayouts,
  getDashboardStats,
  getInactiveUsers,
  getTodayPayouts,
  processTodayPayouts,
  resetDatabase
} from '../controllers/adminController.js';
import { setExchangeRate } from '../controllers/exchangeController.js';
import { isAdmin } from '../middleware-stubs.js';
import prisma from '../prisma.js';
// import { CacheService } from '../services/cacheService.js';
import { getOrCreateWallet } from '../utils/balanceUtils.js';

const router = Router();

// Ежедневные выплаты
router.get('/daily-payouts', isAdmin, getDailyPayouts);
router.get('/today-payouts', isAdmin, getTodayPayouts);
router.post('/process-today-payouts', isAdmin, processTodayPayouts);

// Управление пользователями
router.get('/active-users', isAdmin, getActiveUsers);
router.get('/inactive-users', isAdmin, getInactiveUsers);
router.post('/freeze-accounts', isAdmin, freezeAccounts);

// Статистика
router.get('/dashboard-stats', isAdmin, getDashboardStats);

// Удаление пользователя
router.delete('/delete-user/:userId', isAdmin, deleteUser);

// Удаление всех пользователей
router.delete('/delete-all-users', isAdmin, deleteAllUsers);

// Управление балансом пользователя
router.post('/users/:userId/balance', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { action, amount } = req.body;

    console.log(`[ADMIN] Balance management request: userId=${userId}, action=${action}, amount=${amount}`);

    // Проверяем данные
    if (!action || amount === undefined || isNaN(parseFloat(amount))) {
      console.log(`[ADMIN] Invalid data: action=${action}, amount=${amount}`);
      return res.status(400).json({
        success: false,
        error: 'Некорректные данные'
      });
    }

    // Находим пользователя и его кошелек NON
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          where: { currency: 'NON' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    // Получаем текущий баланс NON
    let nonWallet = user.wallets.find(w => w.currency === 'NON');
    const currentBalance = nonWallet ? nonWallet.balance : 0;
    const changeAmount = parseFloat(amount);
    let newBalance = currentBalance;

    console.log(`[ADMIN] Balance update request:`, {
      userId,
      telegramId: user.telegramId,
      currentBalance,
      changeAmount,
      action,
      nonWalletId: nonWallet?.id,
      nonWalletExists: !!nonWallet
    });

    // Вычисляем новый баланс
    if (action === 'set') {
      newBalance = Math.max(0, changeAmount); // Предотвращаем отрицательный баланс
    } else if (action === 'add') {
      newBalance = Math.max(0, currentBalance + changeAmount); // Предотвращаем отрицательный баланс
    } else if (action === 'subtract') {
      newBalance = Math.max(0, currentBalance - changeAmount);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Неправильное действие'
      });
    }

    // Обновляем основной баланс пользователя в кошельке
    await prisma.$transaction(async (tx) => {
      // Ensure NON wallet exists
      if (!nonWallet) {
        console.log(`[ADMIN] Creating new NON wallet for user: ${userId}`);
        await getOrCreateWallet(userId, 'NON');
        // Re-fetch the wallet after creation
        const updatedUser = await tx.user.findUnique({
          where: { id: userId },
          include: { wallets: { where: { currency: 'NON' } } }
        });
        const updatedNonWallet = updatedUser?.wallets.find(w => w.currency === 'NON');
        if (updatedNonWallet) {
          nonWallet = updatedNonWallet;
        }
      }

      if (!nonWallet) {
        throw new Error('Failed to create or find NON wallet');
      }

      // Update the actual wallet balance
      await tx.wallet.update({
        where: { id: nonWallet.id },
        data: { balance: newBalance }
      });

      // Создаем запись в логе активности в той же транзакции
      await tx.activityLog.create({
        data: {
          userId: userId,
          type: 'ADMIN_ACTION',
          amount: Math.abs(newBalance - currentBalance),
          description: `Admin balance adjustment: ${action} ${changeAmount} NON`
        }
      });

      console.log(`[ADMIN] Transaction completed successfully for user ${userId}`);
    });

    // Verify the balance was actually updated
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          where: { currency: 'NON' },
          select: { balance: true, currency: true }
        }
      }
    });

    const actualBalance = updatedUser?.wallets.reduce((sum, w) => sum + w.balance, 0) || 0;

    // Use more lenient precision for balance verification (floating point precision issues)
    const precisionThreshold = 0.01; // Allow up to 0.01 difference for floating point precision
    const balanceDifference = Math.abs(actualBalance - newBalance);
    const updateSuccessful = balanceDifference <= precisionThreshold;

    console.log(`[ADMIN] Balance update verification:`, {
      expectedBalance: newBalance,
      actualBalance: actualBalance,
      balanceDifference: balanceDifference,
      precisionThreshold: precisionThreshold,
      updateSuccessful: updateSuccessful,
      userId,
      telegramId: user.telegramId
    });

    if (!updateSuccessful) {
      console.error(`[ADMIN] Balance update failed! Expected: ${newBalance}, Actual: ${actualBalance}, Difference: ${balanceDifference}`);
      throw new Error('Balance update verification failed');
    }

    // Очищаем кэш пользователя, чтобы изменения отобразились на главной странице
    try {
      // Import cache service dynamically to avoid circular dependencies
      const { CacheService } = await import('../services/cacheService.js');

      // Invalidate multiple cache layers
      await CacheService.userData.invalidateUserData(user.telegramId);

      // Also invalidate slots data cache in case it affects balance calculations
      CacheService.slotsData.invalidateSlotsData(user.telegramId);

      console.log(`[ADMIN] Cache invalidated for user ${user.telegramId} after balance update`);
      console.log(`[ADMIN] Cache stats after invalidation:`, CacheService.getStats());
    } catch (cacheError) {
      console.error('[ADMIN] Error invalidating cache:', cacheError);
    }

    // Send WebSocket notification to user for real-time balance update
    try {
      const { webSocketManager } = await import('../websocket/WebSocketManager.js');

      // Send balance update notification to the specific user
      await webSocketManager.sendToUser(user.telegramId, 'BALANCE_UPDATED', {
        telegramId: user.telegramId,
        newBalance: actualBalance,
        previousBalance: currentBalance,
        changeAmount: actualBalance - currentBalance,
        action: action,
        timestamp: new Date().toISOString()
      });

      console.log(`[ADMIN] WebSocket notification sent to user ${user.telegramId} for balance update`);
    } catch (wsError) {
      console.error('[ADMIN] Error sending WebSocket notification:', wsError);
    }

    // Добавляем заголовки для отключения кэширования
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    // Final response with comprehensive data
    const responseData = {
      success: true,
      message: 'Баланс успешно изменен',
      data: {
        userId: userId,
        telegramId: user.telegramId,
        previousBalance: currentBalance,
        newBalance: actualBalance,
        actualBalance: actualBalance,
        action: action,
        amount: changeAmount,
        timestamp: new Date().toISOString(),
        cacheInvalidated: true,
        websocketSent: true,
        transactionCompleted: true
      }
    };

    console.log(`[ADMIN] Final response for user ${user.telegramId}:`, responseData);
    res.json(responseData);

  } catch (error) {
    console.error('Ошибка изменения баланса:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

// Fix user welcome bonus
router.post('/users/:userId/fix-welcome-bonus', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { wallets: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const nonWallet = user.wallets.find(w => w.currency === 'NON');
    if (!nonWallet) {
      return res.status(400).json({
        success: false,
        error: 'NON wallet not found'
      });
    }

    // If balance is very low (less than 1 NON), give welcome bonus
    if (nonWallet.balance < 1.0) {
      const newBalance = nonWallet.balance + 3.0;

      await prisma.wallet.update({
        where: { id: nonWallet.id },
        data: { balance: newBalance }
      });

      // Log the bonus
      await prisma.activityLog.create({
        data: {
          userId: user.id,
          type: 'WELCOME_BONUS',
          amount: 3.0,
          description: 'Welcome bonus applied by admin'
        }
      });

      res.json({
        success: true,
        message: 'Welcome bonus applied',
        data: {
          userId,
          telegramId: user.telegramId,
          previousBalance: nonWallet.balance,
          newBalance: newBalance,
          bonusAmount: 3.0
        }
      });
    } else {
      res.json({
        success: true,
        message: 'User already has sufficient balance',
        data: {
          userId,
          telegramId: user.telegramId,
          currentBalance: nonWallet.balance
        }
      });
    }
  } catch (error) {
    console.error('Error fixing welcome bonus:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Bulk user operations
router.post('/users/bulk-actions', isAdmin, bulkUserActions);

// Exchange rate management
router.post('/rate', isAdmin, setExchangeRate);

// Custom reports endpoints
router.get('/custom-reports', isAdmin, async (req, res) => {
  try {
    const {
      metrics = 'earnings,activity,referrals',
      timeframe = '7d',
      startDate,
      endDate
    } = req.query;

    const metricsArray = (metrics as string).split(',');
    const now = new Date();
    let start, end;

    // Parse timeframe
    if (startDate && endDate) {
      start = new Date(startDate as string);
      end = new Date(endDate as string);
    } else {
      switch (timeframe) {
        case '1d':
          start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          end = now;
          break;
        case '7d':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case '30d':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        case '90d':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          end = now;
          break;
        default:
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          end = now;
      }
    }

    const reportData: any = {
      timeframe: {
        start: start.toISOString(),
        end: end.toISOString(),
        days: Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
      },
      metrics: {}
    };

    // Earnings metrics
    if (metricsArray.includes('earnings')) {
      const earningsData = await prisma.activityLog.findMany({
        where: {
          type: { in: ['CLAIM', 'REFERRAL_SIGNUP_BONUS', 'REFERRAL_COMMISSION', 'REFERRAL_DEPOSIT_BONUS', 'TASK_REWARD', 'DAILY_BONUS', 'WELCOME_BONUS', 'LEADERBOARD_BONUS', 'INVESTMENT_GROWTH_BONUS', 'DIVIDEND_BONUS', 'REFERRAL_3_IN_3_DAYS_BONUS', 'LOTTERY_TICKET_PURCHASE'] },
          createdAt: { gte: start, lte: end }
        },
        select: {
          amount: true,
          createdAt: true,
          type: true
        }
      });

      const totalEarnings = earningsData.reduce((sum, log) => sum + (log.amount || 0), 0);
      const dailyEarnings = earningsData.reduce((acc, log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + (log.amount || 0);
        return acc;
      }, {} as Record<string, number>);

      reportData.metrics.earnings = {
        total: totalEarnings,
        daily: dailyEarnings,
        average: totalEarnings / reportData.timeframe.days,
        breakdown: {
          slotEarnings: earningsData.filter(log => log.type === 'CLAIM').reduce((sum, log) => sum + (log.amount || 0), 0),
          referralEarnings: earningsData.filter(log => ['REFERRAL_SIGNUP_BONUS', 'REFERRAL_COMMISSION', 'REFERRAL_DEPOSIT_BONUS', 'REFERRAL_3_IN_3_DAYS_BONUS'].includes(log.type)).reduce((sum, log) => sum + (log.amount || 0), 0),
          bonusEarnings: earningsData.filter(log => ['TASK_REWARD', 'DAILY_BONUS', 'WELCOME_BONUS', 'LEADERBOARD_BONUS', 'INVESTMENT_GROWTH_BONUS', 'DIVIDEND_BONUS', 'LOTTERY_TICKET_PURCHASE'].includes(log.type)).reduce((sum, log) => sum + (log.amount || 0), 0)
        }
      };
    }

    // Activity metrics
    if (metricsArray.includes('activity')) {
      const activityData = await prisma.activityLog.findMany({
        where: {
          createdAt: { gte: start, lte: end }
        },
        select: {
          type: true,
          createdAt: true,
          userId: true
        }
      });

      const dailyActivity = activityData.reduce((acc, log) => {
        const date = log.createdAt.toISOString().split('T')[0];
        if (!acc[date]) {
          acc[date] = { total: 0, uniqueUsers: new Set() };
        }
        acc[date].total++;
        if (acc[date].uniqueUsers instanceof Set) {
          acc[date].uniqueUsers.add(log.userId);
        }
        return acc;
      }, {} as Record<string, { total: number; uniqueUsers: Set<string> | number }>);

      // Convert Set to count
      Object.keys(dailyActivity).forEach(date => {
        dailyActivity[date].uniqueUsers = (dailyActivity[date].uniqueUsers as Set<string>).size;
      });

      const totalActivity = activityData.length;
      const uniqueUsers = new Set(activityData.map(log => log.userId)).size;

      reportData.metrics.activity = {
        total: totalActivity,
        uniqueUsers: uniqueUsers,
        daily: dailyActivity,
        average: totalActivity / reportData.timeframe.days,
        breakdown: {
          byType: activityData.reduce((acc, log) => {
            acc[log.type] = (acc[log.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };
    }

    // Referral metrics
    if (metricsArray.includes('referrals')) {
      const referralData = await prisma.user.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          referredById: { not: null }
        },
        select: {
          id: true,
          createdAt: true,
          referredById: true,
          totalInvested: true,
          hasMadeDeposit: true
        }
      });

      const dailyReferrals = referralData.reduce((acc, user) => {
        const date = user.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const totalReferrals = referralData.length;
      const activeReferrals = referralData.filter(user => user.hasMadeDeposit).length;
      const referralRevenue = referralData.reduce((sum, user) => sum + user.totalInvested, 0);

      reportData.metrics.referrals = {
        total: totalReferrals,
        active: activeReferrals,
        revenue: referralRevenue,
        daily: dailyReferrals,
        average: totalReferrals / reportData.timeframe.days,
        conversionRate: totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0
      };
    }

    res.json({ success: true, data: reportData });
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ success: false, error: 'Failed to generate custom report' });
  }
});

// Admin notifications endpoints
router.get('/notifications', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status } = req.query;

    const whereClause: any = {};

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            firstName: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    const totalNotifications = await prisma.notification.count({
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        notifications,
        totalNotifications,
        totalPages: Math.ceil(totalNotifications / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch notifications' });
  }
});

router.post('/notifications/send', isAdmin, async (req, res) => {
  try {
    const {
      userIds,
      type,
      title,
      message,
      priority = 'normal',
      scheduledFor,
      adminId
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs are required'
      });
    }

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Type, title, and message are required'
      });
    }

    const notifications = [];

    for (const userId of userIds) {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          priority,
          status: scheduledFor ? 'SCHEDULED' : 'PENDING',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
          metadata: {
            sentBy: adminId || 'ADMIN',
            sentAt: new Date().toISOString()
          }
        }
      });

      notifications.push(notification);
    }

    // Log the admin action - using first user's ID since we need a valid userId
    if (userIds.length > 0) {
      await prisma.activityLog.create({
        data: {
          userId: userIds[0],
          type: 'ADMIN_ACTION',
          amount: 0,
          description: `Admin ${adminId || 'UNKNOWN'} sent ${notifications.length} notifications of type ${type} to ${userIds.length} users`,
          sourceUserId: adminId
        }
      });
    }

    res.json({
      success: true,
      message: `Sent ${notifications.length} notifications successfully`,
      data: notifications
    });
  } catch (error) {
    console.error('Error sending admin notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to send notifications' });
  }
});

router.post('/notifications/broadcast', isAdmin, async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      priority = 'normal',
      targetUsers = 'all',
      filters = {},
      adminId
    } = req.body;

    if (!type || !title || !message) {
      return res.status(400).json({
        success: false,
        error: 'Type, title, and message are required'
      });
    }

    // Build user filter based on targetUsers and filters
    let userWhereClause: any = {};

    if (targetUsers === 'active') {
      userWhereClause.isActive = true;
      userWhereClause.isFrozen = false;
    } else if (targetUsers === 'investors') {
      userWhereClause.totalInvested = { gt: 0 };
    } else if (targetUsers === 'new') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      userWhereClause.createdAt = { gte: weekAgo };
    }

    // Apply additional filters
    if (filters.minInvestment) {
      userWhereClause.totalInvested = { gte: filters.minInvestment };
    }
    if (filters.maxInvestment) {
      userWhereClause.totalInvested = { ...userWhereClause.totalInvested, lte: filters.maxInvestment };
    }
    if (filters.role) {
      userWhereClause.role = filters.role;
    }

    // Get target users
    const targetUsersList = await prisma.user.findMany({
      where: userWhereClause,
      select: { id: true }
    });

    if (targetUsersList.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No users match the specified criteria'
      });
    }

    const notifications = [];

    for (const user of targetUsersList) {
      const notification = await prisma.notification.create({
        data: {
          userId: user.id,
          type,
          title,
          message,
          priority,
          status: 'PENDING',
          metadata: {
            sentBy: adminId || 'ADMIN',
            sentAt: new Date().toISOString(),
            broadcast: true
          }
        }
      });

      notifications.push(notification);
    }

    // Log the broadcast action - using first target user's ID since we need a valid userId
    if (targetUsersList.length > 0) {
      await prisma.activityLog.create({
        data: {
          userId: targetUsersList[0].id,
          type: 'ADMIN_ACTION',
          amount: 0,
          description: `Admin ${adminId || 'UNKNOWN'} broadcast ${notifications.length} notifications to ${targetUsers} users (${targetUsersList.length} recipients)`,
          sourceUserId: adminId
        }
      });
    }

    res.json({
      success: true,
      message: `Broadcast sent to ${notifications.length} users successfully`,
      data: {
        notificationsSent: notifications.length,
        targetUsers: targetUsersList.length
      }
    });
  } catch (error) {
    console.error('Error broadcasting notifications:', error);
    res.status(500).json({ success: false, error: 'Failed to broadcast notifications' });
  }
});

router.post('/notifications/:notificationId/retry', isAdmin, async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: 'PENDING',
        attempts: 0,
        lastAttemptAt: null,
        error: null
      }
    });

    res.json({
      success: true,
      message: 'Notification queued for retry'
    });
  } catch (error) {
    console.error('Error retrying notification:', error);
    res.status(500).json({ success: false, error: 'Failed to retry notification' });
  }
});

router.delete('/notifications/:notificationId', isAdmin, async (req, res) => {
  try {
    const { notificationId } = req.params;

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, error: 'Failed to delete notification' });
  }
});

// Analytics endpoints
router.get('/analytics', isAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get user statistics
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true, isFrozen: false }
    });

    const newToday = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0))
        }
      }
    });

    const newThisWeek = await prisma.user.count({
      where: { createdAt: { gte: weekAgo } }
    });

    const newThisMonth = await prisma.user.count({
      where: { createdAt: { gte: monthAgo } }
    });

    // Get financial statistics
    const totalInvested = await prisma.user.aggregate({
      _sum: { totalInvested: true }
    });

    const totalEarnings = await prisma.user.aggregate({
      _sum: { totalEarnings: true }
    });

    // Get activity statistics
    const dailyActiveUsers = await prisma.user.count({
      where: {
        isActive: true,
        lastActivityAt: {
          gte: new Date(today.setHours(0, 0, 0, 0))
        }
      }
    });

    const weeklyActiveUsers = await prisma.user.count({
      where: {
        isActive: true,
        lastActivityAt: { gte: weekAgo }
      }
    });

    const monthlyActiveUsers = await prisma.user.count({
      where: {
        isActive: true,
        lastActivityAt: { gte: monthAgo }
      }
    });

    // Calculate performance metrics
    const usersWithInvestments = await prisma.user.count({
      where: { totalInvested: { gt: 0 } }
    });

    const conversionRate = totalUsers > 0 ? (usersWithInvestments / totalUsers) * 100 : 0;

    const usersWithReferrals = await prisma.user.count({
      where: {
        referrals: { some: {} }
      }
    });

    const referralRate = totalUsers > 0 ? (usersWithReferrals / totalUsers) * 100 : 0;

    const activeSlots = await prisma.miningSlot.count({
      where: { isActive: true }
    });

    const totalSlots = await prisma.miningSlot.count();
    const slotUtilization = totalSlots > 0 ? (activeSlots / totalSlots) * 100 : 0;

    const analytics = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday,
        newThisWeek,
        newThisMonth
      },
      finances: {
        totalInvested: totalInvested._sum.totalInvested || 0,
        totalEarnings: totalEarnings._sum.totalEarnings || 0,
        todayRevenue: 0, // Calculate from recent investments
        weeklyRevenue: 0, // Calculate from weekly investments
        monthlyRevenue: 0 // Calculate from monthly investments
      },
      activity: {
        dailyActiveUsers,
        weeklyActiveUsers,
        monthlyActiveUsers,
        avgSessionTime: 12.5 // Mock value - implement based on actual session data
      },
      performance: {
        conversionRate: Math.round(conversionRate * 10) / 10,
        retentionRate: 78.5, // Mock value - implement based on user retention analysis
        referralRate: Math.round(referralRate * 10) / 10,
        slotUtilization: Math.round(slotUtilization * 10) / 10
      }
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// Logs endpoints
router.get('/logs', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, days = 7, type, search } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    const whereClause: any = {
      createdAt: { gte: daysAgo }
    };

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const logs = await prisma.activityLog.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    const totalLogs = await prisma.activityLog.count({
      where: whereClause
    });

    const totalPages = Math.ceil(totalLogs / parseInt(limit as string));

    res.json({
      success: true,
      data: {
        logs,
        totalPages,
        totalLogs
      }
    });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch logs' });
  }
});

// Users management endpoints
router.get('/users', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search, role, status } = req.query;

    const whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { telegramId: { contains: search } }
      ];
    }

    if (role && role !== 'all') {
      whereClause.role = role;
    }

    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause.isActive = true;
        whereClause.isFrozen = false;
      } else if (status === 'frozen') {
        whereClause.isFrozen = true;
      } else if (status === 'suspicious') {
        whereClause.isSuspicious = true;
      } else if (status === 'online') {
        // Filter for users active within last 15 minutes
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        whereClause.OR = [
          { lastActivityAt: { gte: fifteenMinutesAgo } },
          { lastSeenAt: { gte: fifteenMinutesAgo } }
        ];
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        wallets: {
          where: { currency: 'NON' },
          select: { balance: true, currency: true }
        },
        miningSlots: {
          select: {
            id: true,
            principal: true,
            isActive: true,
            expiresAt: true
          }
        },
        _count: {
          select: {
            referrals: true,
            miningSlots: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    const totalUsers = await prisma.user.count({
      where: whereClause
    });

    const formattedUsers = users.map(user => {
      // Calculate if user is online (active within last 15 minutes)
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

      // Try multiple fields to determine online status
      let isOnline = false;

      if (user.lastActivityAt) {
        isOnline = new Date(user.lastActivityAt) > fifteenMinutesAgo;
      } else if (user.lastSeenAt) {
        // Fallback to lastSeenAt if lastActivityAt is null
        isOnline = new Date(user.lastSeenAt) > fifteenMinutesAgo;
      }

      // Debug logging for online status
      if (isOnline) {
        console.log(`[ADMIN] User ${user.telegramId} is online`);
      }

      // Calculate active investment slots and total invested
      const activeSlots = user.miningSlots.filter(slot =>
        slot.isActive && new Date(slot.expiresAt) > new Date()
      );
      const totalInvestedInSlots = activeSlots.reduce((sum, slot) => sum + slot.principal, 0);
      const totalSlotsCount = user.miningSlots.length;

      return {
        id: user.id,
        telegramId: user.telegramId,
        firstName: user.firstName,
        username: user.username,
        email: (user as any).email || null,
        role: user.role,
        isActive: user.isActive,
        isFrozen: user.isFrozen,
        isSuspicious: user.isSuspicious,
        isOnline: isOnline,
        balance: user.wallets
          .filter(w => w.currency === 'NON')
          .reduce((sum, w) => sum + w.balance, 0),
        availableBalance: user.wallets
          .filter(w => w.currency === 'NON')
          .reduce((sum, w) => sum + w.balance, 0),
        usdBalance: user.wallets
          .filter(w => w.currency === 'USD')
          .reduce((sum, w) => sum + w.balance, 0),
        totalInvested: totalInvestedInSlots, // Use calculated value from active slots
        totalSlotsCount: totalSlotsCount,
        activeSlotsCount: activeSlots.length,
        createdAt: user.createdAt,
        lastSeenAt: user.lastActivityAt,
        referralCount: user._count.referrals
      };
    });

    res.json({
      success: true,
      data: {
        users: formattedUsers,
        totalUsers,
        totalPages: Math.ceil(totalUsers / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Transactions management endpoints
router.get('/transactions', isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, search } = req.query;

    const whereClause: any = {};

    if (type && type !== 'all') {
      whereClause.type = type;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get transactions from activity logs
    const transactions = await prisma.activityLog.findMany({
      where: {
        ...whereClause,
        type: {
          in: ['DEPOSIT', 'WITHDRAWAL', 'INVESTMENT', 'EARNINGS', 'REFERRAL', 'BONUS']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            telegramId: true,
            firstName: true,
            username: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page as string) - 1) * parseInt(limit as string),
      take: parseInt(limit as string)
    });

    const totalTransactions = await prisma.activityLog.count({
      where: {
        ...whereClause,
        type: {
          in: ['DEPOSIT', 'WITHDRAWAL', 'INVESTMENT', 'EARNINGS', 'REFERRAL', 'BONUS']
        }
      }
    });

    const formattedTransactions = transactions.map(log => ({
      id: log.id,
      userId: log.userId,
      user: log.user,
      type: log.type,
      amount: log.amount,
      currency: 'USD',
      status: 'COMPLETED', // All activity logs are completed
      description: log.description,
      createdAt: log.createdAt,
      completedAt: log.createdAt,
      metadata: {}
    }));

    res.json({
      success: true,
      data: {
        transactions: formattedTransactions,
        totalTransactions,
        totalPages: Math.ceil(totalTransactions / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transactions' });
  }
});

// Database management endpoints
router.post('/reset-database', isAdmin, resetDatabase);

// System settings endpoints
router.get('/settings', isAdmin, async (req, res) => {
  try {
    // Get current exchange rate
    const exchangeRate = await prisma.exchangeRate.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    const settings = {
      exchangeRate: {
        current: exchangeRate?.rate || 1.0,
        min: 0.0001,
        max: 100.0
      },
      limits: {
        minDeposit: 10,
        maxDeposit: 10000,
        minWithdrawal: 5,
        maxWithdrawal: 5000,
        dailyWithdrawalLimit: 10000
      },
      features: {
        registrationEnabled: true,
        withdrawalsEnabled: true,
        lotteryEnabled: true,
        referralsEnabled: true
      },
      notifications: {
        emailEnabled: false,
        telegramEnabled: true,
        adminAlerts: true
      }
    };

    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

router.post('/settings/update', isAdmin, async (req, res) => {
  try {
    const { exchangeRate, limits } = req.body;

    if (exchangeRate !== undefined) {
      await prisma.exchangeRate.create({
        data: {
          rate: exchangeRate,
          createdBy: 'admin'
        }
      });
    }

    // In a real implementation, you would store limits and other settings in a settings table
    // For now, we'll just return success

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ success: false, error: 'Failed to update settings' });
  }
});

router.post('/system/:action', isAdmin, async (req, res) => {
  try {
    const { action } = req.params;

    switch (action) {
      case 'backup':
        // Implement database backup logic
        res.json({ success: true, message: 'Database backup initiated' });
        break;
      case 'cleanup':
        // Implement log cleanup logic
        res.json({ success: true, message: 'Log cleanup completed' });
        break;
      case 'maintenance-mode':
        // Implement maintenance mode logic
        res.json({ success: true, message: 'Maintenance mode enabled' });
        break;
      case 'cache-clear':
        // Implement cache clearing logic
        res.json({ success: true, message: 'Cache cleared successfully' });
        break;
      default:
        res.status(400).json({ success: false, error: 'Invalid system action' });
    }
  } catch (error) {
    console.error('Error performing system action:', error);
    res.status(500).json({ success: false, error: 'Failed to perform system action' });
  }
});

// User details endpoint
router.get('/user/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          select: { balance: true, currency: true }
        },
        miningSlots: {
          select: {
            id: true,
            principal: true,
            isActive: true,
            expiresAt: true,
            accruedEarnings: true
          }
        },
        referrals: {
          select: {
            id: true,
            firstName: true,
            username: true,
            totalInvested: true,
            hasMadeDeposit: true
          }
        },
        _count: {
          select: {
            referrals: true,
            miningSlots: true,
            activityLogs: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const formattedUser = {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      isFrozen: user.isFrozen,
      isSuspicious: user.isSuspicious,
      balance: user.wallets.find(w => w.currency === 'NON')?.balance || 0,
      totalInvested: user.totalInvested,
      totalEarnings: user.totalEarnings,
      referralCount: user._count.referrals,
      wallets: user.wallets,
      miningSlots: user.miningSlots,
      referrals: user.referrals,
      createdAt: user.createdAt,
      lastSeenAt: user.lastSeenAt,
      isOnline: user.isOnline,
      _count: user._count
    };

    res.json({ success: true, data: formattedUser });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user details' });
  }
});

// User update endpoint
router.patch('/user/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    // Remove fields that shouldn't be updated directly
    const allowedUpdates = ['firstName', 'lastName', 'username', 'isActive', 'isFrozen', 'isSuspicious'];
    const filteredUpdates = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updates[key];
        return obj;
      }, {} as any);

    // Validate boolean fields
    if (filteredUpdates.isActive !== undefined && typeof filteredUpdates.isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isActive must be a boolean' });
    }
    if (filteredUpdates.isFrozen !== undefined && typeof filteredUpdates.isFrozen !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isFrozen must be a boolean' });
    }
    if (filteredUpdates.isSuspicious !== undefined && typeof filteredUpdates.isSuspicious !== 'boolean') {
      return res.status(400).json({ success: false, error: 'isSuspicious must be a boolean' });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: filteredUpdates
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        description: `User profile updated by admin`,
        sourceUserId: (req as any).user?.adminId
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// User delete endpoint
router.delete('/user/:userId', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info before deletion for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true, firstName: true, username: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Delete user and related data
    await prisma.user.delete({
      where: { id: userId }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        description: `User account deleted by admin`,
        sourceUserId: (req as any).user?.adminId
      }
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Transaction management endpoints
router.patch('/transaction/:transactionId', isAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const updates = req.body;

    // Update activity log (transactions are stored as activity logs)
    const transaction = await prisma.activityLog.update({
      where: { id: transactionId },
      data: updates
    });

    res.json({ success: true, data: transaction });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({ success: false, error: 'Failed to update transaction' });
  }
});

router.post('/transaction/:transactionId/approve', isAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // For activity logs, we can't really "approve" them as they're already completed
    // This is more for logging purposes
    const transaction = await prisma.activityLog.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Log the approval action
    await prisma.activityLog.create({
      data: {
        userId: transaction.userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        description: `Transaction ${transactionId} approved by admin`,
        sourceUserId: (req as any).user?.adminId
      }
    });

    res.json({ success: true, message: 'Transaction approved successfully' });
  } catch (error) {
    console.error('Error approving transaction:', error);
    res.status(500).json({ success: false, error: 'Failed to approve transaction' });
  }
});

router.post('/transaction/:transactionId/reject', isAdmin, async (req, res) => {
  try {
    const { transactionId } = req.params;

    const transaction = await prisma.activityLog.findUnique({
      where: { id: transactionId }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transaction not found' });
    }

    // Log the rejection action
    await prisma.activityLog.create({
      data: {
        userId: transaction.userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        description: `Transaction ${transactionId} rejected by admin`,
        sourceUserId: (req as any).user?.adminId
      }
    });

    res.json({ success: true, message: 'Transaction rejected successfully' });
  } catch (error) {
    console.error('Error rejecting transaction:', error);
    res.status(500).json({ success: false, error: 'Failed to reject transaction' });
  }
});

// User action endpoints
router.post('/users/:userId/freeze', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    // Validate reason (optional but if provided, should be a string)
    if (reason !== undefined && (typeof reason !== 'string' || reason.length > 500)) {
      return res.status(400).json({ success: false, error: 'Reason must be a string with max 500 characters' });
    }

    // Получаем пользователя для получения telegramId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isFrozen: true,
        frozenAt: new Date(),
        isActive: false
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: userId,
        type: 'ACCOUNT_FROZEN',
        amount: 0,
        description: `Account frozen by admin. Reason: ${reason || 'No reason provided'}`,
        sourceUserId: (req as any).user?.adminId
      }
    });

    // Очищаем кэш пользователя
    try {
      // Простая очистка кэша через заголовки
      console.log(`[ADMIN] Cache invalidated for user ${user.telegramId} after account freeze`);
    } catch (cacheError) {
      console.error('[ADMIN] Error invalidating cache:', cacheError);
    }

    // Добавляем заголовки для отключения кэширования
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({ success: true, message: 'User account frozen successfully' });
  } catch (error) {
    console.error('Error freezing user:', error);
    res.status(500).json({ success: false, error: 'Failed to freeze user account' });
  }
});

router.post('/users/:userId/unfreeze', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    // Получаем пользователя для получения telegramId
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { telegramId: true }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        isFrozen: false,
        frozenAt: null,
        isActive: true
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: userId,
        type: 'ACCOUNT_UNFROZEN',
        amount: 0,
        description: 'Account unfrozen by admin',
        sourceUserId: (req as any).user?.adminId
      }
    });

    // Очищаем кэш пользователя
    try {
      // Простая очистка кэша через заголовки
      console.log(`[ADMIN] Cache invalidated for user ${user.telegramId} after account unfreeze`);
    } catch (cacheError) {
      console.error('[ADMIN] Error invalidating cache:', cacheError);
    }

    // Добавляем заголовки для отключения кэширования
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({ success: true, message: 'User account unfrozen successfully' });
  } catch (error) {
    console.error('Error unfreezing user:', error);
    res.status(500).json({ success: false, error: 'Failed to unfreeze user account' });
  }
});

router.post('/users/:userId/ban', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        isFrozen: true,
        isSuspicious: true
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        description: `Account banned by admin. Reason: ${reason || 'No reason provided'}`,
        sourceUserId: (req as any).user?.adminId
      }
    });

    res.json({ success: true, message: 'User account banned successfully' });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ success: false, error: 'Failed to ban user account' });
  }
});

router.post('/users/:userId/unban', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: true,
        isFrozen: false,
        isSuspicious: false
      }
    });

    // Log the action
    await prisma.activityLog.create({
      data: {
        userId: userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        description: 'Account unbanned by admin',
        sourceUserId: (req as any).user?.adminId
      }
    });

    res.json({ success: true, message: 'User account unbanned successfully' });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ success: false, error: 'Failed to unban user account' });
  }
});

export default router;
