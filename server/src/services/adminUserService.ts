import { ActivityLogType } from '@prisma/client';
import { Request, Response } from 'express';
import prisma from '../prisma.js';

export class AdminUserService {
  // GET /api/admin/active-users - Активные пользователи
  static async getActiveUsers(req: Request, res: Response) {
    try {
      const { days = 7, minActivityScore = 0 } = req.query;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

      const activeUsers = await prisma.user.findMany({
        where: {
          isActive: true,
          isFrozen: false,
          lastActivityAt: {
            gte: daysAgo
          },
          activityScore: {
            gte: parseFloat(minActivityScore as string)
          }
        },
        select: {
          id: true,
          telegramId: true,
          firstName: true,
          username: true,
          totalInvested: true,
          totalEarnings: true,
          hasMadeDeposit: true,
          activityScore: true,
          lastActivityAt: true,
          lastDepositAt: true,
          lastSlotPurchaseAt: true,
          lastLotteryTicketAt: true,
          referrals: {
            select: {
              id: true,
              firstName: true,
              username: true,
              totalInvested: true,
              hasMadeDeposit: true
            }
          }
        },
        orderBy: { activityScore: 'desc' }
      });

      // Анализируем качество рефералов
      const usersWithGoodReferrals = activeUsers.filter(user => {
        const goodReferrals = user.referrals.filter(ref =>
          ref.hasMadeDeposit && ref.totalInvested > 0
        );
        return goodReferrals.length > 0;
      });

      res.status(200).json({
        success: true,
        data: {
          totalActiveUsers: activeUsers.length,
          usersWithGoodReferrals: usersWithGoodReferrals.length,
          averageActivityScore: activeUsers.length > 0
            ? activeUsers.reduce((sum, u) => sum + u.activityScore, 0) / activeUsers.length
            : 0,
          users: activeUsers,
          topUsers: activeUsers.slice(0, 10)
        }
      });
    } catch (error) {
      console.error('Error fetching active users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch active users'
      });
    }
  }

  // GET /api/admin/inactive-users - Неактивные пользователи
  static async getInactiveUsers(req: Request, res: Response) {
    try {
      const { days = 30, maxActivityScore = 10 } = req.query;

      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

      const inactiveUsers = await prisma.user.findMany({
        where: {
          OR: [
            {
              lastActivityAt: {
                lt: daysAgo
              }
            },
            {
              lastActivityAt: null
            }
          ],
          activityScore: {
            lte: parseFloat(maxActivityScore as string)
          },
          isFrozen: false
        },
        select: {
          id: true,
          telegramId: true,
          firstName: true,
          username: true,
          totalInvested: true,
          totalEarnings: true,
          hasMadeDeposit: true,
          activityScore: true,
          lastActivityAt: true,
          lastDepositAt: true,
          lastSlotPurchaseAt: true,
          createdAt: true,
          referrals: {
            select: {
              id: true,
              firstName: true,
              username: true,
              totalInvested: true,
              hasMadeDeposit: true
            }
          }
        },
        orderBy: { lastActivityAt: 'asc' }
      });

      // Категоризируем пользователей
      const neverActive = inactiveUsers.filter(user => !user.lastActivityAt);
      const lowActivity = inactiveUsers.filter(user =>
        user.lastActivityAt && user.activityScore < 5
      );
      const dormant = inactiveUsers.filter(user =>
        user.lastActivityAt && user.activityScore >= 5
      );

      res.status(200).json({
        success: true,
        data: {
          totalInactiveUsers: inactiveUsers.length,
          categories: {
            neverActive: neverActive.length,
            lowActivity: lowActivity.length,
            dormant: dormant.length
          },
          users: inactiveUsers,
          neverActive,
          lowActivity,
          dormant
        }
      });
    } catch (error) {
      console.error('Error fetching inactive users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch inactive users'
      });
    }
  }

  // POST /api/admin/freeze-accounts - Заморозка аккаунтов
  static async freezeAccounts(req: Request, res: Response) {
    try {
      const { userIds, reason = 'Administrative action' } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'User IDs array is required'
        });
      }

      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: userId }
          });

          if (!user) {
            errors.push({ userId, error: 'User not found' });
            continue;
          }

          if (user.isFrozen) {
            errors.push({ userId, error: 'User already frozen' });
            continue;
          }

          // Замораживаем аккаунт
          const frozenUser = await prisma.user.update({
            where: { id: userId },
            data: {
              isFrozen: true,
              frozenAt: new Date(),
              frozenReason: reason
            }
          });

          // Создаем запись о заморозке
          await prisma.accountFreeze.create({
            data: {
              userId: userId,
              reason: reason as any,
              adminId: 'ADMIN',
              frozenAt: new Date()
            }
          });

          // Создаем лог активности
          await prisma.activityLog.create({
            data: {
              userId: userId,
              type: ActivityLogType.ACCOUNT_FROZEN,
              amount: 0,
              description: `Account frozen: ${reason}`,
              ipAddress: req.ip || 'system'
            }
          });

          results.push({
            userId,
            telegramId: frozenUser.telegramId,
            status: 'frozen'
          });
        } catch (error) {
          errors.push({ userId, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }

      res.status(200).json({
        success: true,
        message: `Processed ${userIds.length} accounts`,
        data: {
          frozen: results,
          errors: errors
        }
      });
    } catch (error) {
      console.error('Error freezing accounts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to freeze accounts'
      });
    }
  }

  // DELETE /api/admin/user/:userId - Удаление пользователя
  static async deleteUser(req: Request, res: Response) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          error: 'User ID is required'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          wallets: true,
          miningSlots: true,
          referrals: true,
          activityLogs: true
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Admin can delete users regardless of mining slot status
      // All mining slots will be automatically deleted in the transaction below

      // Удаляем пользователя и связанные данные
      await prisma.$transaction([
        // Сначала обновляем всех пользователей, которые ссылаются на удаляемого пользователя как реферера
        prisma.user.updateMany({
          where: { referredById: userId },
          data: { referredById: null }
        }),
        // Удаляем связанные записи в правильном порядке (сначала дочерние, потом родительские)
        prisma.activityLog.deleteMany({ where: { userId: userId } }),
        prisma.referralEarning.deleteMany({ where: { userId: userId } }),
        prisma.notification.deleteMany({ where: { userId: userId } }),
        prisma.completedTask.deleteMany({ where: { userId: userId } }),
        prisma.lotteryTicket.deleteMany({ where: { userId: userId } }),
        prisma.swapTransaction.deleteMany({ where: { userId: userId } }),
        prisma.withdrawal.deleteMany({ where: { userId: userId } }),
        prisma.investment.deleteMany({ where: { userId: userId } }),
        prisma.payment.deleteMany({ where: { userId: userId } }),
        prisma.transaction.deleteMany({ where: { userId: userId } }),
        prisma.wallet.deleteMany({ where: { userId: userId } }),
        prisma.miningSlot.deleteMany({ where: { userId: userId } }),
        prisma.accountFreeze.deleteMany({ where: { userId: userId } }),
        // Удаляем самого пользователя
        prisma.user.delete({ where: { id: userId } })
      ]);

      res.status(200).json({
        success: true,
        message: `User ${user.telegramId} deleted successfully`,
        data: {
          deletedUser: {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username
          }
        }
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: (error as any)?.code,
        meta: (error as any)?.meta,
        stack: error instanceof Error ? error.stack : undefined
      });
      res.status(500).json({
        success: false,
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // DELETE /api/admin/delete-all-users - Удаление всех пользователей
  static async deleteAllUsers(req: Request, res: Response) {
    try {
      const { reason } = req.body;
      const deleteReason = reason || 'No reason provided';

      // Получаем всех пользователей для логирования
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          telegramId: true,
          username: true,
          firstName: true
        }
      });

      if (allUsers.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No users found to delete',
          data: { deletedCount: 0 }
        });
      }

      // Admin can delete all users regardless of mining slot status
      // All mining slots will be automatically deleted in the transaction below

      // Удаляем всех пользователей и связанные данные в транзакции
      const result = await prisma.$transaction(async (tx) => {
        // Удаляем все связанные записи
        await tx.activityLog.deleteMany({});
        await tx.referralEarning.deleteMany({});
        await tx.notification.deleteMany({});
        await tx.completedTask.deleteMany({});
        await tx.lotteryTicket.deleteMany({});
        await tx.swapTransaction.deleteMany({});
        await tx.withdrawal.deleteMany({});
        await tx.investment.deleteMany({});
        await tx.wallet.deleteMany({});
        await tx.miningSlot.deleteMany({});
        await tx.accountFreeze.deleteMany({});

        // Удаляем всех пользователей
        const deletedUsers = await tx.user.deleteMany({});

        return deletedUsers;
      });

      // Логируем действие администратора
      console.log(`[ADMIN ACTION] All users deleted by admin. Reason: ${deleteReason}. Deleted ${result.count} users.`);

      res.status(200).json({
        success: true,
        message: `Successfully deleted all ${result.count} users`,
        data: {
          deletedCount: result.count,
          reason: deleteReason,
          deletedUsers: allUsers.map(user => ({
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName
          }))
        }
      });
    } catch (error) {
      console.error('Error deleting all users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete all users'
      });
    }
  }

  // POST /api/admin/bulk-user-actions - Массовые действия с пользователями
  static async bulkUserActions(req: Request, res: Response) {
    try {
      const { action, userIds, data } = req.body;

      if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Action and user IDs array are required'
        });
      }

      const results = [];
      const errors = [];

      for (const userId of userIds) {
        try {
          let result;

          switch (action) {
            case 'freeze':
              result = await this.freezeUser(userId, data?.reason || 'Bulk action');
              break;
            case 'unfreeze':
              result = await this.unfreezeUser(userId);
              break;
            case 'update_balance':
              result = await this.updateUserBalance(userId, data?.amount, data?.currency);
              break;
            case 'reset_activity':
              result = await this.resetUserActivity(userId);
              break;
            case 'delete':
              result = await this.deleteUserById(userId);
              break;
            default:
              throw new Error(`Unknown action: ${action}`);
          }

          results.push({ userId, action, result });
        } catch (error) {
          errors.push({
            userId,
            action,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      res.status(200).json({
        success: true,
        message: `Bulk action '${action}' completed`,
        data: {
          processed: results,
          errors: errors
        }
      });
    } catch (error) {
      console.error('Error performing bulk user actions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to perform bulk user actions'
      });
    }
  }

  // Вспомогательные методы
  private static async deleteUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        wallets: true,
        miningSlots: true,
        referrals: true,
        activityLogs: true
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Удаляем пользователя и связанные данные
    await prisma.$transaction([
      // Сначала обновляем всех пользователей, которые ссылаются на удаляемого пользователя как реферера
      prisma.user.updateMany({
        where: { referredById: userId },
        data: { referredById: null }
      }),
      // Удаляем связанные записи в правильном порядке (сначала дочерние, потом родительские)
      prisma.activityLog.deleteMany({ where: { userId: userId } }),
      prisma.referralEarning.deleteMany({ where: { userId: userId } }),
      prisma.notification.deleteMany({ where: { userId: userId } }),
      prisma.completedTask.deleteMany({ where: { userId: userId } }),
      prisma.lotteryTicket.deleteMany({ where: { userId: userId } }),
      prisma.swapTransaction.deleteMany({ where: { userId: userId } }),
      prisma.withdrawal.deleteMany({ where: { userId: userId } }),
      prisma.investment.deleteMany({ where: { userId: userId } }),
      prisma.payment.deleteMany({ where: { userId: userId } }),
      prisma.transaction.deleteMany({ where: { userId: userId } }),
      prisma.wallet.deleteMany({ where: { userId: userId } }),
      prisma.miningSlot.deleteMany({ where: { userId: userId } }),
      prisma.accountFreeze.deleteMany({ where: { userId: userId } }),
      // Удаляем самого пользователя
      prisma.user.delete({ where: { id: userId } })
    ]);

    return { status: 'deleted', userId: user.telegramId };
  }

  private static async freezeUser(userId: string, reason: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isFrozen: true,
        frozenAt: new Date(),
        frozenReason: reason
      }
    });

    await prisma.accountFreeze.create({
      data: {
        userId: userId,
        reason: reason as any,
        adminId: 'ADMIN',
        frozenAt: new Date()
      }
    });

    return { status: 'frozen', reason };
  }

  private static async unfreezeUser(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isFrozen: false,
        frozenAt: null,
        frozenReason: null
      }
    });

    return { status: 'unfrozen' };
  }

  private static async updateUserBalance(userId: string, amount: number, currency: string = 'USD') {
    const wallet = await prisma.wallet.findFirst({
      where: { userId, currency }
    });

    if (!wallet) {
      throw new Error(`Wallet not found for currency: ${currency}`);
    }

    const updatedWallet = await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: amount }
    });

    return { balance: updatedWallet.balance, currency };
  }

  private static async resetUserActivity(userId: string) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        activityScore: 0,
        lastActivityAt: null
      }
    });

    return { activityScore: 0 };
  }
}
