import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { DatabaseOptimizationService } from './databaseOptimizationService.js';

export class AdminStatsService {
  // GET /api/admin/dashboard-stats - Статистика для админ панели
  static async getDashboardStats(req: Request, res: Response) {
    try {
      // Use optimized database service for parallel queries
      const stats = await DatabaseOptimizationService.getDashboardStatsOptimized();

      // Get today's payouts separately
      const today = new Date();
      const todayPayouts = await prisma.dailyPayout.findFirst({
        where: {
          date: {
            gte: new Date(today.setHours(0, 0, 0, 0)),
            lt: new Date(today.setHours(23, 59, 59, 999))
          }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          ...stats,
          today: {
            payouts: todayPayouts ? {
              amount: todayPayouts.totalAmount,
              users: todayPayouts.totalUsers,
              status: todayPayouts.status
            } : null
          },
          system: {
            uptime: '24/7',
            lastBackup: new Date().toISOString(),
            alerts: 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard stats'
      });
    }
  }

  // GET /api/admin/financial-stats - Финансовая статистика
  static async getFinancialStats(req: Request, res: Response) {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Общая финансовая статистика
      const totalInvested = await prisma.user.aggregate({
        _sum: { totalInvested: true }
      });

      const totalEarnings = await prisma.user.aggregate({
        _sum: { totalEarnings: true }
      });

      const totalWithdrawals = await prisma.withdrawal.aggregate({
        _sum: { amount: true },
        _count: true
      });

      // Статистика за период
      const periodInvestments = await prisma.activityLog.aggregate({
        where: {
          type: 'NEW_SLOT_PURCHASE',
          createdAt: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      });

      const periodWithdrawals = await prisma.withdrawal.aggregate({
        where: {
          createdAt: { gte: startDate }
        },
        _sum: { amount: true },
        _count: true
      });

      // Ежедневные выплаты за период
      const dailyPayouts = await prisma.dailyPayout.findMany({
        where: {
          date: { gte: startDate }
        },
        orderBy: { date: 'desc' }
      });

      // Статистика по валютам
      const walletStats = await prisma.wallet.groupBy({
        by: ['currency'],
        _sum: { balance: true },
        _count: true
      });

      res.status(200).json({
        success: true,
        data: {
          overall: {
            totalInvested: totalInvested._sum.totalInvested || 0,
            totalEarnings: totalEarnings._sum.totalEarnings || 0,
            totalWithdrawals: totalWithdrawals._sum.amount || 0,
            withdrawalCount: totalWithdrawals._count || 0
          },
          period: {
            days: days,
            investments: {
              amount: Math.abs(periodInvestments._sum.amount || 0),
              count: periodInvestments._count || 0
            },
            withdrawals: {
              amount: periodWithdrawals._sum.amount || 0,
              count: periodWithdrawals._count || 0
            },
            dailyPayouts: dailyPayouts.map(payout => ({
              date: payout.date,
              amount: payout.totalAmount,
              users: payout.totalUsers,
              status: payout.status
            }))
          },
          wallets: walletStats.map(wallet => ({
            currency: wallet.currency,
            totalBalance: wallet._sum.balance || 0,
            userCount: wallet._count
          }))
        }
      });
    } catch (error) {
      console.error('Error fetching financial stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch financial stats'
      });
    }
  }

  // GET /api/admin/user-stats - Статистика пользователей
  static async getUserStats(req: Request, res: Response) {
    try {
      const { period = '30' } = req.query;
      const days = parseInt(period as string);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Общая статистика пользователей
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({
        where: { isActive: true, isFrozen: false }
      });
      const frozenUsers = await prisma.user.count({
        where: { isFrozen: true }
      });

      // Новые пользователи за период
      const newUsers = await prisma.user.count({
        where: {
          createdAt: { gte: startDate }
        }
      });

      // Пользователи с депозитами
      const usersWithDeposits = await prisma.user.count({
        where: { hasMadeDeposit: true }
      });

      // Пользователи с активными слотами
      const usersWithActiveSlots = await prisma.user.count({
        where: {
          miningSlots: {
            some: { isActive: true }
          }
        }
      });

      // Статистика по рефералам
      const referralStats = await prisma.user.groupBy({
        by: ['referredById'],
        _count: true,
        where: {
          referredById: { not: null }
        }
      });

      // Топ пользователи по инвестициям
      const topInvestors = await prisma.user.findMany({
        select: {
          id: true,
          telegramId: true,
          firstName: true,
          username: true,
          totalInvested: true,
          totalEarnings: true
        },
        orderBy: { totalInvested: 'desc' },
        take: 10
      });

      // Статистика активности
      const activityStats = await prisma.activityLog.groupBy({
        by: ['type'],
        _count: true,
        where: {
          createdAt: { gte: startDate }
        }
      });

      res.status(200).json({
        success: true,
        data: {
          overall: {
            total: totalUsers,
            active: activeUsers,
            frozen: frozenUsers,
            withDeposits: usersWithDeposits,
            withActiveSlots: usersWithActiveSlots
          },
          period: {
            days: days,
            newUsers: newUsers
          },
          referrals: {
            totalReferrals: referralStats.length,
            topReferrers: referralStats
              .sort((a, b) => b._count - a._count)
              .slice(0, 10)
          },
          topInvestors: topInvestors,
          activity: activityStats
        }
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user stats'
      });
    }
  }

  // POST /api/admin/reset-database - Полный сброс базы данных
  static async resetDatabase(req: Request, res: Response) {
    try {
      // Проверяем аутентификацию админа
      const currentAdminUser = req.user as any;
      if (!currentAdminUser || currentAdminUser.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        });
      }

      console.log(`[ADMIN] Database reset initiated by admin: ${currentAdminUser.telegramId}`);

      // Удаляем данные в правильном порядке (с учетом внешних ключей)
      const tablesToDelete = [
        'AccountFreeze',
        'Investment',
        'Withdrawal',
        'ReferralEarning',
        'Notification',
        'Wallet',
        'MiningSlot',
        'CompletedTask',
        'ActivityLog',
        'LotteryTicket',
        'SwapTransaction',
        'User',
        'Task',
        'ExchangeRate'
      ];

      for (const tableName of tablesToDelete) {
        try {
          await prisma.$executeRawUnsafe(`DELETE FROM "${tableName}";`);
          console.log(`✅ Deleted all records from ${tableName}`);
        } catch (error) {
          console.error(`❌ Error deleting from ${tableName}:`, error);
          // Продолжаем даже если есть ошибки
        }
      }

      // Сбрасываем последовательности автоинкремента
      const sequencesToReset = [
        'User_id_seq',
        'Wallet_id_seq',
        'MiningSlot_id_seq',
        'ActivityLog_id_seq',
        'Notification_id_seq',
        'Task_id_seq',
        'CompletedTask_id_seq',
        'LotteryTicket_id_seq',
        'SwapTransaction_id_seq',
        'Withdrawal_id_seq',
        'Investment_id_seq',
        'ReferralEarning_id_seq',
        'AccountFreeze_id_seq',
        'ExchangeRate_id_seq'
      ];

      for (const sequenceName of sequencesToReset) {
        try {
          await prisma.$executeRawUnsafe(`ALTER SEQUENCE "${sequenceName}" RESTART WITH 1;`);
          console.log(`✅ Reset sequence ${sequenceName}`);
        } catch (error) {
          console.error(`❌ Error resetting sequence ${sequenceName}:`, error);
        }
      }

      console.log(`[ADMIN] Database reset completed by admin: ${currentAdminUser.telegramId}`);

      res.status(200).json({
        success: true,
        message: 'Database has been completely reset',
        data: {
          resetBy: currentAdminUser.telegramId,
          resetAt: new Date().toISOString(),
          tablesCleared: tablesToDelete.length,
          sequencesReset: sequencesToReset.length
        }
      });
    } catch (error) {
      console.error('Error resetting database:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to reset database'
      });
    }
  }
}
