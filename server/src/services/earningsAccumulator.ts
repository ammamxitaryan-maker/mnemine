import prisma from '../prisma.js';
import { webSocketManager } from '../websocket/WebSocketManager.js';
import { DatabaseOptimizationService } from './databaseOptimizationService.js';

/**
 * Сервис для накопления доходов от слотов в реальном времени
 */
export class EarningsAccumulator {
  private static instance: EarningsAccumulator;
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;

  private constructor() { }

  public static getInstance(): EarningsAccumulator {
    if (!EarningsAccumulator.instance) {
      EarningsAccumulator.instance = new EarningsAccumulator();
    }
    return EarningsAccumulator.instance;
  }

  /**
   * Запуск сервиса накопления доходов
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Earnings accumulator is already running');
      return;
    }

    console.log('Starting earnings accumulator service...');
    this.isRunning = true;

    // Сначала восстанавливаем доходы за время простоя сервера
    this.recoverEarningsFromDowntime().then(() => {
      console.log('✅ Earnings recovery from server downtime completed');
    }).catch((error) => {
      console.error('❌ Error recovering earnings from downtime:', error);
    });

    // Запускаем накопление каждую минуту для оптимизации производительности
    // Интервал 1 минута обеспечивает баланс между точностью и нагрузкой на сервер
    this.intervalId = setInterval(() => {
      this.accumulateEarnings();
    }, 60000); // 1 минута = 60 секунд

    // Немедленное накопление при запуске
    this.accumulateEarnings();
  }

  /**
   * Остановка сервиса накопления доходов
   */
  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Earnings accumulator service stopped');
  }

  /**
   * Восстановление доходов за время простоя сервера
   */
  public async recoverEarningsFromDowntime(): Promise<void> {
    try {
      console.log('🔄 Starting earnings recovery from server downtime...');

      const activeSlots = await prisma.miningSlot.findMany({
        where: {
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              telegramId: true,
              id: true
            }
          }
        }
      });

      if (activeSlots.length === 0) {
        console.log('📊 No active slots found for earnings recovery');
        return;
      }

      const currentTime = new Date();
      let recoveredSlots = 0;
      let totalRecoveredEarnings = 0;

      // Батчевая обработка для большого количества слотов
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < activeSlots.length; i += BATCH_SIZE) {
        batches.push(activeSlots.slice(i, i + BATCH_SIZE));
      }

      console.log(`📊 Processing ${activeSlots.length} slots in ${batches.length} batches`);

      for (const batch of batches) {
        const batchResults = await Promise.allSettled(
          batch.map(async (slot) => {
            const lastAccrued = new Date(slot.lastAccruedAt);
            const timeDiffMs = currentTime.getTime() - lastAccrued.getTime();

            // Если прошло больше 5 минут с последнего обновления - восстанавливаем доходы
            if (timeDiffMs > 5 * 60 * 1000) {
              const secondsElapsed = timeDiffMs / 1000;
              const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
              let recoveredEarnings = earningsPerSecond * secondsElapsed;

              // Защита от чрезмерного восстановления - максимум 7 дней (время жизни слота)
              const maxRecoveryTimeMs = 7 * 24 * 60 * 60 * 1000; // 7 дней в миллисекундах
              if (timeDiffMs > maxRecoveryTimeMs) {
                console.warn(`⚠️ Slot ${slot.id} downtime exceeds 7 days (${(timeDiffMs / (24 * 60 * 60 * 1000)).toFixed(1)} days), limiting recovery to 7 days`);
                recoveredEarnings = earningsPerSecond * (maxRecoveryTimeMs / 1000);
              }

              // Защита от переполнения - максимум 200% от основной суммы
              const maxEarnings = slot.principal * 2; // Максимум 200% от principal
              if (recoveredEarnings > maxEarnings) {
                console.warn(`⚠️ Slot ${slot.id} recovered earnings (${recoveredEarnings.toFixed(8)}) exceed 200% of principal (${slot.principal}), capping to ${maxEarnings.toFixed(8)}`);
                recoveredEarnings = maxEarnings;
              }

              if (recoveredEarnings > 0) {
                const newAccruedEarnings = slot.accruedEarnings + recoveredEarnings;

                // Обновляем слот с восстановленными доходами
                await prisma.miningSlot.update({
                  where: { id: slot.id },
                  data: {
                    accruedEarnings: newAccruedEarnings,
                    lastAccruedAt: currentTime
                  }
                });

                // Создаем запись о восстановлении доходов
                await prisma.transaction.create({
                  data: {
                    userId: slot.userId,
                    type: 'MINING_EARNINGS_RECOVERED',
                    amount: recoveredEarnings,
                    currency: 'NON',
                    description: `Earnings recovered from server downtime: ${recoveredEarnings.toFixed(8)} NON (${(secondsElapsed / 3600).toFixed(2)} hours)`,
                    referenceId: slot.id
                  }
                });

                // Отправляем уведомление пользователю через WebSocket
                webSocketManager.sendToUser(slot.user.telegramId, 'earnings_recovered', {
                  slotId: slot.id,
                  recoveredAmount: recoveredEarnings,
                  downtimeHours: (secondsElapsed / 3600).toFixed(2),
                  newAccruedEarnings: newAccruedEarnings
                });

                return { recovered: true, amount: recoveredEarnings };
              }
            }
            return { recovered: false, amount: 0 };
          })
        );

        // Подсчитываем результаты батча
        for (const result of batchResults) {
          if (result.status === 'fulfilled' && result.value.recovered) {
            recoveredSlots++;
            totalRecoveredEarnings += result.value.amount;
          } else if (result.status === 'rejected') {
            console.error('❌ Error processing slot in batch:', result.reason);
          }
        }
      }

      if (recoveredSlots > 0) {
        console.log(`✅ Earnings recovery completed: ${recoveredSlots} slots recovered, total: ${totalRecoveredEarnings.toFixed(8)} NON`);

        // Алерт если восстановлено слишком много
        if (totalRecoveredEarnings > 1000) { // Больше 1000 NON
          console.warn(`🚨 HIGH RECOVERY ALERT: Recovered ${totalRecoveredEarnings.toFixed(8)} NON from ${recoveredSlots} slots`);
        }

        // Алерт если много слотов нуждались в восстановлении
        if (recoveredSlots > 100) { // Больше 100 слотов
          console.warn(`🚨 HIGH SLOT COUNT ALERT: ${recoveredSlots} slots needed recovery`);
        }
      } else {
        console.log('📊 No earnings recovery needed - all slots are up to date');
      }

    } catch (error) {
      console.error('❌ Error during earnings recovery from downtime:', error);
    }
  }

  /**
   * Основная логика накопления доходов
   */
  private async accumulateEarnings(): Promise<void> {
    try {
      const activeSlots = await prisma.miningSlot.findMany({
        where: {
          isActive: true,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: {
            select: {
              telegramId: true,
              id: true
            }
          }
        }
      });

      const currentTime = new Date();
      const updates: Array<{ id: string; accruedEarnings: number }> = [];

      for (const slot of activeSlots) {
        const lastAccrued = new Date(slot.lastAccruedAt);
        const timeDiffMs = currentTime.getTime() - lastAccrued.getTime();

        // Минимальный интервал накопления - 1 секунда
        if (timeDiffMs < 1000) continue;

        // Расчет дохода за период с более точной формулой
        const secondsElapsed = timeDiffMs / 1000;

        // Формула дохода: (основная сумма * недельная ставка) / (количество секунд в неделе)
        // Это дает точный доход в секунду
        const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
        const newEarnings = earningsPerSecond * secondsElapsed;

        if (newEarnings > 0) {
          // Округляем до 8 знаков после запятой для избежания ошибок округления
          const roundedEarnings = Math.round((slot.accruedEarnings + newEarnings) * 100000000) / 100000000;

          updates.push({
            id: slot.id,
            accruedEarnings: roundedEarnings
          });
        }
      }

      // Обновляем накопленные доходы в базе данных с использованием batch операций
      if (updates.length > 0) {
        // Use optimized batch update
        await DatabaseOptimizationService.batchUpdateMiningSlots(
          updates.map(update => ({
            id: update.id,
            data: {
              accruedEarnings: update.accruedEarnings,
              lastAccruedAt: currentTime
            }
          }))
        );

        // Отправляем обновления через WebSocket для всех обновленных слотов
        const updatedSlots = activeSlots.filter(slot =>
          updates.some(update => update.id === slot.id)
        );

        for (const slot of updatedSlots) {
          const update = updates.find(u => u.id === slot.id);
          if (update) {
            webSocketManager.sendToUser(slot.user.telegramId, 'slot_earnings_updated', {
              slotId: slot.id,
              accruedEarnings: update.accruedEarnings,
              lastAccruedAt: currentTime,
              principal: slot.principal,
              effectiveWeeklyRate: slot.effectiveWeeklyRate
            });
          }
        }
      }

      if (updates.length > 0) {
        console.log(`Accumulated earnings for ${updates.length} slots`);
      }

    } catch (error) {
      console.error('Error accumulating earnings:', error);
    }
  }

  /**
   * Получить накопленные доходы для пользователя
   */
  public async getUserAccruedEarnings(telegramId: string): Promise<number> {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          miningSlots: {
            where: { isActive: true }
          },
          wallets: true
        }
      });

      if (!user) return 0;

      return user.miningSlots.reduce((total, slot) => total + slot.accruedEarnings, 0);
    } catch (error) {
      console.error('Error getting user accrued earnings:', error);
      return 0;
    }
  }

  /**
   * Выполнить claim накопленных доходов
   */
  public async claimEarnings(telegramId: string, slotIds?: string[]): Promise<{ success: boolean; claimedAmount: number; message: string }> {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          miningSlots: {
            where: {
              isActive: true,
              ...(slotIds && { id: { in: slotIds } })
            }
          },
          wallets: true
        }
      });

      if (!user) {
        return { success: false, claimedAmount: 0, message: 'User not found' };
      }

      let totalClaimed = 0;

      for (const slot of user.miningSlots) {
        if (slot.accruedEarnings > 0) {
          totalClaimed += slot.accruedEarnings;

          // Обновляем слот - обнуляем накопленные доходы
          await prisma.miningSlot.update({
            where: { id: slot.id },
            data: {
              accruedEarnings: 0,
              lastAccruedAt: new Date()
            }
          });

          // Добавляем в активность
          await prisma.activityLog.create({
            data: {
              userId: user.id,
              type: 'CLAIM',
              amount: slot.accruedEarnings,
              description: `Claimed ${slot.accruedEarnings.toFixed(2)} NON from slot earnings`
            }
          });
        }
      }

      if (totalClaimed > 0) {
        // Обновляем баланс пользователя
        const usdWallet = user.wallets.find(w => w.currency === 'USD');
        if (usdWallet) {
          await prisma.wallet.update({
            where: { id: usdWallet.id },
            data: {
              balance: usdWallet.balance + totalClaimed
            }
          });
        }

        // Отправляем обновление через WebSocket
        webSocketManager.sendToUser(telegramId, 'earnings_claimed', {
          claimedAmount: totalClaimed,
          newBalance: usdWallet ? usdWallet.balance + totalClaimed : totalClaimed
        });

        return {
          success: true,
          claimedAmount: totalClaimed,
          message: `Successfully claimed ${totalClaimed.toFixed(2)} NON`
        };
      } else {
        return {
          success: false,
          claimedAmount: 0,
          message: 'No earnings to claim'
        };
      }

    } catch (error) {
      console.error('Error claiming earnings:', error);
      return {
        success: false,
        claimedAmount: 0,
        message: 'Error claiming earnings'
      };
    }
  }

  /**
   * Проверить, есть ли накопленные доходы для claim
   */
  public async hasEarningsToClaim(telegramId: string): Promise<boolean> {
    const totalEarnings = await this.getUserAccruedEarnings(telegramId);
    return totalEarnings > 0.01; // Минимальная сумма для claim
  }

  /**
   * Получить информацию о восстановленных доходах за время простоя
   */
  public async getRecoveryInfo(telegramId: string): Promise<{
    hasRecoveredEarnings: boolean;
    totalRecovered: number;
    recoveryDetails: Array<{
      slotId: string;
      recoveredAmount: number;
      downtimeHours: number;
      lastAccruedAt: Date;
    }>;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          miningSlots: {
            where: { isActive: true }
          }
        }
      });

      if (!user) {
        return {
          hasRecoveredEarnings: false,
          totalRecovered: 0,
          recoveryDetails: []
        };
      }

      const currentTime = new Date();
      const recoveryDetails: Array<{
        slotId: string;
        recoveredAmount: number;
        downtimeHours: number;
        lastAccruedAt: Date;
      }> = [];

      let totalRecovered = 0;

      for (const slot of user.miningSlots) {
        const lastAccrued = new Date(slot.lastAccruedAt);
        const timeDiffMs = currentTime.getTime() - lastAccrued.getTime();

        // Если прошло больше 5 минут - считаем это временем простоя
        if (timeDiffMs > 5 * 60 * 1000) {
          const secondsElapsed = timeDiffMs / 1000;
          const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
          const recoveredEarnings = earningsPerSecond * secondsElapsed;

          if (recoveredEarnings > 0) {
            recoveryDetails.push({
              slotId: slot.id,
              recoveredAmount: recoveredEarnings,
              downtimeHours: secondsElapsed / 3600,
              lastAccruedAt: lastAccrued
            });
            totalRecovered += recoveredEarnings;
          }
        }
      }

      return {
        hasRecoveredEarnings: totalRecovered > 0,
        totalRecovered,
        recoveryDetails
      };

    } catch (error) {
      console.error('Error getting recovery info:', error);
      return {
        hasRecoveredEarnings: false,
        totalRecovered: 0,
        recoveryDetails: []
      };
    }
  }
}

// Экспортируем singleton instance
export const earningsAccumulator = EarningsAccumulator.getInstance();
