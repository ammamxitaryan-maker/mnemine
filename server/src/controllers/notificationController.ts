import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { NOTIFICATION_TYPES } from '../constants.js';
import { userSelectWithoutMiningSlots } from '../utils/dbSelects.js';
import { sendBatchNotifications, getQueueStats, clearNotificationQueue } from '../utils/notificationBatchProcessor.js';

// GET /api/user/:telegramId/notifications
export const getUserNotifications = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error(`Error fetching notifications for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/notifications/mark-read
export const markNotificationAsRead = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { notificationId } = req.body;
  
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.notification.update({
      where: { 
        id: notificationId,
        userId: user.id 
      },
      data: { isRead: true },
    });

    res.status(200).json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error(`Error marking notification as read for user ${telegramId}:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/admin/notifications/send
export const sendNotification = async (req: Request, res: Response) => {
  const { type, title, message, targetUsers } = req.body;
  
  try {
    let userIds: string[] = [];

    if (targetUsers === 'all') {
      const allUsers = await prisma.user.findMany({
        select: { id: true }
      });
      userIds = allUsers.map(user => user.id);
    } else if (Array.isArray(targetUsers)) {
      userIds = targetUsers;
    } else {
      return res.status(400).json({ error: 'Invalid target users' });
    }

    // Для массовых уведомлений используем batch-отправку
    if (userIds.length > 100) {
      const batchResult = await sendBatchNotifications(userIds, type, title, message);
      res.status(200).json({ 
        message: `Batch notification queued for ${userIds.length} users`,
        sentCount: batchResult.sentCount,
        queuedCount: batchResult.queuedCount,
        errors: batchResult.errors
      });
    } else {
      // Для небольших объемов отправляем сразу
      const notifications = userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        isRead: false,
      }));

      await prisma.notification.createMany({
        data: notifications,
      });

      res.status(200).json({ 
        message: `Notification sent to ${userIds.length} users`,
        sentCount: userIds.length 
      });
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Функция для отправки уведомления о закрытии слота
export const sendSlotClosedNotification = async (userId: string, slotId: string, earnings: number) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: NOTIFICATION_TYPES.SLOT_AUTO_CLOSED,
        title: 'Slot Automatically Closed',
        message: `Your mining slot has been automatically closed. You earned ${earnings.toFixed(4)} USD.`,
        isRead: false,
      },
    });
  } catch (error) {
    console.error('Error sending slot closed notification:', error);
  }
};

// Функция для отправки уведомления о новом реферале
export const sendReferralJoinedNotification = async (userId: string, referralName: string) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: NOTIFICATION_TYPES.REFERRAL_JOINED,
        title: 'New Referral Joined',
        message: `${referralName} joined using your referral link!`,
        isRead: false,
      },
    });
  } catch (error) {
    console.error('Error sending referral notification:', error);
  }
};

// GET /api/admin/notifications/queue-stats
export const getNotificationQueueStats = async (req: Request, res: Response) => {
  try {
    const stats = getQueueStats();
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting queue stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get queue stats' 
    });
  }
};

// POST /api/admin/notifications/clear-queue
export const clearNotificationQueueEndpoint = async (req: Request, res: Response) => {
  try {
    clearNotificationQueue();
    res.status(200).json({
      success: true,
      message: 'Notification queue cleared'
    });
  } catch (error) {
    console.error('Error clearing queue:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear queue' 
    });
  }
};

// GET /api/admin/notifications/stats
export const getNotificationStats = async (req: Request, res: Response) => {
  try {
    const { days = 7 } = req.query;
    const daysAgo = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);
    
    const stats = await prisma.notification.groupBy({
      by: ['type', 'isRead'],
      where: {
        createdAt: { gte: daysAgo }
      },
      _count: { id: true }
    });

    const totalNotifications = await prisma.notification.count({
      where: { createdAt: { gte: daysAgo } }
    });

    const unreadNotifications = await prisma.notification.count({
      where: { 
        createdAt: { gte: daysAgo },
        isRead: false 
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalNotifications,
        unreadNotifications,
        readNotifications: totalNotifications - unreadNotifications,
        byType: stats.reduce((acc, stat) => {
          if (!acc[stat.type]) {
            acc[stat.type] = { read: 0, unread: 0 };
          }
          acc[stat.type][stat.isRead ? 'read' : 'unread'] = stat._count.id;
          return acc;
        }, {} as Record<string, { read: number; unread: number }>),
        period: `${days} days`
      }
    });
  } catch (error) {
    console.error('Error getting notification stats:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get notification stats' 
    });
  }
};

