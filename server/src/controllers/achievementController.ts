import { Request, Response } from 'express';
import prisma from '../prisma.js';
import { achievements, tasks } from '../constants.js';
import { ActivityLogType } from '@prisma/client'; // Import ActivityLogType

const getAchievementDescription = (id: string, reward: number) => `Achievement Reward: ${id} (${reward} USD)`; // Changed to USD

// GET /api/user/:telegramId/achievements
export const getAchievementsStatus = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        _count: { select: { referrals: true, completedTasks: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        type: { in: [ActivityLogType.DEPOSIT, ActivityLogType.TASK_REWARD] }, // Use ActivityLogType
      },
    });

    const achievementStatus = await Promise.all(
      Object.values(achievements).map(async (ach) => {
        let isCompleted = false;
        const isClaimed = activityLogs.some(log => log.type === ActivityLogType.TASK_REWARD && log.description === getAchievementDescription(ach.id, ach.reward)); // Use ActivityLogType

        switch (ach.id) {
          case 'FIRST_DEPOSIT':
            isCompleted = activityLogs.some(log => log.type === ActivityLogType.DEPOSIT); // Use ActivityLogType
            break;
          case 'FIVE_REFERRALS':
            isCompleted = user._count.referrals >= 5;
            break;
          case 'BUY_BOOSTER':
            isCompleted = false; // Booster functionality removed
            break;
          case 'COMPLETE_ALL_TASKS':
            isCompleted = user._count.completedTasks >= tasks.length;
            break;
        }
        return { ...ach, isCompleted, isClaimed };
      })
    );

    res.status(200).json(achievementStatus);
  } catch (error) {
    console.error(`Error fetching achievement status for user ${telegramId}:`, error); // Added error logging
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/achievements/claim
export const claimAchievementReward = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { achievementId } = req.body;
  const achievement = achievements[achievementId as keyof typeof achievements];

  if (!achievement) return res.status(404).json({ error: 'Achievement not found' });

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        wallets: true,
        _count: { select: { referrals: true, completedTasks: true } },
      },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const activityLogs = await prisma.activityLog.findMany({
      where: {
        userId: user.id,
        type: { in: [ActivityLogType.DEPOSIT, ActivityLogType.TASK_REWARD] }, // Use ActivityLogType
      },
    });

    const description = getAchievementDescription(achievement.id, achievement.reward);
    const isClaimed = activityLogs.some(log => log.type === ActivityLogType.TASK_REWARD && log.description === description); // Use ActivityLogType
    if (isClaimed) return res.status(400).json({ error: 'Achievement already claimed' });

    let isCompleted = false;
    switch (achievement.id) {
      case 'FIRST_DEPOSIT':
        isCompleted = activityLogs.some(log => log.type === ActivityLogType.DEPOSIT); // Use ActivityLogType
        break;
      case 'FIVE_REFERRALS':
        isCompleted = user._count.referrals >= 5;
        break;
      case 'BUY_BOOSTER':
        isCompleted = false; // Booster functionality removed
        break;
      case 'COMPLETE_ALL_TASKS':
        isCompleted = user._count.completedTasks >= tasks.length;
        break;
    }

    if (!isCompleted) return res.status(400).json({ error: 'Achievement not completed' });

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet) return res.status(400).json({ error: 'USD wallet not found' });

    await prisma.$transaction([
      prisma.wallet.update({
        where: { id: USDWallet.id },
        data: { balance: { increment: achievement.reward } },
      }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: ActivityLogType.TASK_REWARD, // Use ActivityLogType
          amount: achievement.reward,
          description,
        },
      }),
    ]);

    res.status(200).json({ message: 'Achievement reward claimed!' });
  } catch (error) {
    console.error(`Error claiming achievement reward for user ${telegramId}:`, error); // Added error logging
    res.status(500).json({ error: 'Internal server error' });
  }
};
