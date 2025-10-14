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

  private constructor() {}

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

    // Запускаем накопление каждые 10 секунд для демонстрации
    // В продакшене можно использовать более частые интервалы или WebSocket события
    this.intervalId = setInterval(() => {
      this.accumulateEarnings();
    }, 10000);

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
              description: `Claimed ${slot.accruedEarnings.toFixed(2)} MNE from slot earnings`
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
          message: `Successfully claimed ${totalClaimed.toFixed(2)} MNE`
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
}

// Экспортируем singleton instance
export const earningsAccumulator = EarningsAccumulator.getInstance();
