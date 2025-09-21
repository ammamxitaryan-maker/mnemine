"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables - try multiple paths
const envPaths = [
    path_1.default.resolve(__dirname, '../../../.env'), // Root .env (development)
    path_1.default.resolve(__dirname, '../../.env'), // Server .env (fallback)
    path_1.default.resolve(process.cwd(), '.env'), // Current working directory
    path_1.default.resolve(process.cwd(), '../.env'), // Parent directory
];
// Try to load .env from multiple possible locations
for (const envPath of envPaths) {
    try {
        dotenv_1.default.config({ path: envPath });
        console.log(`[ENV] Loaded environment from: ${envPath}`);
        break;
    }
    catch (error) {
        // Continue to next path
    }
}
// Also load from process.env (for production deployments)
dotenv_1.default.config();
// Log environment status for debugging
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('[ENV] TELEGRAM_BOT_TOKEN exists:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('[ENV] PORT:', process.env.PORT);
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = require("http");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const prisma_1 = __importDefault(require("./prisma"));
const constants_1 = require("./constants"); // Only import tasks, boosters are now defined here
const routes_1 = __importDefault(require("./routes"));
const telegraf_1 = require("telegraf");
const helpers_1 = require("./utils/helpers");
const constants_2 = require("./constants"); // Import new slot rate
const WebSocketServer_1 = require("./websocket/WebSocketServer");
const validation_1 = require("./utils/validation");
const errorHandler_1 = require("./middleware/errorHandler");
const requestLogger_1 = require("./middleware/requestLogger");
const security_1 = require("./middleware/security");
// Validate environment variables
(0, validation_1.validateEnvironment)();
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
const port = parseInt(process.env.PORT || '10112', 10);
// Trust proxy for Render deployment
app.set('trust proxy', 1);
// Use environment variables for URLs, fallback to localhost for development
const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Frontend URL for Telegram bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminTelegramId = process.env.ADMIN_TELEGRAM_ID || '6760298907';
// Set fallback values for security variables if not provided
// This ensures the app works in all environments
if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = 'mnemine-jwt-secret-32-chars-minimum-length-required-for-production';
}
if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = 'mnemine-encryption-key-32chars-1234';
}
if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = 'mnemine-session-secret-for-production-use';
}
// Relaxed security middleware for production testing
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false, // Disabled for testing
    crossOriginEmbedderPolicy: false,
    hsts: false // Disabled for testing
}));
// Additional security middleware - relaxed for testing
// app.use(securityHeaders);
// app.use(requestSizeLimiter);
// app.use(sanitizeRequest);
app.use(security_1.securityLogger); // Keep logging for debugging
// Compression middleware
app.use((0, compression_1.default)());
// Logging middleware
app.use(requestLogger_1.requestLogger);
if (process.env.NODE_ENV === 'production') {
    app.use((0, morgan_1.default)('combined'));
}
else {
    app.use((0, morgan_1.default)('dev'));
}
// Relaxed rate limiting for production testing
const limiter = (0, express_rate_limit_1.default)({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10), // Increased to 1000
    message: {
        error: 'Too many requests from this IP, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for health checks, webhook endpoints, and all API calls during testing
        return req.path === '/health' || req.path === '/' || req.path.includes('/webhook/') || req.path.includes('/api/');
    }
});
// Commented out for production testing
// app.use('/api', limiter);
// Auth rate limiting disabled for production testing
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '1000', 10), // Increased to 1000
    message: {
        error: 'Too many authentication attempts, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip rate limiting for all auth endpoints during testing
        return true;
    }
});
// Commented out for production testing
// app.use('/api/auth', authLimiter);
// Relaxed CORS for production testing
const corsOptions = {
    origin: (origin, callback) => {
        // Allow all origins during testing
        console.log(`[CORS] Allowing request from origin: ${origin || 'no-origin'}`);
        callback(null, true);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
    maxAge: 86400, // 24 hours
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key', '*'],
};
app.use((0, cors_1.default)(corsOptions));
// Body parsing middleware
app.use(express_1.default.json({
    limit: '10mb',
    verify: (req, res, buf) => {
        // Store raw body for webhook verification
        req.rawBody = buf;
    }
}));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Serve static files from the public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Relaxed request validation middleware for testing
app.use((req, res, next) => {
    // Allow all content types during testing
    console.log(`[REQUEST] ${req.method} ${req.path} - Content-Type: ${req.get('Content-Type') || 'none'}`);
    next();
});
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Check database connection
        await prisma_1.default.$queryRaw `SELECT 1`;
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected',
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        });
    }
    catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: 'Database connection failed',
            database: 'disconnected'
        });
    }
});
// Initialize bot and setup webhook BEFORE API routes and rate limiting
let bot = null;
if (token && token.length > 0) {
    bot = new telegraf_1.Telegraf(token);
    bot.start((ctx) => {
        console.log(`[BOT] /start command received from user: ${ctx.from?.id} (${ctx.from?.username || ctx.from?.first_name})`);
        const welcomeMessage = "👋 Welcome to TG Mining Sim!\n\nClick the button below to launch the mining app and start earning.";
        ctx.reply(welcomeMessage, {
            reply_markup: {
                inline_keyboard: [
                    [{ text: '🚀 Launch App', web_app: { url: frontendUrl } }]
                ]
            }
        }).then(() => {
            console.log(`[BOT] Welcome message sent to user: ${ctx.from?.id}`);
        }).catch(err => {
            console.error(`[BOT] Failed to send welcome message to user ${ctx.from?.id}:`, err);
        });
    });
    // Add error handling for bot
    bot.catch((err, ctx) => {
        console.error(`[BOT] Error occurred for user ${ctx.from?.id}:`, err);
    });
    // Setup webhook endpoint BEFORE rate limiting
    const webhookPath = `/api/webhook/${token}`;
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `${backendUrl}${webhookPath}`;
    const webhookDelayMs = parseInt(process.env.WEBHOOK_DELAY_MS || '0', 10);
    console.log(`[BOT] Webhook delay configured: ${webhookDelayMs}ms`);
    console.log(`[BOT] Webhook path: ${webhookPath}`);
    console.log(`[BOT] Webhook URL: ${webhookUrl}`);
    // Create webhook callback - use the full path including /api
    const webhookCallback = bot.webhookCallback(`/api/webhook/${token}`);
    if (webhookDelayMs > 0) {
        // Wrap webhook callback with delay
        app.use(webhookPath, async (req, res, next) => {
            console.log(`[WEBHOOK] Processing webhook with ${webhookDelayMs}ms delay...`);
            await new Promise(resolve => setTimeout(resolve, webhookDelayMs));
            webhookCallback(req, res, next);
        });
    }
    else {
        app.use(webhookPath, webhookCallback);
    }
    console.log(`[BOT] Webhook endpoint registered at: ${webhookPath}`);
    console.log("[BOT] Bot initialized successfully");
}
else {
    console.warn("[SERVER] Telegram bot token is not provided. Bot features will be disabled.");
}
// API routes
app.use('/api', routes_1.default);
// Error handling middleware
app.use(errorHandler_1.errorHandler);
// SPA fallback - serve index.html for all non-API routes (GET only to avoid interfering with webhooks)
app.get('*', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
// Global error handler
process.on('uncaughtException', (error) => {
    console.error('[SERVER] Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('[SERVER] Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
async function seedTasks() {
    for (const task of constants_1.tasks) {
        await prisma_1.default.task.upsert({
            where: { taskId: task.taskId },
            update: {},
            create: task,
        });
    }
}
async function seedBoosters() {
    for (const booster of constants_1.boosters) { // Iterate directly over the array
        await prisma_1.default.booster.upsert({
            where: { boosterId: booster.id },
            update: {
                name: booster.name,
                price: booster.price,
                powerIncrease: booster.powerIncrease,
            },
            create: {
                boosterId: booster.id,
                name: booster.name,
                price: booster.price,
                powerIncrease: booster.powerIncrease,
            },
        });
    }
}
async function seedAdmin() {
    const ADMIN_TELEGRAM_ID = adminTelegramId;
    try {
        let user = await prisma_1.default.user.findUnique({
            where: { telegramId: ADMIN_TELEGRAM_ID },
        });
        if (!user) {
            user = await prisma_1.default.user.create({
                data: {
                    telegramId: ADMIN_TELEGRAM_ID,
                    firstName: 'Admin',
                    username: 'admin_dev',
                    role: 'ADMIN',
                    referralCode: await (0, helpers_1.generateUniqueReferralCode)(),
                    wallets: { create: { currency: 'CFM', balance: 0 } }, // Changed currency to CFM
                    miningSlots: {
                        create: {
                            principal: 1.00,
                            startAt: new Date(),
                            lastAccruedAt: new Date(),
                            effectiveWeeklyRate: constants_2.BASE_STANDARD_SLOT_WEEKLY_RATE, // Use new constant
                            expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
                            isActive: true,
                        },
                    },
                    captchaValidated: true, // Default to true for admin
                    isSuspicious: false, // Default to false for admin
                    lastSuspiciousPenaltyAppliedAt: null, // Default to null
                    lastSeenAt: new Date(), // Added lastSeenAt for admin user
                },
            });
        }
        else {
            if (user.role !== 'ADMIN') {
                await prisma_1.default.user.update({
                    where: { id: user.id },
                    data: { role: 'ADMIN' },
                });
            }
        }
        const wallet = await prisma_1.default.wallet.findFirst({
            where: { userId: user.id, currency: 'CFM' }, // Changed currency to CFM
        });
        if (wallet) {
            if (wallet.balance < 50000) {
                await prisma_1.default.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: 50000 },
                });
            }
        }
        else {
            await prisma_1.default.wallet.create({
                data: {
                    userId: user.id,
                    currency: 'CFM', // Changed currency to CFM
                    balance: 50000,
                },
            });
        }
    }
    catch (error) {
        console.error('[DB] CRITICAL: Failed to ensure admin user exists:', error);
    }
}
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    console.log(`[SERVER] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
        console.log('[SERVER] HTTP server closed');
        try {
            await prisma_1.default.$disconnect();
            console.log('[SERVER] Database connection closed');
            process.exit(0);
        }
        catch (error) {
            console.error('[SERVER] Error during shutdown:', error);
            process.exit(1);
        }
    });
    // Force close after 30 seconds
    setTimeout(() => {
        console.error('[SERVER] Forced shutdown after timeout');
        process.exit(1);
    }, 30000);
};
// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
async function startServer() {
    try {
        // Test database connection first
        console.log('[SERVER] Testing database connection...');
        await prisma_1.default.$connect();
        console.log('[SERVER] Database connection successful');
        await Promise.all([seedTasks(), seedBoosters(), seedAdmin()]);
        // Initialize WebSocket server
        const wsServer = new WebSocketServer_1.WebSocketServer(server);
        console.log('[WebSocket] WebSocket server initialized');
        // Set Telegram webhook URL if bot is initialized
        if (bot && token && token.length > 0) {
            const webhookPath = `/api/webhook/${token}`;
            const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `${backendUrl}${webhookPath}`;
            // Only set webhook if backendUrl is HTTPS (for production)
            if (webhookUrl.startsWith('https://')) {
                console.log(`[BOT] Setting webhook to: ${webhookUrl}`);
                bot.telegram.setWebhook(webhookUrl)
                    .then(() => console.log(`[BOT] ✅ Webhook successfully set to ${webhookUrl}`))
                    .catch((err) => console.error('[BOT] ❌ Failed to set webhook:', err));
            }
            else {
                console.warn('[BOT] Webhook not set: Backend URL is not HTTPS. Bot will only respond to direct messages in development.');
            }
        }
        server.listen(port, '0.0.0.0', () => {
            console.log(`[SERVER] Backend server listening on port ${port}`);
            console.log(`[WebSocket] WebSocket server available at ws://localhost:${port}/ws`);
            console.log(`[SERVER] Frontend URL for bot: ${frontendUrl}`);
        });
    }
    catch (error) {
        console.error('[SERVER] Failed to start server:', error);
        console.error('[SERVER] Error details:', error);
        process.exit(1);
    }
}
startServer();
// Export the app for testing
exports.default = app;
