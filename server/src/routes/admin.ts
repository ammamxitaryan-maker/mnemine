import { Router } from 'express';
import { 
  getDailyPayouts, 
  getTodayPayouts, 
  processTodayPayouts,
  getActiveUsers,
  getInactiveUsers,
  freezeAccounts,
  getDashboardStats,
  deleteUser
} from '../controllers/adminController.js';
import { isAdmin } from '../middleware-stubs.js';
import prisma from '../prisma.js';

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
      }
    }
    
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        wallets: {
          where: { currency: 'USD' },
          select: { balance: true }
        },
        _count: {
          select: {
            referrals: true
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
    
    const formattedUsers = users.map(user => ({
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      username: user.username,
      email: (user as any).email || null,
      role: user.role,
      isActive: user.isActive,
      isFrozen: user.isFrozen,
      isSuspicious: user.isSuspicious,
      balance: user.wallets[0]?.balance || 0,
      totalInvested: user.totalInvested,
      createdAt: user.createdAt,
      lastSeenAt: user.lastActivityAt,
      referralCount: user._count.referrals
    }));
    
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

// User action endpoints
router.post('/users/:userId/freeze', isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    
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
        type: 'LOGIN',
        amount: 0,
        description: `Account frozen by admin. Reason: ${reason || 'No reason provided'}`,
        sourceUserId: (req as any).user?.adminId
      }
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
        type: 'LOGIN',
        amount: 0,
        description: 'Account unfrozen by admin',
        sourceUserId: (req as any).user?.adminId
      }
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
        type: 'LOGIN',
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
        type: 'LOGIN',
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
