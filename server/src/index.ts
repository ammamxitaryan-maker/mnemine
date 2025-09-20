import dotenv from 'dotenv';
import path from 'path';

// Load environment variables - try multiple paths
const envPaths = [
  path.resolve(__dirname, '../../../.env'),  // Root .env (development)
  path.resolve(__dirname, '../../.env'),     // Server .env (fallback)
  path.resolve(process.cwd(), '.env'),       // Current working directory
  path.resolve(process.cwd(), '../.env'),    // Parent directory
];

// Try to load .env from multiple possible locations
for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath });
    console.log(`[ENV] Loaded environment from: ${envPath}`);
    break;
  } catch (error) {
    // Continue to next path
  }
}

// Also load from process.env (for production deployments)
dotenv.config();

// Log environment status for debugging
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
import prisma from './prisma';
import { tasks, boosters } from './constants'; // Only import tasks, boosters are now defined here
import apiRoutes from './routes';
import { Telegraf } from 'telegraf';
import { generateUniqueReferralCode } from './utils/helpers';
import { BASE_STANDARD_SLOT_WEEKLY_RATE, WELCOME_BONUS_AMOUNT } from './constants'; // Import new slot rate
import { WebSocketServer } from './websocket/WebSocketServer';
import { validateEnvironment } from './utils/validation';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { 
  securityHeaders, 
  requestSizeLimiter, 
  sanitizeRequest, 
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
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Frontend URL for Telegram bot
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminTelegramId = process.env.ADMIN_TELEGRAM_ID || '6760298907';

// Set fallback values for security variables if not provided
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'default-jwt-secret-for-development-only-change-in-production-32chars-12345';
}
if (!process.env.ENCRYPTION_KEY) {
  process.env.ENCRYPTION_KEY = 'default-encryption-key-32chars-1234';
}
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'default-session-secret-for-development';
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Additional security middleware
app.use(securityHeaders);
app.use(requestSizeLimiter);
app.use(sanitizeRequest);
app.use(securityLogger);

// Compression middleware
app.use(compression());

// Logging middleware
app.use(requestLogger);
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/';
  }
});
app.use('/api', limiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '5', 10),
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth', authLimiter);

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.NODE_ENV === 'production' 
      ? [backendUrl, frontendUrl, ...(process.env.ALLOWED_ORIGINS?.split(',') || [])].flat()
      : ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', backendUrl, frontendUrl];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Dynamically allow any localhost origin during development
    if (process.env.NODE_ENV !== 'production' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }

    // Allow same-origin requests (when frontend and backend are served from same domain)
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      console.warn(`[CORS] Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  preflightContinue: false,
  optionsSuccessStatus: 204,
  credentials: true,
  maxAge: 86400, // 24 hours
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
};
app.use(cors(corsOptions));

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

// Request validation middleware
app.use((req: any, res: any, next: any) => {
  // Validate content type for POST/PUT requests
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && 
      !req.is('application/json') && 
      !req.is('application/x-www-form-urlencoded')) {
    return res.status(400).json({ error: 'Invalid content type' });
  }
  next();
});

// Health check endpoint
app.get('/health', async (req: any, res: any) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      database: 'disconnected'
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware
app.use(errorHandler);

// SPA fallback - serve index.html for all non-API routes
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

// Check if token is provided and not just an empty string
if (token && token.length > 0) {
  const bot = new Telegraf(token);

  const webhookPath = `/api/webhook/${token}`;
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `${backendUrl}${webhookPath}`;

  // Webhook delay configuration
  const webhookDelayMs = parseInt(process.env.WEBHOOK_DELAY_MS || '0', 10);
  console.log(`[BOT] Webhook delay configured: ${webhookDelayMs}ms`);

  // Only set webhook if backendUrl is HTTPS (for production)
  if (webhookUrl.startsWith('https://')) {
    console.log(`[BOT] Setting webhook to: ${webhookUrl}`);
    console.log(`[BOT] Webhook path: ${webhookPath}`);
    
    bot.telegram.setWebhook(webhookUrl)
      .then(() => console.log(`[BOT] ✅ Webhook successfully set to ${webhookUrl}`))
      .catch(err => console.error('[BOT] ❌ Failed to set webhook:', err));
    
    // Create webhook callback with delay
    const webhookCallback = bot.webhookCallback(webhookPath);
    
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
  } else {
    console.warn('[BOT] Webhook not set: Backend URL is not HTTPS. Bot will only respond to direct messages in development.');
  }
  
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
} else {
  console.warn("[SERVER] Telegram bot token is not provided. Bot features will be disabled.");
}

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

    await Promise.all([seedTasks(), seedBoosters(), seedAdmin()]);

    // Initialize WebSocket server
    const wsServer = new WebSocketServer(server);
    console.log('[WebSocket] WebSocket server initialized');

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