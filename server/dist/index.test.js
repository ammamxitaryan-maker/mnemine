"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
// Mock Prisma
const mockPrisma = {
    $queryRaw: vitest_1.vi.fn(),
    user: {
        findUnique: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
    },
    task: {
        upsert: vitest_1.vi.fn(),
    },
    booster: {
        upsert: vitest_1.vi.fn(),
    },
    wallet: {
        findFirst: vitest_1.vi.fn(),
        create: vitest_1.vi.fn(),
        update: vitest_1.vi.fn(),
    },
    miningSlots: {
        create: vitest_1.vi.fn(),
    },
};
vitest_1.vi.mock('./prisma', () => ({
    default: mockPrisma,
}));
// Mock WebSocket
vitest_1.vi.mock('./websocket/WebSocketServer', () => ({
    WebSocketServer: vitest_1.vi.fn().mockImplementation(() => ({
    // Mock WebSocket server methods
    })),
}));
// Mock Telegram bot
vitest_1.vi.mock('telegraf', () => ({
    Telegraf: vitest_1.vi.fn().mockImplementation(() => ({
        telegram: {
            setWebhook: vitest_1.vi.fn().mockResolvedValue(true),
        },
        webhookCallback: vitest_1.vi.fn().mockReturnValue(vitest_1.vi.fn()),
        start: vitest_1.vi.fn(),
    })),
}));
// Mock constants
vitest_1.vi.mock('./constants', () => ({
    tasks: [],
    boosters: [],
    BASE_STANDARD_SLOT_WEEKLY_RATE: 0.05,
    WELCOME_BONUS_AMOUNT: 100,
}));
// Mock helpers
vitest_1.vi.mock('./utils/helpers', () => ({
    generateUniqueReferralCode: vitest_1.vi.fn().mockResolvedValue('TEST123'),
}));
// Mock routes
vitest_1.vi.mock('./routes', () => ({
    default: express_1.default.Router(),
}));
(0, vitest_1.describe)('Backend Server', () => {
    let app;
    (0, vitest_1.beforeAll)(async () => {
        // Set up environment variables
        process.env.NODE_ENV = 'test';
        process.env.PORT = '0'; // Use random port for tests
        process.env.TELEGRAM_BOT_TOKEN = 'test-token';
        process.env.FRONTEND_URL = 'http://localhost:3000';
        process.env.BACKEND_URL = 'http://localhost:10112';
        process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    });
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
    });
    (0, vitest_1.it)('should start server successfully', async () => {
        // Mock successful database connection
        mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
        mockPrisma.user.findUnique.mockResolvedValue(null);
        mockPrisma.user.create.mockResolvedValue({ id: '1', telegramId: '6760298907' });
        mockPrisma.wallet.findFirst.mockResolvedValue(null);
        mockPrisma.wallet.create.mockResolvedValue({ id: '1', balance: 50000 });
        mockPrisma.miningSlots.create.mockResolvedValue({ id: '1' });
        // Import the app after mocks are set up
        const { default: createApp } = await Promise.resolve().then(() => __importStar(require('./index')));
        (0, vitest_1.expect)(createApp).toBeDefined();
    });
    (0, vitest_1.it)('should handle health check endpoint', async () => {
        mockPrisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
        const { default: createApp } = await Promise.resolve().then(() => __importStar(require('./index')));
        const response = await (0, supertest_1.default)(createApp).get('/health');
        (0, vitest_1.expect)(response.status).toBe(200);
        (0, vitest_1.expect)(response.body.status).toBe('healthy');
        (0, vitest_1.expect)(response.body.database).toBe('connected');
    });
    (0, vitest_1.it)('should handle database connection failure in health check', async () => {
        mockPrisma.$queryRaw.mockRejectedValue(new Error('Database connection failed'));
        const { default: createApp } = await Promise.resolve().then(() => __importStar(require('./index')));
        const response = await (0, supertest_1.default)(createApp).get('/health');
        (0, vitest_1.expect)(response.status).toBe(503);
        (0, vitest_1.expect)(response.body.status).toBe('unhealthy');
        (0, vitest_1.expect)(response.body.database).toBe('disconnected');
    });
    (0, vitest_1.it)('should handle 404 errors', async () => {
        const { default: createApp } = await Promise.resolve().then(() => __importStar(require('./index')));
        const response = await (0, supertest_1.default)(createApp).get('/nonexistent');
        (0, vitest_1.expect)(response.status).toBe(404);
        (0, vitest_1.expect)(response.body.error).toBe('Route not found');
    });
    (0, vitest_1.it)('should apply rate limiting', async () => {
        const { default: createApp } = await Promise.resolve().then(() => __importStar(require('./index')));
        // Make multiple requests to trigger rate limiting
        const requests = Array(10).fill(null).map(() => (0, supertest_1.default)(createApp).get('/api/test'));
        const responses = await Promise.all(requests);
        // Some requests should be rate limited
        const rateLimitedResponses = responses.filter((r) => r.status === 429);
        (0, vitest_1.expect)(rateLimitedResponses.length).toBeGreaterThan(0);
    });
});
