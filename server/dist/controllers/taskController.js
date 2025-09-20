"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claimTaskReward = exports.getTasks = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// GET /api/tasks/:telegramId
const getTasks = async (req, res) => {
    const { telegramId } = req.params;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId }, include: { completedTasks: true } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const allTasks = await prisma_1.default.task.findMany();
        const completedTaskIds = new Set(user.completedTasks.map(t => t.taskId));
        const tasksWithStatus = allTasks.map(task => ({
            ...task,
            isCompleted: completedTaskIds.has(task.id),
        }));
        res.status(200).json(tasksWithStatus);
    }
    catch (error) {
        console.error(`Error fetching tasks for user ${telegramId}:`, error); // Added error logging
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getTasks = getTasks;
// POST /api/user/:telegramId/claim-task
const claimTaskReward = async (req, res) => {
    const { telegramId } = req.params;
    const { taskId } = req.body;
    try {
        const user = await prisma_1.default.user.findUnique({ where: { telegramId }, include: { wallets: true } });
        const task = await prisma_1.default.task.findUnique({ where: { taskId } });
        if (!user || !task)
            return res.status(404).json({ error: 'User or task not found' });
        const alreadyCompleted = await prisma_1.default.completedTask.findUnique({ where: { userId_taskId: { userId: user.id, taskId: task.id } } });
        if (alreadyCompleted)
            return res.status(400).json({ error: 'Task already completed' });
        const cfmWallet = user.wallets.find(w => w.currency === 'CFM');
        if (!cfmWallet)
            return res.status(400).json({ error: 'CFM wallet not found' });
        await prisma_1.default.$transaction([
            prisma_1.default.wallet.update({ where: { id: cfmWallet.id }, data: { balance: { increment: task.reward } } }),
            prisma_1.default.completedTask.create({ data: { userId: user.id, taskId: task.id } }),
            prisma_1.default.activityLog.create({
                data: {
                    userId: user.id,
                    type: 'TASK_REWARD',
                    amount: task.reward,
                    description: `Reward for task: ${task.title}`,
                },
            }),
        ]);
        res.status(200).json({ message: 'Task completed, reward added!' });
    }
    catch (error) {
        console.error(`Error claiming task for user ${telegramId}:`, error); // Added error logging
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.claimTaskReward = claimTaskReward;
