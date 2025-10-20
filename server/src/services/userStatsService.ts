import { Request, Response } from 'express';
import { LogContext, logger } from '../utils/logger.js';

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  newUsersToday: number;
  activeUsers: number;
  lastUpdate: string;
  isFictitious: boolean;
}

export class UserStatsService {
  private static stats: UserStats = {
    totalUsers: 10000,
    onlineUsers: 150,
    newUsersToday: 45,
    activeUsers: 400,
    lastUpdate: new Date().toISOString(),
    isFictitious: true
  };

  private static lastDayUpdate: number = 0;
  private static lastHourUpdate: number = 0;
  private static updateInterval: NodeJS.Timeout | null = null;

  /**
   * Инициализация сервиса статистики пользователей
   */
  static initialize() {
    this.startStatsUpdater();
    logger.server('UserStatsService initialized');
  }

  /**
   * Запуск обновления статистики
   */
  private static startStatsUpdater() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Обновляем статистику каждые 2 минуты для синхронизации
    this.updateInterval = setInterval(() => {
      this.updateStats();
    }, 2 * 60 * 1000);

    // Первоначальное обновление
    this.updateStats();
  }

  /**
   * Обновление статистики пользователей
   */
  private static updateStats() {
    const now = new Date();
    const currentTime = now.getTime();
    const currentHour = now.getHours();
    const currentDay = Math.floor(currentTime / (24 * 60 * 60 * 1000));

    // Обновляем общее количество пользователей каждый час (+15 пользователей)
    if (currentHour !== this.lastHourUpdate) {
      this.updateTotalUsers();
      this.lastHourUpdate = currentHour;
    }

    // Обновляем онлайн пользователей каждые 2 минуты для синхронизации
    this.updateOnlineUsers(currentHour);

    // Обновляем активных пользователей
    this.updateActiveUsers();

    this.stats.lastUpdate = now.toISOString();

    logger.debug(LogContext.SERVER, 'User stats updated', {
      totalUsers: this.stats.totalUsers,
      onlineUsers: this.stats.onlineUsers,
      newUsersToday: this.stats.newUsersToday,
      activeUsers: this.stats.activeUsers
    });
  }

  /**
   * Обновление общего количества пользователей
   * Добавляем 15 пользователей в час
   */
  private static updateTotalUsers() {
    // Рост: 15 пользователей в час
    const hourlyGrowth = 15;

    this.stats.totalUsers += hourlyGrowth;
    this.stats.newUsersToday = hourlyGrowth;

    logger.server(`Hourly user growth: +${hourlyGrowth} users. Total: ${this.stats.totalUsers}`);
  }

  /**
   * Обновление онлайн пользователей в зависимости от времени суток
   * Обновляется каждые 2 минуты с небольшими изменениями для стабильности
   */
  private static updateOnlineUsers(hour: number) {
    let baseOnline: number;

    // Определяем базовое количество в зависимости от времени суток
    if (hour >= 6 && hour < 12) {
      // Утро: 6:00 - 12:00
      baseOnline = 140;
    } else if (hour >= 12 && hour < 18) {
      // День: 12:00 - 18:00
      baseOnline = 165;
    } else if (hour >= 18 && hour < 22) {
      // Вечер: 18:00 - 22:00
      baseOnline = 155;
    } else {
      // Ночь: 22:00 - 6:00
      baseOnline = 80;
    }

    // Небольшие изменения для реалистичности (±10 пользователей)
    const variation = Math.floor((Math.random() - 0.5) * 20);
    this.stats.onlineUsers = Math.max(50, baseOnline + variation);

    logger.debug(LogContext.SERVER, `Online users updated for hour ${hour}: ${this.stats.onlineUsers} (base: ${baseOnline})`);
  }

  /**
   * Обновление активных пользователей
   */
  private static updateActiveUsers() {
    // Активные пользователи составляют 25-40% от общего количества
    const minPercentage = 0.25;
    const maxPercentage = 0.40;

    const percentage = minPercentage + Math.random() * (maxPercentage - minPercentage);
    this.stats.activeUsers = Math.floor(this.stats.totalUsers * percentage);
  }

  /**
   * GET /api/stats/users - Получение статистики пользователей
   */
  static async getUserStats(req: Request, res: Response) {
    try {
      // Обновляем статистику перед отправкой
      this.updateStats();

      res.status(200).json({
        success: true,
        data: {
          ...this.stats,
          // Добавляем дополнительную информацию
          userGrowthRate: this.calculateGrowthRate(),
          peakHours: this.getPeakHours(),
          timezone: 'UTC'
        }
      });
    } catch (error) {
      logger.error(LogContext.SERVER, 'Error fetching user stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user statistics'
      });
    }
  }

  /**
   * Расчет темпа роста пользователей
   */
  private static calculateGrowthRate(): number {
    // Простой расчет темпа роста за последние 7 дней
    const weeklyGrowth = 7 * 100; // 100 пользователей в день * 7 дней
    const currentTotal = this.stats.totalUsers;
    const previousTotal = currentTotal - weeklyGrowth;

    return ((currentTotal - previousTotal) / previousTotal) * 100;
  }

  /**
   * Получение пиковых часов активности
   */
  private static getPeakHours(): { start: number; end: number; description: string } {
    const hour = new Date().getHours();

    if (hour >= 12 && hour < 18) {
      return { start: 12, end: 18, description: 'Peak activity hours' };
    } else if (hour >= 18 && hour < 22) {
      return { start: 18, end: 22, description: 'Evening activity' };
    } else {
      return { start: 6, end: 12, description: 'Morning activity' };
    }
  }

  /**
   * Получение текущей статистики (для внутреннего использования)
   */
  static getCurrentStats(): UserStats {
    return { ...this.stats };
  }

  /**
   * Остановка сервиса
   */
  static stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    logger.server('UserStatsService stopped');
  }

  /**
   * Сброс статистики (для тестирования)
   */
  static resetStats() {
    this.stats = {
      totalUsers: 10000,
      onlineUsers: 150,
      newUsersToday: 45,
      activeUsers: 400,
      lastUpdate: new Date().toISOString(),
      isFictitious: true
    };
    this.lastDayUpdate = 0;
    this.lastHourUpdate = 0;

    logger.server('User stats reset to default values');
  }
}
