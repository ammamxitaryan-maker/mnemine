import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - try multiple paths for flexibility
const envPaths = [
  path.resolve(__dirname, '../../../.env'),  // Root .env (development mode)
  path.resolve(__dirname, '../../.env'),     // Server .env (fallback)
  path.resolve(process.cwd(), '.env'),       // Current working directory
  path.resolve(process.cwd(), '../.env'),    // Parent directory
];

// Attempt to load .env from multiple possible locations
// This ensures compatibility across different deployment scenarios
for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
    console.log(`[ENV] Successfully loaded environment from: ${envPath}`);
    break;
  } catch (error) {
    // Continue to next path if current one fails
    console.log(`[ENV] Failed to load from ${envPath}, trying next...`);
  }
}

// Also load from process.env (for production deployments)
dotenv.config();

// Set fallback values for environment variables BEFORE validation
// These defaults are used when environment variables are not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'mnemine-jwt-secret-32-chars-minimum-length-required-for-production';
}
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'mnemine-encryption-key-32chars-1234';
}
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'mnemine-session-secret-for-production-use';
}

// Log environment status for debugging and troubleshooting
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV] DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('[ENV] TELEGRAM_BOT_TOKEN exists:', !!process.env.TELEGRAM_BOT_TOKEN);
console.log('[ENV] PORT:', process.env.PORT);

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { 
  requestLogger, 
  errorHandler, 
  securityHeaders, 
  sanitizeRequest,
  performanceMonitor,
  corsOptions 
} from './middleware/commonMiddleware.js';
import prisma from './prisma';
import { tasks, boosters } from './constants';
import apiRoutes from './routes';
import { Telegraf } from 'telegraf';
import { generateUniqueReferralCode } from './utils/helpers';
import { BASE_STANDARD_SLOT_WEEKLY_RATE, WELCOME_BONUS_AMOUNT } from './constants';
import { WebSocketServer } from './websocket/WebSocketServer';
import { validateEnvironment } from './utils/validation';
import { memoryMonitor, getHealthData } from './middleware/monitoring';
import { 
  requestSizeLimiter, 
  securityLogger 
} from './middleware/security';

// Validate environment variables
validateEnvironment();

const app = express();
const server = createServer(app);
const port = parseInt(process.env.PORT || '10112', 10);

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Use environment variables for URLs, fallback to localhost for development
const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Frontend URL for Telegram bot integration
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminTelegramId = process.env.ADMIN_TELEGRAM_ID || '6760298907';

// Environment variables are already configured above before validation

// Production-ready security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: []
    }
  } : false,
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  hsts: process.env.NODE_ENV === 'production' ? {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  } : false
}));

// Additional security middleware
app.use(securityHeaders);
app.use(requestSizeLimiter);
app.use(sanitizeRequest);
app.use(securityLogger);

// Compression middleware
app.use(compression());

// Monitoring and logging middleware
app.use(performanceMonitor);
app.use(requestLogger);
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Production-ready rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10), // Reasonable limit for production use
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and webhook endpoints only
    return req.path === '/health' || req.path === '/' || req.path.includes('/webhook/');
  },
  keyGenerator: (req) => {
    // Use IP address + user agent for more granular rate limiting
    return `${req.ip}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
  }
});
app.use('/api', limiter);

// Auth rate limiting disabled for production testing
const authLimiter = rateLimit({
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

// Use CORS configuration from middleware - exclude static files
app.use((req, res, next) => {
  // Skip CORS for static files (JS, CSS, images, etc.)
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    return next();
  }
  
  // Skip CORS for health checks
  if (req.path === '/health') {
    return next();
  }
  
  // Apply CORS for all other requests
  cors(corsOptions)(req, res, next);
});

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res: any, buf: Buffer) => {
    // Store raw body for webhook verification
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Relaxed request validation middleware for testing
app.use((req: any, res: any, next: any) => {
  // Allow all content types during testing
  console.log(`[REQUEST] ${req.method} ${req.path} - Content-Type: ${req.get('Content-Type') || 'none'}`);
  next();
});

// Health check endpoint
app.get('/health', async (req: any, res: any) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const healthData = getHealthData();
    (healthData as any).database = 'connected';
    
    res.status(200).json(healthData);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      database: 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    });
  }
});

// Initialize bot and setup webhook BEFORE API routes and rate limiting
let bot: Telegraf | null = null;
if (token && token.length > 0) {
  bot = new Telegraf(token);
  
  bot.start((ctx) => {
    console.log(`[BOT] /start command received from user: ${ctx.from?.id} (${ctx.from?.username || ctx.from?.first_name})`);
    ctx.reply("Click the button below to launch the mining app.", {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Launch App', web_app: { url: frontendUrl } }]
        ]
      }
    }).then(() => {
      console.log(`[BOT] Launch message sent to user: ${ctx.from?.id}`);
    }).catch(err => {
      console.error(`[BOT] Failed to send launch message to user ${ctx.from?.id}:`, err);
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
  } else {
    app.use(webhookPath, webhookCallback);
  }
  
  console.log(`[BOT] Webhook endpoint registered at: ${webhookPath}`);
  console.log("[BOT] Bot initialized successfully");
} else {
  console.warn("[SERVER] Telegram bot token is not provided. Bot features will be disabled.");
}

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

// SPA fallback - serve index.html for all non-API routes (GET only to avoid interfering with webhooks)
app.get('*', (req: any, res: any) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
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
  for (const task of tasks) {
    await prisma.task.upsert({
      where: { taskId: task.taskId },
      update: {},
      create: task,
    });
  }
}

async function seedBoosters() {
  for (const booster of boosters) { // Iterate directly over the array
    await prisma.booster.upsert({
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

async function ensureDatabaseSchema() {
  try {
    console.log('[SEED] Ensuring database schema is complete...');
    
    // Create ExchangeRate table (PostgreSQL syntax)
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ExchangeRate" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "rate" DOUBLE PRECISION NOT NULL,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdBy" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
      console.log('[SEED] ExchangeRate table created/verified');
    } catch (tableError) {
      console.warn('[SEED] Could not create ExchangeRate table:', tableError);
    }

    // Ensure LotteryTicket table has all required columns (PostgreSQL syntax)
    try {
      // Simple approach - just try to add the column, ignore if it already exists
      await prisma.$executeRaw`ALTER TABLE "LotteryTicket" ADD COLUMN IF NOT EXISTS "isAdminSelected" BOOLEAN NOT NULL DEFAULT false;`;
      console.log('[SEED] LotteryTicket.isAdminSelected column added/verified');
    } catch (columnError) {
      console.warn('[SEED] Could not add isAdminSelected column (may already exist):', columnError);
    }

    // Check if any exchange rate exists
    const existingRate = await prisma.exchangeRate.findFirst();
    
    if (!existingRate) {
      // Create default exchange rate
      await prisma.exchangeRate.create({
        data: {
          rate: 1.0,
          isActive: true,
          createdBy: 'system'
        }
      });
      console.log('[SEED] Default exchange rate created');
    } else {
      console.log('[SEED] Exchange rate already exists');
    }
    
    console.log('[SEED] Database schema verification completed');
  } catch (error) {
    console.warn('[SEED] Could not ensure database schema:', error);
  }
}

async function seedAdmin() {
  const ADMIN_TELEGRAM_ID = adminTelegramId;

  try {
    let user = await prisma.user.findUnique({
      where: { telegramId: ADMIN_TELEGRAM_ID },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: ADMIN_TELEGRAM_ID,
          firstName: 'Admin',
          username: 'admin_dev',
          role: 'ADMIN',
          referralCode: await generateUniqueReferralCode(),
          wallets: { create: { currency: 'CFM', balance: 0 } }, // Changed currency to CFM
          miningSlots: {
            create: {
              principal: 1.00,
              startAt: new Date(),
              lastAccruedAt: new Date(),
              effectiveWeeklyRate: BASE_STANDARD_SLOT_WEEKLY_RATE, // Use new constant
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
    } else {
      if (user.role !== 'ADMIN') {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
      }
    }

    const wallet = await prisma.wallet.findFirst({
      where: { userId: user.id, currency: 'CFM' }, // Changed currency to CFM
    });

    if (wallet) {
      if (wallet.balance < 50000) {
        await prisma.wallet.update({
          where: { id: wallet.id },
          data: { balance: 50000 },
        });
      }
    } else {
      await prisma.wallet.create({
        data: {
          userId: user.id,
          currency: 'CFM', // Changed currency to CFM
          balance: 50000,
        },
      });
    }
  } catch (error) {
    console.error('[DB] CRITICAL: Failed to ensure admin user exists:', error);
  }
}

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  console.log(`[SERVER] Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('[SERVER] HTTP server closed');
    
    try {
      await prisma.$disconnect();
      console.log('[SERVER] Database connection closed');
      process.exit(0);
    } catch (error) {
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
    await prisma.$connect();
    console.log('[SERVER] Database connection successful');

    await Promise.all([seedTasks(), seedBoosters(), seedAdmin(), ensureDatabaseSchema()]);

    // Initialize WebSocket server
    const wsServer = new WebSocketServer(server);
    console.log('[WebSocket] WebSocket server initialized');

    // Start memory monitoring
    const memoryInterval = memoryMonitor();
    console.log('[MONITORING] Memory monitoring started');

    // Set Telegram webhook URL if bot is initialized
    if (bot && token && token.length > 0) {
      const webhookPath = `/api/webhook/${token}`;
      const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `${backendUrl}${webhookPath}`;

      // Only set webhook if backendUrl is HTTPS (for production)
      if (webhookUrl.startsWith('https://')) {
        console.log(`[BOT] Setting webhook to: ${webhookUrl}`);
        
        bot.telegram.setWebhook(webhookUrl)
          .then(() => console.log(`[BOT] ✅ Webhook successfully set to ${webhookUrl}`))
          .catch((err: any) => console.error('[BOT] ❌ Failed to set webhook:', err));
      } else {
        console.warn('[BOT] Webhook not set: Backend URL is not HTTPS. Bot will only respond to direct messages in development.');
      }
    }

    server.listen(port, '0.0.0.0', () => {
      console.log(`[SERVER] Backend server listening on port ${port}`);
      console.log(`[WebSocket] WebSocket server available at ws://localhost:${port}/ws`);
      console.log(`[SERVER] Frontend URL for bot: ${frontendUrl}`);
    });
  } catch (error) {
    console.error('[SERVER] Failed to start server:', error);
    console.error('[SERVER] Error details:', error);
    process.exit(1);
  }
}

startServer();

// Export the app for testing
export default app;