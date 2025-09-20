"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeController = void 0;
const prisma_1 = __importDefault(require("../prisma"));
// Real-time data controller for live updates
class RealTimeController {
    // Get live user data with timestamps
    static async getUserData(req, res) {
        try {
            const { telegramId } = req.params;
            const user = await prisma_1.default.user.findUnique({
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
            const activeSlots = user.miningSlots.filter(slot => slot.isActive && new Date(slot.expiresAt) > new Date());
            const totalEarnings = activeSlots.reduce((total, slot) => {
                const now = new Date();
                const lastAccrued = new Date(slot.lastAccruedAt);
                const timeDiff = now.getTime() - lastAccrued.getTime();
                const secondsDiff = timeDiff / 1000;
                const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
                const currentEarnings = earningsPerSecond * secondsDiff;
                return total + currentEarnings;
            }, 0);
            // Get wallet balance
            const wallet = user.wallets.find(w => w.currency === 'CFM');
            const balance = wallet ? wallet.balance : 0;
            const response = {
                ...user,
                balance,
                accruedEarnings: totalEarnings,
                lastUpdated: new Date().toISOString(),
                dataVersion: Date.now()
            };
            res.json(response);
        }
        catch (error) {
            console.error('Error fetching user data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Get live market data
    static async getMarketData(req, res) {
        try {
            const [totalUsers, totalVolume, activeSlots, recentActivity] = await Promise.all([
                prisma_1.default.user.count(),
                prisma_1.default.activityLog.aggregate({
                    where: {
                        type: 'DEPOSIT',
                        createdAt: {
                            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
                        }
                    },
                    _sum: { amount: true }
                }),
                prisma_1.default.miningSlot.count({
                    where: { isActive: true }
                }),
                prisma_1.default.activityLog.count({
                    where: {
                        createdAt: {
                            gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                        }
                    }
                })
            ]);
            const marketData = {
                totalUsers,
                totalVolume: totalVolume._sum.amount || 0,
                activeSlots,
                recentActivity,
                dailyChange: Math.random() * 10 - 5, // Simulated market change
                weeklyChange: Math.random() * 20 - 10,
                monthlyChange: Math.random() * 30 - 15,
                lastUpdated: new Date().toISOString(),
                dataVersion: Date.now()
            };
            res.json(marketData);
        }
        catch (error) {
            console.error('Error fetching market data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Get live slot data with real-time earnings
    static async getSlotsData(req, res) {
        try {
            const { telegramId } = req.params;
            const slots = await prisma_1.default.miningSlot.findMany({
                where: { userId: (await prisma_1.default.user.findUnique({ where: { telegramId } }))?.id },
                orderBy: { createdAt: 'desc' }
            });
            const slotsWithEarnings = slots.map(slot => {
                const now = new Date();
                const lastAccrued = new Date(slot.lastAccruedAt);
                const timeDiff = now.getTime() - lastAccrued.getTime();
                const secondsDiff = timeDiff / 1000;
                const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
                const currentEarnings = earningsPerSecond * secondsDiff;
                return {
                    ...slot,
                    currentEarnings,
                    earningsPerSecond,
                    timeRemaining: slot.isActive ?
                        Math.max(0, new Date(slot.expiresAt).getTime() - now.getTime()) : 0
                };
            });
            res.json({
                slots: slotsWithEarnings,
                lastUpdated: new Date().toISOString(),
                dataVersion: Date.now()
            });
        }
        catch (error) {
            console.error('Error fetching slots data:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Get live activity feed
    static async getActivityFeed(req, res) {
        try {
            const { telegramId } = req.params;
            const { limit = 20, offset = 0 } = req.query;
            const user = await prisma_1.default.user.findUnique({
                where: { telegramId }
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            const activities = await prisma_1.default.activityLog.findMany({
                where: { userId: user.id },
                take: parseInt(limit),
                skip: parseInt(offset),
                orderBy: { createdAt: 'desc' }
            });
            res.json({
                activities,
                lastUpdated: new Date().toISOString(),
                dataVersion: Date.now()
            });
        }
        catch (error) {
            console.error('Error fetching activity feed:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
    // Health check for real-time services
    static async healthCheck(req, res) {
        try {
            const dbStatus = await prisma_1.default.$queryRaw `SELECT 1`;
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                database: 'connected',
                uptime: process.uptime()
            });
        }
        catch (error) {
            res.status(503).json({
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                database: 'disconnected',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }
}
exports.RealTimeController = RealTimeController;
