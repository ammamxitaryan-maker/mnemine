import { Request, Response } from 'express';
import prisma from '../prisma.js';

// GET /api/tasks/:telegramId
export const getTasks = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { telegramId }, include: { completedTasks: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const allTasks = await prisma.task.findMany();
    const completedTaskIds = new Set(user.completedTasks.map(t => t.taskId));
    
    const tasksWithStatus = allTasks.map(task => ({
      ...task,
      isCompleted: completedTaskIds.has(task.id),
    }));
    res.status(200).json(tasksWithStatus);
  } catch (error) {
    console.error(`Error fetching tasks for user ${telegramId}:`, error); // Added error logging
    res.status(500).json({ error: 'Internal server error' });
  }
};

// POST /api/user/:telegramId/claim-task
export const claimTaskReward = async (req: Request, res: Response) => {
  const { telegramId } = req.params;
  const { taskId } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { telegramId }, include: { wallets: true } });
    const task = await prisma.task.findUnique({ where: { taskId } });

    if (!user || !task) return res.status(404).json({ error: 'User or task not found' });

    const alreadyCompleted = await prisma.completedTask.findUnique({ where: { userId_taskId: { userId: user.id, taskId: task.id } } });
    if (alreadyCompleted) return res.status(400).json({ error: 'Task already completed' });

    const USDWallet = user.wallets.find(w => w.currency === 'USD');
    if (!USDWallet) return res.status(400).json({ error: 'USD wallet not found' });

    await prisma.$transaction([
      prisma.wallet.update({ where: { id: USDWallet.id }, data: { balance: { increment: task.reward } } }),
      prisma.completedTask.create({ data: { userId: user.id, taskId: task.id } }),
      prisma.activityLog.create({
        data: {
          userId: user.id,
          type: 'TASK_REWARD',
          amount: task.reward,
          description: `Reward for task: ${task.title}`,
        },
      }),
    ]);

    res.status(200).json({ message: 'Task completed, reward added!' });
  } catch (error) {
    console.error(`Error claiming task for user ${telegramId}:`, error); // Added error logging
    res.status(500).json({ error: 'Internal server error' });
  }
};
