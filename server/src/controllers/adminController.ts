import { Request, Response } from 'express';
import prisma from '../prisma.js';

// GET /api/admin/daily-payouts - Ежедневные выплаты
export const getDailyPayouts = async (req: Request, res: Response) => {
  try {
    const { date, status } = req.query;
    
    const whereClause: any = {};
    if (date) {
      const targetDate = new Date(date as string);
      whereClause.date = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999))
      };
    }
    if (status) {
      whereClause.status = status;
    }

    const payouts = await prisma.dailyPayout.findMany({
      where: whereClause,
      include: {
        details: {
          include: {
            payout: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 30
    });
    
    res.status(200).json({ 
      success: true,
      data: payouts
    });
  } catch (error) {
    console.error('Error fetching daily payouts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch daily payouts' 
    });
  }
};

// GET /api/admin/today-payouts - Сегодняшние выплаты
export const getTodayPayouts = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Находим все инвестиции, которые заканчиваются сегодня
    const expiringInvestments = await prisma.investment.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: {
      select: {
            id: true,
            telegramId: true,
            firstName: true,
            username: true,
            totalInvested: true,
            hasMadeDeposit: true,
            activityScore: true,
            isActive: true,
            isFrozen: true
          }
        }
      }
    });

    // Рассчитываем выплаты
    const payoutDetails = expiringInvestments.map(investment => {
      const expectedReturn = investment.amount * investment.weeklyRate;
      const totalPayout = investment.amount + expectedReturn;
      
      return {
        userId: investment.userId,
        user: investment.user,
        investmentId: investment.id,
        principal: investment.amount,
        earnings: expectedReturn,
        totalPayout: totalPayout,
        isFirstWithdrawal: !investment.user.hasMadeDeposit,
        activityScore: investment.user.activityScore,
        isActive: investment.user.isActive,
        isFrozen: investment.user.isFrozen
      };
    });

    // Группируем по статусу активности
    const activeUsers = payoutDetails.filter(p => p.isActive && !p.isFrozen);
    const inactiveUsers = payoutDetails.filter(p => !p.isActive || p.isFrozen);
    
    const totalAmount = payoutDetails.reduce((sum, p) => sum + p.totalPayout, 0);
    const activeAmount = activeUsers.reduce((sum, p) => sum + p.totalPayout, 0);
    const inactiveAmount = inactiveUsers.reduce((sum, p) => sum + p.totalPayout, 0);

    res.status(200).json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        summary: {
          totalUsers: payoutDetails.length,
          totalAmount: totalAmount,
          activeUsers: activeUsers.length,
          activeAmount: activeAmount,
          inactiveUsers: inactiveUsers.length,
          inactiveAmount: inactiveAmount
        },
        payouts: payoutDetails,
        activeUsers,
        inactiveUsers
      }
    });
  } catch (error) {
    console.error('Error fetching today payouts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch today payouts' 
    });
  }
};

// POST /api/admin/process-today-payouts - Обработать сегодняшние выплаты
export const processTodayPayouts = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Создаем запись о ежедневных выплатах
    const dailyPayout = await prisma.dailyPayout.create({
      data: {
        date: today,
        totalAmount: 0,
        totalUsers: 0,
        status: 'PENDING'
      }
    });

    // Находим все инвестиции, которые заканчиваются сегодня
    const expiringInvestments = await prisma.investment.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          gte: today,
          lt: tomorrow
        }
      },
      include: {
        user: true
      }
    });

    let totalAmount = 0;
    const payoutDetails = [];

    for (const investment of expiringInvestments) {
      const expectedReturn = investment.amount * investment.weeklyRate;
      const totalPayout = investment.amount + expectedReturn;
      
      // Создаем детали выплаты
      const payoutDetail = await prisma.dailyPayoutDetail.create({
      data: {
          payoutId: dailyPayout.id,
          userId: investment.userId,
          amount: totalPayout,
          investmentId: investment.id
        }
      });

      payoutDetails.push(payoutDetail);
      totalAmount += totalPayout;

      // Обновляем инвестицию
      await prisma.investment.update({
        where: { id: investment.id },
        data: {
          status: 'COMPLETED',
          actualReturn: expectedReturn
        }
      });

      // Обновляем баланс пользователя
      const USDWallet = await prisma.wallet.findFirst({
        where: {
          userId: investment.userId,
          currency: 'USD'
        }
      });

      if (USDWallet) {
        await prisma.wallet.update({
          where: { id: USDWallet.id },
          data: { balance: { increment: totalPayout } }
        });
      }

      // Логируем активность
      await prisma.activityLog.create({
        data: {
          userId: investment.userId,
          type: 'INVESTMENT_COMPLETED',
          amount: totalPayout,
          description: `Investment completed: ${investment.amount} USD + ${expectedReturn} USD earnings`
        }
      });
    }

    // Обновляем общую информацию о выплатах
    await prisma.dailyPayout.update({
      where: { id: dailyPayout.id },
      data: {
        totalAmount: totalAmount,
        totalUsers: expiringInvestments.length,
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    res.status(200).json({ 
      success: true,
      message: `Processed ${expiringInvestments.length} payouts totaling ${totalAmount.toFixed(4)} USD`,
      data: {
        payoutId: dailyPayout.id,
        totalAmount: totalAmount,
        totalUsers: expiringInvestments.length,
        details: payoutDetails
      }
    });
  } catch (error) {
    console.error('Error processing today payouts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process today payouts' 
    });
  }
};

// GET /api/admin/active-users - Активные пользователи
export const getActiveUsers = async (req: Request, res: Response) => {
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
};

// GET /api/admin/inactive-users - Неактивные пользователи
export const getInactiveUsers = async (req: Request, res: Response) => {
  try {
    const { days = 10 } = req.query;
    
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(days as string));

    const inactiveUsers = await prisma.user.findMany({
      where: {
        lastActivityAt: {
          lt: daysAgo
        },
        isActive: true,
        isFrozen: false
      },
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        username: true,
        totalInvested: true,
        hasMadeDeposit: true,
        lastActivityAt: true,
        activityScore: true,
        referrals: {
          select: {
            id: true,
            firstName: true,
            hasMadeDeposit: true
          }
        }
      },
      orderBy: { lastActivityAt: 'asc' }
    });

    // Фильтруем пользователей для заморозки
    const usersToFreeze = inactiveUsers.filter(user => {
      // Заморозить если:
      // 1. Не делал депозит
      // 2. Его рефералы тоже неактивны
      // 3. Низкий activity score
      const hasInactiveReferrals = user.referrals.every(ref => !ref.hasMadeDeposit);
      return !user.hasMadeDeposit && hasInactiveReferrals && user.activityScore < 10;
    });

    res.status(200).json({ 
      success: true,
      data: {
        totalInactiveUsers: inactiveUsers.length,
        usersToFreeze: usersToFreeze.length,
        users: inactiveUsers,
        freezeCandidates: usersToFreeze
      }
    });
  } catch (error) {
    console.error('Error fetching inactive users:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch inactive users' 
    });
  }
};

// POST /api/admin/freeze-accounts - Заморозить аккаунты
export const freezeAccounts = async (req: Request, res: Response) => {
  try {
    const { userIds, reason, duration, adminId } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs are required'
      });
    }

    const freezeResults = [];

    for (const userId of userIds) {
      // Замораживаем аккаунт
    await prisma.user.update({
      where: { id: userId },
      data: {
          isFrozen: true,
          frozenAt: new Date(),
          isActive: false
        }
      });

      // Создаем запись о заморозке
      const freezeRecord = await prisma.accountFreeze.create({
        data: {
          userId: userId,
          reason: reason || 'INACTIVITY',
          duration: duration,
          adminId: adminId,
          description: `Account frozen due to: ${reason || 'inactivity'}`
        }
      });

      // Логируем активность
      await prisma.activityLog.create({
        data: {
          userId: userId,
          type: 'ACCOUNT_FROZEN',
          amount: 0,
          description: `Account frozen by admin: ${reason || 'inactivity'}`
        }
      });

      freezeResults.push({
        userId: userId,
        freezeId: freezeRecord.id,
        frozenAt: new Date()
      });
    }

    res.status(200).json({
      success: true,
      message: `Frozen ${userIds.length} accounts`,
      data: freezeResults
    });
  } catch (error) {
    console.error('Error freezing accounts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to freeze accounts' 
    });
  }
};

// DELETE /api/admin/delete-user - Полное удаление пользователя
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { adminId, reason } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Проверяем, существует ли пользователь
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        telegramId: true,
        firstName: true,
        username: true,
        totalInvested: true,
        totalEarnings: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Логируем удаление перед удалением данных
    // Note: We log to userId being deleted since SYSTEM is not a valid user ID
    await prisma.activityLog.create({
      data: {
        userId: userId,
        type: 'ADMIN_ACTION',
        amount: 0,
        description: `User ${user.telegramId} (${user.firstName || user.username}) completely deleted by admin ${adminId || 'UNKNOWN'}. Reason: ${reason || 'No reason provided'}. Total invested: ${user.totalInvested}, Total earnings: ${user.totalEarnings}`,
        sourceUserId: adminId
      }
    });

    // Полное удаление пользователя и всех связанных данных
    await prisma.$transaction(async (tx) => {
      // Удаляем все связанные данные в правильном порядке
      
      // 1. Удаляем логи активности
      await tx.activityLog.deleteMany({
        where: { userId: userId }
      });

      // 2. Удаляем уведомления
      await tx.notification.deleteMany({
        where: { userId: userId }
      });

      // 3. Удаляем кошельки
      await tx.wallet.deleteMany({
        where: { userId: userId }
      });

      // 4. Удаляем слоты
      await tx.miningSlot.deleteMany({
        where: { userId: userId }
      });

      // 5. Удаляем инвестиции
      await tx.investment.deleteMany({
        where: { userId: userId }
      });

      // 6. Удаляем выводы
      await tx.withdrawal.deleteMany({
        where: { userId: userId }
      });

      // 7. Удаляем реферальные доходы
      await tx.referralEarning.deleteMany({
        where: { userId: userId }
      });

      // 8. Удаляем заморозки аккаунта
      await tx.accountFreeze.deleteMany({
        where: { userId: userId }
      });

      // 9. Удаляем лотерейные билеты
      await tx.lotteryTicket.deleteMany({
        where: { userId: userId }
      });

      // 10. Удаляем выполненные задачи
      await tx.completedTask.deleteMany({
        where: { userId: userId }
      });

      // 11. Удаляем транзакции обмена
      await tx.swapTransaction.deleteMany({
        where: { userId: userId }
      });

      // 12. Обновляем рефералов (убираем referredById)
      await tx.user.updateMany({
        where: { referredById: userId },
        data: { referredById: null }
      });

      // 13. Наконец, удаляем самого пользователя
      await tx.user.delete({
        where: { id: userId }
      });
    });

    res.status(200).json({
      success: true,
      message: `User ${user.telegramId} (${user.firstName || user.username}) has been completely deleted from the database`,
      data: {
        deletedUserId: userId,
        deletedUserTelegramId: user.telegramId,
        deletedUserName: user.firstName || user.username,
        totalInvested: user.totalInvested,
        totalEarnings: user.totalEarnings,
        deletedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete user from database' 
    });
  }
};

// POST /api/admin/users/bulk-actions - Bulk user operations
export const bulkUserActions = async (req: Request, res: Response) => {
  try {
    const { userIds, action, reason, adminId } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'User IDs are required'
      });
    }

    if (!action) {
      return res.status(400).json({
        success: false,
        error: 'Action is required'
      });
    }

    const results = [];
    const errors = [];

    for (const userId of userIds) {
      try {
        let result = null;
        
        switch (action) {
          case 'freeze':
            await prisma.user.update({
              where: { id: userId },
              data: {
                isFrozen: true,
                frozenAt: new Date(),
                isActive: false
              }
            });
            
            await prisma.accountFreeze.create({
              data: {
                userId: userId,
                reason: reason || 'BULK_FREEZE',
                adminId: adminId,
                description: `Account frozen in bulk operation: ${reason || 'No reason provided'}`
              }
            });
            
            result = { userId, action: 'frozen', success: true };
            break;
            
          case 'unfreeze':
            await prisma.user.update({
              where: { id: userId },
              data: {
                isFrozen: false,
                frozenAt: null,
                isActive: true
              }
            });
            
            result = { userId, action: 'unfrozen', success: true };
            break;
            
          case 'ban':
            await prisma.user.update({
              where: { id: userId },
              data: {
                isActive: false,
                isFrozen: true,
                isSuspicious: true
              }
            });
            
            result = { userId, action: 'banned', success: true };
            break;
            
          case 'unban':
            await prisma.user.update({
              where: { id: userId },
              data: {
                isActive: true,
                isFrozen: false,
                isSuspicious: false
              }
            });
            
            result = { userId, action: 'unbanned', success: true };
            break;
            
          case 'delete':
            // Get user info before deletion
            const user = await prisma.user.findUnique({
              where: { id: userId },
              select: {
                id: true,
                telegramId: true,
                firstName: true,
                username: true,
                totalInvested: true,
                totalEarnings: true
              }
            });
            
            if (user) {
              // Log deletion before actual deletion
              // Note: We log to userId being deleted since SYSTEM is not a valid user ID
              await prisma.activityLog.create({
                data: {
                  userId: userId,
                  type: 'ADMIN_ACTION',
                  amount: 0,
                  description: `User ${user.telegramId} (${user.firstName || user.username}) deleted in bulk operation by admin ${adminId || 'UNKNOWN'}. Reason: ${reason || 'No reason provided'}. Total invested: ${user.totalInvested}, Total earnings: ${user.totalEarnings}`,
                  sourceUserId: adminId
                }
              });
              
              // Delete all related data
              await prisma.$transaction(async (tx) => {
                await tx.activityLog.deleteMany({ where: { userId: userId } });
                await tx.notification.deleteMany({ where: { userId: userId } });
                await tx.wallet.deleteMany({ where: { userId: userId } });
                await tx.miningSlot.deleteMany({ where: { userId: userId } });
                await tx.investment.deleteMany({ where: { userId: userId } });
                await tx.withdrawal.deleteMany({ where: { userId: userId } });
                await tx.referralEarning.deleteMany({ where: { userId: userId } });
                await tx.accountFreeze.deleteMany({ where: { userId: userId } });
                await tx.lotteryTicket.deleteMany({ where: { userId: userId } });
                await tx.completedTask.deleteMany({ where: { userId: userId } });
                await tx.swapTransaction.deleteMany({ where: { userId: userId } });
                await tx.user.updateMany({ where: { referredById: userId }, data: { referredById: null } });
                await tx.user.delete({ where: { id: userId } });
              });
              
              result = { userId, action: 'deleted', success: true, userInfo: user };
            }
            break;
            
          case 'changeRole':
            const { newRole } = req.body;
            if (!newRole) {
              throw new Error('New role is required for role change');
            }
            
            await prisma.user.update({
              where: { id: userId },
              data: { role: newRole }
            });
            
            result = { userId, action: 'role_changed', success: true, newRole };
            break;
            
          default:
            throw new Error(`Unknown action: ${action}`);
        }
        
        // Log the bulk action
        await prisma.activityLog.create({
          data: {
            userId: userId,
            type: 'PROFILE_UPDATED',
            amount: 0,
            description: `Bulk ${action} operation performed by admin ${adminId || 'UNKNOWN'}. Reason: ${reason || 'No reason provided'}`,
            sourceUserId: adminId
          }
        });
        
        results.push(result);
        
      } catch (error: any) {
        errors.push({
          userId,
          error: error.message,
          success: false
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk operation completed. ${results.length} successful, ${errors.length} failed.`,
      data: {
        results,
        errors,
        summary: {
          total: userIds.length,
          successful: results.length,
          failed: errors.length
        }
      }
    });
  } catch (error) {
    console.error('Error in bulk user actions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to perform bulk user actions' 
    });
  }
};

// GET /api/admin/dashboard-stats - Статистика для админ панели
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Общая статистика
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true, isFrozen: false }
    });
    const frozenUsers = await prisma.user.count({
      where: { isFrozen: true }
    });

    // Финансовая статистика
    const totalInvested = await prisma.user.aggregate({
      _sum: { totalInvested: true }
    });

    const totalEarnings = await prisma.user.aggregate({
      _sum: { totalEarnings: true }
    });

    // Сегодняшние выплаты
    const todayPayouts = await prisma.dailyPayout.findFirst({
      where: {
        date: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999))
        }
      }
    });

    // Активность за неделю
    const weeklyActivity = await prisma.activityLog.count({
      where: {
        createdAt: { gte: weekAgo }
      }
    });

    // Новые пользователи за неделю
    const newUsersThisWeek = await prisma.user.count({
      where: {
        createdAt: { gte: weekAgo }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          frozen: frozenUsers,
          newThisWeek: newUsersThisWeek
        },
        finances: {
          totalInvested: totalInvested._sum.totalInvested || 0,
          totalEarnings: totalEarnings._sum.totalEarnings || 0
        },
        today: {
          payouts: todayPayouts ? {
            amount: todayPayouts.totalAmount,
            users: todayPayouts.totalUsers,
            status: todayPayouts.status
          } : null
        },
        activity: {
          weeklyLogs: weeklyActivity
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
};

// POST /api/admin/reset-database - Полный сброс базы данных
export const resetDatabase = async (req: Request, res: Response) => {
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
    try {
      const sequences = [
        'AccountFreeze_id_seq',
        'ActivityLog_id_seq',
        'CompletedTask_id_seq',
        'Investment_id_seq',
        'LotteryTicket_id_seq',
        'MiningSlot_id_seq',
        'Notification_id_seq',
        'ReferralEarning_id_seq',
        'SwapTransaction_id_seq',
        'Task_id_seq',
        'User_id_seq',
        'Wallet_id_seq',
        'Withdrawal_id_seq',
        'ExchangeRate_id_seq'
      ];

      for (const seq of sequences) {
        await prisma.$executeRawUnsafe(`ALTER SEQUENCE IF EXISTS "${seq}" RESTART WITH 1;`);
      }
      console.log('✅ Auto-increment sequences reset');
    } catch (error) {
      console.log('⚠️  Could not reset sequences (may not exist):', error);
    }

    // Создаем админ-пользователя заново
    let referralCode = '';
    let adminUser: any = null;

    try {
      const generateReferralCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
      };

      referralCode = generateReferralCode();
      let existingUser = await prisma.user.findUnique({ where: { referralCode } });

      while (existingUser) {
        referralCode = generateReferralCode();
        existingUser = await prisma.user.findUnique({ where: { referralCode } });
      }

      adminUser = await prisma.user.create({
        data: {
          telegramId: '6760298907',
          firstName: 'Admin',
          username: 'admin_dev',
          role: 'ADMIN',
          referralCode: referralCode,
          captchaValidated: true,
          isSuspicious: false,
          lastSeenAt: new Date(),
          wallets: {
            create: {
              currency: 'USD',
              balance: 50000
            }
          },
          miningSlots: {
            create: {
              principal: 1.00,
              startAt: new Date(),
              lastAccruedAt: new Date(),
              effectiveWeeklyRate: 0.3,
              expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
              isActive: true,
            }
          }
        }
      });

      // Создаем курс обмена по умолчанию
      await prisma.exchangeRate.create({
        data: {
          rate: 1.0,
          isActive: true,
          createdBy: 'system'
        }
      });

      console.log(`✅ Admin user recreated with ID: ${adminUser.id}`);
      console.log(`🔗 Referral code: ${referralCode}`);

    } catch (adminError) {
      console.error('❌ Error creating admin user:', adminError);
    }

    // Логируем действие админа (если пользователь был создан)
    if (adminUser) {
      await prisma.activityLog.create({
        data: {
          userId: adminUser.id,
          type: 'ADMIN_ACTION',
          amount: 0,
          description: `Database reset performed by admin ${currentAdminUser.telegramId}`
        }
      });
    }

    console.log('🎉 Database reset completed successfully!');

    res.json({
      success: true,
      message: 'Database reset completed successfully. All user data has been cleared.',
      adminUserId: adminUser.id,
      referralCode: referralCode,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset database'
    });
  }
};