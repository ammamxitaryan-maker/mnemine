import { Request, Response } from 'express';
import prisma from '../prisma.js';

// Real-time data controller for live updates
export class RealTimeController {
  // Get live user data with timestamps
  static async getUserData(req: Request, res: Response) {
    try {
      const { telegramId } = req.params;
      
      const user = await prisma.user.findUnique({
        where: { telegramId },
        include: {
          wallets: true,
          miningSlots: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
          },
          referrals: {
            select: {
              id: true,
              firstName: true,
              createdAt: true
            }
          },
          activityLogs: {
            take: 10,
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Calculate real-time earnings
      const activeSlots = user.miningSlots.filter(slot => 
        slot.isActive && new Date(slot.expiresAt) > new Date()
      );

      // Calculate earnings using accumulated earnings from database + real-time calculation
      const currentTime = new Date();
      let totalEarnings = 0;

      for (const slot of activeSlots) {
        const timeElapsedMs = currentTime.getTime() - slot.lastAccruedAt.getTime();
        if (timeElapsedMs > 0) {
          const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
          const realTimeEarnings = earningsPerSecond * (timeElapsedMs / 1000);
          // Используем накопленные доходы из базы + реальное время
          totalEarnings += slot.accruedEarnings + realTimeEarnings;
        } else {
          // Если время не прошло, используем только накопленные доходы
          totalEarnings += slot.accruedEarnings;
        }
      }

      // Get wallet balance
      const wallet = user.wallets.find(w => w.currency === 'USD');
      const balance = wallet ? wallet.balance : 0;

      const response = {
        ...user,
        balance,
        accruedEarnings: totalEarnings,
        lastUpdated: new Date().toISOString(),
        dataVersion: Date.now()
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching user data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get live market data
  static async getMarketData(req: Request, res: Response) {
    try {
      // Use consistent fictitious data for all users
      const baseTotalUsers = 1250;
      const timeVariation = Math.sin(Date.now() / (1000 * 60 * 60)) * 50;
      const totalUsers = Math.floor(baseTotalUsers + timeVariation + Math.random() * 20);
      
      // Simulate realistic market data
      const totalVolume = Math.floor(Math.random() * 5000000 + 2000000); // 2M-7M volume
      const activeSlots = Math.floor(totalUsers * (0.3 + Math.random() * 0.2)); // 30-50% of users have slots
      const recentActivity = Math.floor(Math.random() * 200 + 50); // 50-250 recent activities

      const marketData = {
        totalUsers,
        totalVolume,
        activeSlots,
        recentActivity,
        dailyChange: Math.random() * 10 - 5, // Simulated market change
        weeklyChange: Math.random() * 20 - 10,
        monthlyChange: Math.random() * 30 - 15,
        lastUpdated: new Date().toISOString(),
        dataVersion: Date.now(),
        isFictitious: true
      };

      res.json(marketData);
    } catch (error) {
      console.error('Error fetching market data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get live slot data with real-time earnings
  static async getSlotsData(req: Request, res: Response) {
    try {
      const { telegramId } = req.params;
      
      const slots = await prisma.miningSlot.findMany({
        where: { userId: (await prisma.user.findUnique({ where: { telegramId } }))?.id },
        orderBy: { createdAt: 'desc' }
      });

      const slotsWithEarnings = slots.map(slot => {
        const currentTime = new Date();
        const lastAccrued = new Date(slot.lastAccruedAt);
        const timeDiff = currentTime.getTime() - lastAccrued.getTime();
        const secondsDiff = timeDiff / 1000;

        // Используем накопленные доходы из базы данных + расчет реального времени
        const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
        const realTimeEarnings = earningsPerSecond * secondsDiff;
        const currentEarnings = slot.accruedEarnings + realTimeEarnings;

        return {
          ...slot,
          currentEarnings,
          earningsPerSecond,
          timeRemaining: slot.isActive ?
            Math.max(0, new Date(slot.expiresAt).getTime() - currentTime.getTime()) : 0
        };
      });

      res.json({
        slots: slotsWithEarnings,
        lastUpdated: new Date().toISOString(),
        dataVersion: Date.now()
      });
    } catch (error) {
      console.error('Error fetching slots data:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get live activity feed
  static async getActivityFeed(req: Request, res: Response) {
    try {
      const { telegramId } = req.params;
      const { limit = 20, offset = 0 } = req.query;
      
      const user = await prisma.user.findUnique({
        where: { telegramId }
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const activities = await prisma.activityLog.findMany({
        where: { userId: user.id },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        activities,
        lastUpdated: new Date().toISOString(),
        dataVersion: Date.now()
      });
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Health check for real-time services
  static async healthCheck(req: Request, res: Response) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

