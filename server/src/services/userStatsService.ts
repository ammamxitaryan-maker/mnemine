import { Request, Response } from 'express';
import { logger } from '../utils/logger.js';

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
    totalUsers: 1250,
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

    // Обновляем статистику каждые 5 минут
    this.updateInterval = setInterval(() => {
      this.updateStats();
    }, 5 * 60 * 1000);

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

    // Обновляем общее количество пользователей каждые 24 часа
    if (currentDay !== this.lastDayUpdate) {
      this.updateTotalUsers();
      this.lastDayUpdate = currentDay;
    }

    // Обновляем онлайн пользователей каждый час
    if (currentHour !== this.lastHourUpdate) {
      this.updateOnlineUsers(currentHour);
      this.lastHourUpdate = currentHour;
    }

    // Обновляем активных пользователей
    this.updateActiveUsers();

    this.stats.lastUpdate = now.toISOString();

    logger.debug('User stats updated', {
      totalUsers: this.stats.totalUsers,
      onlineUsers: this.stats.onlineUsers,
      newUsersToday: this.stats.newUsersToday,
      activeUsers: this.stats.activeUsers
    });
  }

  /**
   * Обновление общего количества пользователей
   * Добавляем ~100 пользователей в день случайным образом
   */
  private static updateTotalUsers() {
    // Базовый рост: 100 пользователей в день
    const baseGrowth = 100;
    
    // Случайная вариация: ±20 пользователей
    const randomVariation = Math.floor((Math.random() - 0.5) * 40);
    
    const dailyGrowth = baseGrowth + randomVariation;
    
    this.stats.totalUsers += dailyGrowth;
    this.stats.newUsersToday = dailyGrowth;

    logger.server(`Daily user growth: +${dailyGrowth} users. Total: ${this.stats.totalUsers}`);
  }

  /**
   * Обновление онлайн пользователей в зависимости от времени суток
   */
  private static updateOnlineUsers(hour: number) {
    let minOnline: number;
    let maxOnline: number;

    // Определяем диапазон в зависимости от времени суток
    if (hour >= 6 && hour < 12) {
      // Утро: 6:00 - 12:00
      minOnline = 120;
      maxOnline = 160;
    } else if (hour >= 12 && hour < 18) {
      // День: 12:00 - 18:00
      minOnline = 150;
      maxOnline = 182;
    } else if (hour >= 18 && hour < 22) {
      // Вечер: 18:00 - 22:00
      minOnline = 140;
      maxOnline = 175;
    } else {
      // Ночь: 22:00 - 6:00
      minOnline = 45;
      maxOnline = 111;
    }

    // Генерируем случайное количество онлайн пользователей
    this.stats.onlineUsers = Math.floor(
      minOnline + Math.random() * (maxOnline - minOnline)
    );

    logger.debug(`Online users updated for hour ${hour}: ${this.stats.onlineUsers} (range: ${minOnline}-${maxOnline})`);
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
      logger.error('Error fetching user stats:', error);
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
      totalUsers: 1250,
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
