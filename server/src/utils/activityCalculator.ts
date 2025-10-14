import prisma from '../prisma.js';

// Константы для расчета активности
const ACTIVITY_WEIGHTS = {
  DEPOSIT: 50,           // Депозит - высший приоритет
  SLOT_PURCHASE: 30,     // Покупка слота
  LOTTERY_TICKET: 10,    // Покупка лотерейного билета
  REFERRAL_ACTIVITY: 20,  // Активность рефералов
  DAILY_LOGIN: 5,        // Ежедневный вход
  WITHDRAWAL: -10,       // Вывод средств (снижает активность)
  INACTIVITY: -5         // Неактивность
};

const ACTIVITY_THRESHOLDS = {
  HIGH_ACTIVITY: 100,    // Высокая активность
  MEDIUM_ACTIVITY: 50,   // Средняя активность
  LOW_ACTIVITY: 20,      // Низкая активность
  INACTIVE: 0            // Неактивен
};

// Интерфейс для результата расчета активности
interface ActivityResult {
  userId: string;
  currentScore: number;
  previousScore: number;
  change: number;
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'INACTIVE';
  recommendations: string[];
  shouldFreeze: boolean;
}

// Основная функция расчета активности пользователя
export const calculateUserActivity = async (userId: string): Promise<ActivityResult> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        referrals: {
          select: {
            id: true,
            hasMadeDeposit: true,
            totalInvested: true,
            lastActivityAt: true
          }
        },
        activityLogs: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Последние 7 дней
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    let activityScore = 0;
    const recommendations: string[] = [];
    let shouldFreeze = false;

    // 1. Анализ депозитов
    if (user.hasMadeDeposit) {
      activityScore += ACTIVITY_WEIGHTS.DEPOSIT;
    } else {
      recommendations.push('Make a deposit to increase activity score');
    }

    // 2. Анализ покупок слотов
    const recentSlotPurchases = user.activityLogs.filter(log => 
      log.type === 'INVESTMENT_CREATED' && 
      log.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    activityScore += recentSlotPurchases.length * ACTIVITY_WEIGHTS.SLOT_PURCHASE;

    // 3. Анализ лотерейных билетов
    const recentLotteryTickets = user.activityLogs.filter(log => 
      log.type === 'LOTTERY_TICKET_PURCHASE' && 
      log.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    activityScore += recentLotteryTickets.length * ACTIVITY_WEIGHTS.LOTTERY_TICKET;

    // 4. Анализ активности рефералов
    const activeReferrals = user.referrals.filter(ref => 
      ref.hasMadeDeposit && 
      ref.lastActivityAt && 
      ref.lastActivityAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    activityScore += activeReferrals.length * ACTIVITY_WEIGHTS.REFERRAL_ACTIVITY;

    // 5. Анализ ежедневных входов
    const dailyLogins = user.activityLogs.filter(log => 
      log.type === 'LOGIN' && 
      log.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    activityScore += dailyLogins.length * ACTIVITY_WEIGHTS.DAILY_LOGIN;

    // 6. Штрафы за выводы
    const recentWithdrawals = user.activityLogs.filter(log => 
      log.type === 'WITHDRAWAL_REQUESTED' && 
      log.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    activityScore += recentWithdrawals.length * ACTIVITY_WEIGHTS.WITHDRAWAL;

    // 7. Штрафы за неактивность
    const daysSinceLastActivity = user.lastActivityAt ? 
      Math.floor((Date.now() - user.lastActivityAt.getTime()) / (24 * 60 * 60 * 1000)) : 999;
    
    if (daysSinceLastActivity > 3) {
      activityScore += ACTIVITY_WEIGHTS.INACTIVITY * daysSinceLastActivity;
    }

    // Определяем уровень активности
    let level: 'HIGH' | 'MEDIUM' | 'LOW' | 'INACTIVE';
    if (activityScore >= ACTIVITY_THRESHOLDS.HIGH_ACTIVITY) {
      level = 'HIGH';
    } else if (activityScore >= ACTIVITY_THRESHOLDS.MEDIUM_ACTIVITY) {
      level = 'MEDIUM';
    } else if (activityScore >= ACTIVITY_THRESHOLDS.LOW_ACTIVITY) {
      level = 'LOW';
    } else {
      level = 'INACTIVE';
    }

    // Рекомендации на основе анализа
    if (level === 'INACTIVE') {
      recommendations.push('Account is at risk of being frozen');
      if (daysSinceLastActivity > 10) {
        shouldFreeze = true;
        recommendations.push('Account should be frozen due to inactivity');
      }
    }

    if (!user.hasMadeDeposit && user.referrals.length === 0) {
      recommendations.push('Make a deposit or invite referrals to increase activity');
    }

    if (activeReferrals.length === 0 && user.referrals.length > 0) {
      recommendations.push('Your referrals are inactive - encourage them to be more active');
    }

    // Обновляем score пользователя
    const previousScore = user.activityScore;
    await prisma.user.update({
      where: { id: userId },
      data: { 
        activityScore: Math.max(0, activityScore),
        lastActivityAt: new Date()
      }
    });

    return {
      userId,
      currentScore: Math.max(0, activityScore),
      previousScore,
      change: Math.max(0, activityScore) - previousScore,
      level,
      recommendations,
      shouldFreeze
    };

  } catch (error) {
    console.error('Error calculating user activity:', error);
    throw error;
  }
};

// Массовый расчет активности всех пользователей
export const calculateAllUsersActivity = async (): Promise<{
  processed: number;
  highActivity: number;
  mediumActivity: number;
  lowActivity: number;
  inactive: number;
  shouldFreeze: string[];
}> => {
  try {
    console.log('🔄 Starting mass activity calculation...');
    
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    let processed = 0;
    let highActivity = 0;
    let mediumActivity = 0;
    let lowActivity = 0;
    let inactive = 0;
    const shouldFreeze: string[] = [];

    for (const user of users) {
      try {
        const result = await calculateUserActivity(user.id);
        processed++;

        switch (result.level) {
          case 'HIGH':
            highActivity++;
            break;
          case 'MEDIUM':
            mediumActivity++;
            break;
          case 'LOW':
            lowActivity++;
            break;
          case 'INACTIVE':
            inactive++;
            break;
        }

        if (result.shouldFreeze) {
          shouldFreeze.push(user.id);
        }

        // Небольшая пауза между обработкой пользователей
        if (processed % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    }

    console.log(`✅ Activity calculation completed: ${processed} users processed`);

    return {
      processed,
      highActivity,
      mediumActivity,
      lowActivity,
      inactive,
      shouldFreeze
    };

  } catch (error) {
    console.error('Error in mass activity calculation:', error);
    throw error;
  }
};

// Автоматическая заморозка неактивных аккаунтов
export const autoFreezeInactiveAccounts = async (): Promise<{
  frozen: number;
  errors: string[];
}> => {
  try {
    console.log('🔄 Starting auto-freeze process...');
    
    const result = await calculateAllUsersActivity();
    let frozen = 0;
    const errors: string[] = [];

    for (const userId of result.shouldFreeze) {
      try {
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
        await prisma.accountFreeze.create({
          data: {
            userId: userId,
            reason: 'INACTIVITY',
            adminId: 'SYSTEM',
            description: 'Auto-frozen due to inactivity (10+ days)'
          }
        });

        // Логируем активность
        await prisma.activityLog.create({
          data: {
            userId: userId,
            type: 'ACCOUNT_FROZEN',
            amount: 0,
            description: 'Account auto-frozen due to inactivity'
          }
        });

        frozen++;
        console.log(`❄️ Frozen account: ${userId}`);

      } catch (error) {
        console.error(`Error freezing account ${userId}:`, error);
        errors.push(`Failed to freeze ${userId}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    console.log(`✅ Auto-freeze completed: ${frozen} accounts frozen`);

    return { frozen, errors };

  } catch (error) {
    console.error('Error in auto-freeze process:', error);
    throw error;
  }
};

// Получение статистики активности
export const getActivityStats = async () => {
  try {
    const stats = await prisma.user.groupBy({
      by: ['isActive', 'isFrozen'],
      _count: { id: true },
      _avg: { activityScore: true }
    });

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({
      where: { isActive: true, isFrozen: false }
    });
    const frozenUsers = await prisma.user.count({
      where: { isFrozen: true }
    });

    return {
      totalUsers,
      activeUsers,
      frozenUsers,
      breakdown: stats,
      activityDistribution: {
        high: await prisma.user.count({
          where: { activityScore: { gte: ACTIVITY_THRESHOLDS.HIGH_ACTIVITY } }
        }),
        medium: await prisma.user.count({
          where: { 
            activityScore: { 
              gte: ACTIVITY_THRESHOLDS.MEDIUM_ACTIVITY,
              lt: ACTIVITY_THRESHOLDS.HIGH_ACTIVITY
            }
          }
        }),
        low: await prisma.user.count({
          where: { 
            activityScore: { 
              gte: ACTIVITY_THRESHOLDS.LOW_ACTIVITY,
              lt: ACTIVITY_THRESHOLDS.MEDIUM_ACTIVITY
            }
          }
        }),
        inactive: await prisma.user.count({
          where: { activityScore: { lt: ACTIVITY_THRESHOLDS.LOW_ACTIVITY } }
        })
      }
    };
  } catch (error) {
    console.error('Error getting activity stats:', error);
    throw error;
  }
};
