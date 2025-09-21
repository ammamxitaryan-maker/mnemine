"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
const ws_1 = require("ws");
const url_1 = require("url");
const prisma_1 = __importDefault(require("../prisma"));
class WebSocketServer {
    constructor(server) {
        this.clients = new Map();
        this.broadcastIntervals = new Map();
        this.wss = new ws_1.WebSocketServer({
            server,
            path: '/ws'
        });
        this.setupWebSocketServer();
        this.startBroadcastIntervals();
    }
    setupWebSocketServer() {
        this.wss.on('connection', (ws, request) => {
            console.log('[WebSocket] New connection attempt');
            // Extract telegramId from URL
            const url = new url_1.URL(request.url || '', `http://${request.headers.host}`);
            const pathParts = url.pathname.split('/');
            const telegramId = pathParts[pathParts.length - 1];
            if (!telegramId || telegramId === 'notifications') {
                // Handle notification connections
                this.handleNotificationConnection(ws);
                return;
            }
            // Authenticate user
            this.authenticateUser(ws, telegramId);
        });
    }
    async authenticateUser(ws, telegramId) {
        try {
            const user = await prisma_1.default.user.findUnique({
                where: { telegramId }
            });
            if (!user) {
                ws.close(1008, 'User not found');
                return;
            }
            ws.telegramId = telegramId;
            ws.subscriptions = new Set();
            ws.isAlive = true;
            // Add to clients map
            if (!this.clients.has(telegramId)) {
                this.clients.set(telegramId, new Set());
            }
            this.clients.get(telegramId).add(ws);
            console.log(`[WebSocket] User ${telegramId} connected`);
            // Send initial data
            await this.sendInitialData(ws, telegramId);
            // Setup message handlers
            ws.on('message', (data) => this.handleMessage(ws, data));
            ws.on('close', () => this.handleDisconnect(ws, telegramId));
            ws.on('error', (error) => console.error(`[WebSocket] Error for user ${telegramId}:`, error));
            ws.on('pong', () => { ws.isAlive = true; });
            // Start ping interval
            const pingInterval = setInterval(() => {
                if (ws.isAlive === false) {
                    clearInterval(pingInterval);
                    ws.terminate();
                    return;
                }
                ws.isAlive = false;
                ws.ping();
            }, 30000);
            ws.on('close', () => clearInterval(pingInterval));
        }
        catch (error) {
            console.error(`[WebSocket] Authentication error for ${telegramId}:`, error);
            ws.close(1008, 'Authentication failed');
        }
    }
    handleNotificationConnection(ws) {
        ws.subscriptions = new Set(['notifications']);
        ws.isAlive = true;
        console.log('[WebSocket] Notification client connected');
        ws.on('message', (data) => this.handleNotificationMessage(ws, data));
        ws.on('close', () => console.log('[WebSocket] Notification client disconnected'));
        ws.on('error', (error) => console.error('[WebSocket] Notification error:', error));
    }
    async sendInitialData(ws, telegramId) {
        try {
            // Send user data
            const userData = await this.getUserData(telegramId);
            this.sendToClient(ws, {
                type: 'user_data_update',
                data: userData,
                timestamp: new Date().toISOString()
            });
            // Send slots data
            const slotsData = await this.getSlotsData(telegramId);
            this.sendToClient(ws, {
                type: 'slots_data_update',
                data: slotsData,
                timestamp: new Date().toISOString()
            });
            // Send recent activities
            const activities = await this.getRecentActivities(telegramId);
            this.sendToClient(ws, {
                type: 'activity_update',
                data: activities,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error(`[WebSocket] Error sending initial data to ${telegramId}:`, error);
        }
    }
    handleMessage(ws, data) {
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'subscribe':
                    if (message.data?.types && Array.isArray(message.data.types)) {
                        message.data.types.forEach((type) => {
                            ws.subscriptions?.add(type);
                        });
                    }
                    break;
                case 'unsubscribe':
                    if (message.data?.types && Array.isArray(message.data.types)) {
                        message.data.types.forEach((type) => {
                            ws.subscriptions?.delete(type);
                        });
                    }
                    break;
                case 'ping':
                    this.sendToClient(ws, {
                        type: 'pong',
                        data: { timestamp: new Date().toISOString() },
                        timestamp: new Date().toISOString()
                    });
                    break;
            }
        }
        catch (error) {
            console.error('[WebSocket] Error handling message:', error);
        }
    }
    handleNotificationMessage(ws, data) {
        try {
            const message = JSON.parse(data.toString());
            switch (message.type) {
                case 'mark_read':
                    // Handle marking notification as read
                    break;
                case 'clear_all':
                    // Handle clearing all notifications
                    break;
            }
        }
        catch (error) {
            console.error('[WebSocket] Error handling notification message:', error);
        }
    }
    handleDisconnect(ws, telegramId) {
        console.log(`[WebSocket] User ${telegramId} disconnected`);
        if (this.clients.has(telegramId)) {
            this.clients.get(telegramId).delete(ws);
            if (this.clients.get(telegramId).size === 0) {
                this.clients.delete(telegramId);
            }
        }
    }
    sendToClient(ws, message) {
        if (ws.readyState === ws_1.WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    async getUserData(telegramId) {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId },
            include: {
                wallets: true,
                miningSlots: {
                    where: { isActive: true }
                }
            }
        });
        if (!user)
            return null;
        const wallet = user.wallets.find(w => w.currency === 'CFM');
        const balance = wallet ? wallet.balance : 0;
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
        return {
            ...user,
            balance,
            accruedEarnings: totalEarnings
        };
    }
    async getSlotsData(telegramId) {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId }
        });
        if (!user)
            return [];
        const slots = await prisma_1.default.miningSlot.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });
        return slots.map(slot => {
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
    }
    async getRecentActivities(telegramId) {
        const user = await prisma_1.default.user.findUnique({
            where: { telegramId }
        });
        if (!user)
            return [];
        return await prisma_1.default.activityLog.findMany({
            where: { userId: user.id },
            take: 10,
            orderBy: { createdAt: 'desc' }
        });
    }
    startBroadcastIntervals() {
        // Broadcast market data every 30 seconds
        this.broadcastIntervals.set('market', setInterval(async () => {
            try {
                const marketData = await this.getMarketData();
                this.broadcastToAll({
                    type: 'market_data_update',
                    data: marketData,
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('[WebSocket] Error broadcasting market data:', error);
            }
        }, 30000));
        // Broadcast user earnings every 30 seconds (optimized for better performance)
        this.broadcastIntervals.set('earnings', setInterval(async () => {
            try {
                // Only broadcast to users with active connections
                const activeUsers = Array.from(this.clients.entries()).filter(([_, clients]) => clients.size > 0);
                if (activeUsers.length === 0)
                    return;
                const promises = activeUsers.map(async ([telegramId, clients]) => {
                    try {
                        const userData = await this.getUserData(telegramId);
                        if (userData) {
                            this.broadcastToUser(telegramId, {
                                type: 'earnings_update',
                                data: { earnings: userData.accruedEarnings },
                                timestamp: new Date().toISOString()
                            });
                        }
                    }
                    catch (error) {
                        console.error(`[WebSocket] Error broadcasting earnings for user ${telegramId}:`, error);
                    }
                });
                await Promise.allSettled(promises);
            }
            catch (error) {
                console.error('[WebSocket] Error broadcasting earnings:', error);
            }
        }, 30000));
    }
    async getMarketData() {
        const [totalUsers, totalVolume, activeSlots] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.activityLog.aggregate({
                where: {
                    type: 'DEPOSIT',
                    createdAt: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                },
                _sum: { amount: true }
            }),
            prisma_1.default.miningSlot.count({
                where: { isActive: true }
            })
        ]);
        return {
            totalUsers,
            totalVolume: totalVolume._sum.amount || 0,
            activeSlots,
            dailyChange: Math.random() * 10 - 5,
            weeklyChange: Math.random() * 20 - 10,
            monthlyChange: Math.random() * 30 - 15
        };
    }
    broadcastToAll(message) {
        this.wss.clients.forEach((ws) => {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        });
    }
    broadcastToUser(telegramId, message) {
        const clients = this.clients.get(telegramId);
        if (clients) {
            clients.forEach(ws => {
                if (ws.readyState === ws_1.WebSocket.OPEN) {
                    ws.send(JSON.stringify(message));
                }
            });
        }
    }
    sendNotification(telegramId, notification) {
        this.broadcastToUser(telegramId, {
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
        });
    }
    broadcastNotification(notification) {
        this.broadcastToAll({
            type: 'notification',
            data: notification,
            timestamp: new Date().toISOString()
        });
    }
    getConnectedUsers() {
        return Array.from(this.clients.keys());
    }
    getConnectionCount() {
        return Array.from(this.clients.values()).reduce((total, clients) => total + clients.size, 0);
    }
    close() {
        this.broadcastIntervals.forEach(interval => clearInterval(interval));
        this.wss.close();
    }
}
exports.WebSocketServer = WebSocketServer;
