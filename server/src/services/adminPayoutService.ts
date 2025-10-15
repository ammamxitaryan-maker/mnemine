import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { ActivityLogType } from '@prisma/client';

export class AdminPayoutService {
  // GET /api/admin/daily-payouts - Ежедневные выплаты
  static async getDailyPayouts(req: Request, res: Response) {
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
  }

  // GET /api/admin/today-payouts - Сегодняшние выплаты
  static async getTodayPayouts(req: Request, res: Response) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const todayPayouts = await prisma.dailyPayout.findFirst({
        where: {
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        },
        include: {
          details: {
            include: {
              payout: true
            }
          }
        }
      });

      if (!todayPayouts) {
        return res.status(200).json({
          success: true,
          data: {
            message: 'No payouts for today yet',
            payouts: null
          }
        });
      }

      res.status(200).json({
        success: true,
        data: todayPayouts
      });
    } catch (error) {
      console.error('Error fetching today payouts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch today payouts'
      });
    }
  }

  // POST /api/admin/process-today-payouts - Обработка сегодняшних выплат
  static async processTodayPayouts(req: Request, res: Response) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      // Проверяем, есть ли уже обработанные выплаты за сегодня
      const existingPayout = await prisma.dailyPayout.findFirst({
        where: {
          date: {
            gte: startOfDay,
            lt: endOfDay
          }
        }
      });

      if (existingPayout) {
        return res.status(400).json({
          success: false,
          error: 'Payouts for today have already been processed'
        });
      }

      // Получаем всех пользователей с активными слотами
      const usersWithSlots = await prisma.user.findMany({
        where: {
          miningSlots: {
            some: {
              isActive: true,
              expiresAt: {
                lte: new Date() // Слоты, которые истекли
              }
            }
          }
        },
        include: {
          miningSlots: {
            where: {
              isActive: true,
              expiresAt: {
                lte: new Date()
              }
            }
          },
          wallets: {
            where: {
              currency: 'USD'
            }
          }
        }
      });

      if (usersWithSlots.length === 0) {
        return res.status(200).json({
          success: true,
          message: 'No users with expired slots found for payout processing'
        });
      }

      let totalPayoutAmount = 0;
      let processedUsers = 0;

      // Создаем запись о ежедневных выплатах
      const dailyPayout = await prisma.dailyPayout.create({
        data: {
          date: startOfDay,
          totalAmount: 0,
          totalUsers: 0,
          status: 'PROCESSING'
        }
      });

      // Обрабатываем каждого пользователя
      for (const user of usersWithSlots) {
        const USDWallet = user.wallets[0];
        if (!USDWallet) continue;

        let userTotalPayout = 0;

        for (const slot of user.miningSlots) {
          // Рассчитываем доходность (30% за 7 дней)
          const weeklyRate = 0.3;
          const payoutAmount = slot.principal * weeklyRate;
          
          userTotalPayout += payoutAmount;

          // Обновляем слот как неактивный
          await prisma.miningSlot.update({
            where: { id: slot.id },
            data: {
              isActive: false,
              accruedEarnings: payoutAmount
            }
          });

          // Создаем запись о выплате
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              type: ActivityLogType.DAILY_BONUS,
              amount: payoutAmount,
              description: `Daily payout for slot ${slot.id}`
            }
          });
        }

        if (userTotalPayout > 0) {
          // Обновляем баланс пользователя
          await prisma.wallet.update({
            where: { id: USDWallet.id },
            data: {
              balance: { increment: userTotalPayout }
            }
          });

          // Обновляем общую статистику пользователя
          await prisma.user.update({
            where: { id: user.id },
            data: {
              totalEarnings: { increment: userTotalPayout }
            }
          });

          // Создаем лог активности
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              type: ActivityLogType.DAILY_BONUS,
              amount: userTotalPayout,
              description: `Daily payout processed: ${userTotalPayout.toFixed(2)} USD`,
              ipAddress: req.ip || 'system'
            }
          });

          // Создаем детали выплаты
          await prisma.dailyPayoutDetail.create({
            data: {
              payoutId: dailyPayout.id,
              userId: user.id,
              amount: userTotalPayout
            }
          });

          totalPayoutAmount += userTotalPayout;
          processedUsers++;
        }
      }

      // Обновляем общую статистику ежедневных выплат
      await prisma.dailyPayout.update({
        where: { id: dailyPayout.id },
        data: {
          totalAmount: totalPayoutAmount,
          totalUsers: processedUsers,
          status: 'COMPLETED'
        }
      });

      res.status(200).json({
        success: true,
        message: `Successfully processed payouts for ${processedUsers} users`,
        data: {
          totalAmount: totalPayoutAmount,
          totalUsers: processedUsers,
          payoutId: dailyPayout.id
        }
      });
    } catch (error) {
      console.error('Error processing today payouts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process today payouts'
      });
    }
  }
}
