import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { logger, LogContext, LogLevel } from './utils/logger.js';
import { smartConsoleReplacement } from './utils/consoleReplacer.js';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize structured logging
logger.setLevel(process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG);
smartConsoleReplacement();

// Production-optimized environment loading
if (process.env.NODE_ENV === 'production') {
  logger.server('Production mode - using process.env variables');
} else {
  // Development mode - try multiple paths for flexibility
  const envPaths = [
    path.resolve(__dirname, '../../../.env.local'),
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../.env'),
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../.env'),
  ];

  // Attempt to load .env from multiple possible locations
  for (const envPath of envPaths) {
    try {
      dotenv.config({ path: envPath });
      logger.server(`Successfully loaded environment from: ${envPath}`);
      break;
    } catch (error) {
      logger.debug(LogContext.SERVER, `Failed to load from ${envPath}, trying next...`);
    }
  }
  
  dotenv.config();
}

// Set fallback values for environment variables BEFORE validation
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    logger.error(LogContext.SERVER, 'CRITICAL: DATABASE_URL not set in production!');
    throw new Error('DATABASE_URL must be set in production environment');
  }
  process.env.DATABASE_URL = 'postgresql://localhost:5432/mnemine_dev';
}

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    logger.error(LogContext.SERVER, 'CRITICAL: JWT_SECRET not set in production!');
    throw new Error('JWT_SECRET must be set in production environment');
  } else {
    process.env.JWT_SECRET = 'local-jwt-secret-32-chars-minimum-length-dev-only';
  }
}

if (!process.env.ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'production') {
    logger.error(LogContext.SERVER, 'CRITICAL: ENCRYPTION_KEY not set in production!');
    throw new Error('ENCRYPTION_KEY must be set in production environment');
  } else {
    process.env.ENCRYPTION_KEY = 'local-encryption-key-32chars-dev-only-1234';
  }
}

if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    logger.error(LogContext.SERVER, 'CRITICAL: SESSION_SECRET not set in production!');
    throw new Error('SESSION_SECRET must be set in production environment');
  } else {
    process.env.SESSION_SECRET = 'local-session-secret-for-development-only';
  }
}

// Log environment status for debugging and troubleshooting
logger.server('Environment configuration loaded', {
  nodeEnv: process.env.NODE_ENV,
  hasDatabaseUrl: !!process.env.DATABASE_URL,
  hasTelegramToken: !!process.env.TELEGRAM_BOT_TOKEN,
  port: process.env.PORT,
});

import express from 'express';
import { createServer } from 'http';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import prisma from './prisma.js';
import { tasks } from './constants.js';
import apiRoutes from './routes/index.js';
import { Telegraf } from 'telegraf';
import { generateUniqueReferralCode } from './utils/helpers.js';
import { SLOT_WEEKLY_RATE, WELCOME_BONUS_AMOUNT } from './constants.js';
import { WebSocketServer } from './websocket/WebSocketServer.js';
import { webSocketManager } from './websocket/WebSocketManager.js';
import { validateEnvironment } from './utils/validation.js';
import { ProductionHealthCheck } from './utils/productionHealthCheck.js';
import { requestLogger, websocketLogger, authLogger, businessLogger } from './middleware/requestLogger.js';
import './utils/slotProcessor.js';

// Validate environment variables
validateEnvironment();

const app = express();
const server = createServer(app);
const port = parseInt(process.env.PORT || '10112', 10);

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Add structured logging middleware
app.use(requestLogger);
app.use(websocketLogger);
app.use(authLogger);
app.use(businessLogger);

// Use environment variables for URLs, fallback to localhost for development
const backendUrl = process.env.BACKEND_URL || `http://localhost:${port}`;
const frontendUrl = process.env.FRONTEND_URL || backendUrl;
const token = process.env.TELEGRAM_BOT_TOKEN;
const adminTelegramId = process.env.ADMIN_TELEGRAM_ID || '6760298907';

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
      frameAncestors: ["'self'", "https://web.telegram.org", "https://telegram.org"],
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

// Telegram WebApp iframe support middleware
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors https://web.telegram.org https://telegram.org");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Compression middleware
app.use(compression());

// Monitoring and logging middleware
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000', 10),
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => true, // Effectively disabled
  keyGenerator: (req) => {
    return `${req.ip}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
  }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || '1000', 10),
  message: {
    error: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => true, // Effectively disabled
});

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const origin = req.headers.origin;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const referer = req.get('Referer') || 'None';
  
  console.log(`[REQUEST] ${req.method} ${req.path}`);
  console.log(`[REQUEST] Origin: ${origin || 'undefined (direct access)'}`);
  console.log(`[REQUEST] User-Agent: ${userAgent}`);
  console.log(`[REQUEST] Referer: ${referer}`);
  console.log(`[REQUEST] Content-Type: ${req.get('Content-Type') || 'None'}`);
  console.log(`[REQUEST] IP: ${req.ip}`);
  
  // Detect Telegram WebApp requests
  const isTelegramBot = userAgent.includes('TelegramBot');
  const isTelegramWebApp = userAgent.includes('TelegramWebApp') || 
                          userAgent.includes('Telegram') ||
                          referer.includes('t.me') || 
                          origin?.includes('telegram') ||
                          req.query.tgWebAppData ||
                          req.headers['x-telegram-init-data'];
  
  if (isTelegramBot) {
    console.log(`[TELEGRAM] Telegram Bot request detected`);
  }
  
  if (isTelegramWebApp) {
    console.log(`[TELEGRAM] Telegram WebApp request detected`);
    console.log(`[TELEGRAM] WebApp Data: ${req.query.tgWebAppData || 'None'}`);
    console.log(`[TELEGRAM] Init Data Header: ${req.headers['x-telegram-init-data'] || 'None'}`);
  }
  
  // CORS handling
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, x-telegram-init-data');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log(`[CORS] Handling preflight request for ${req.path} from origin: ${origin || 'undefined'}`);
    res.status(200).end();
    return;
  }
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[RESPONSE] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
    
    if (res.statusCode >= 400) {
      console.error(`[ERROR] ${req.method} ${req.path} returned ${res.statusCode}`);
    }
  });
  
  next();
});

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req: any, res: any, buf: Buffer) => {
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// Request validation middleware
app.use((req: any, res: any, next: any) => {
  console.log(`[REQUEST] ${req.method} ${req.path} - Content-Type: ${req.get('Content-Type') || 'none'}`);
  next();
});

// Production health check endpoint
app.get('/health', async (req: any, res: any) => {
  try {
    const dbCheckPromise = prisma.$queryRaw`SELECT 1`;
    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database timeout')), 5000)
    );
    
    await Promise.race([dbCheckPromise, dbTimeoutPromise]);
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      health: ProductionHealthCheck.getHealthStatus(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      database: 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      health: ProductionHealthCheck.getHealthStatus(),
    });
  }
});

// Initialize bot and setup webhook
let bot: Telegraf | null = null;
if (token && token.length > 0) {
  bot = new Telegraf(token);
  
  bot.start((ctx) => {
    console.log(`[BOT] /start command received from user: ${ctx.from?.id} (${ctx.from?.username || ctx.from?.first_name})`);
    console.log(`[BOT] Frontend URL: ${frontendUrl}`);
    console.log(`[BOT] Sending WebApp button with URL: ${frontendUrl}`);
    
    ctx.reply("🚀 Добро пожаловать в Mnemine Mining!\n\nНажмите кнопку ниже, чтобы запустить приложение:", {
      reply_markup: {
        keyboard: [
          [{ text: "🚀 Запустить WebApp", web_app: { url: frontendUrl } }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    }).then(() => {
      console.log(`[BOT] Launch message sent to user: ${ctx.from?.id}`);
    }).catch(err => {
      console.error(`[BOT] Failed to send launch message to user ${ctx.from?.id}:`, err);
    });
  });
  
  bot.command('app', (ctx) => {
    console.log(`[BOT] /app command received from user: ${ctx.from?.id}`);
    ctx.reply("🚀 Запустить приложение:", {
      reply_markup: {
        keyboard: [
          [{ text: "🚀 Запустить WebApp", web_app: { url: frontendUrl } }]
        ],
        resize_keyboard: true,
        one_time_keyboard: false
      }
    }).then(() => {
      console.log(`[BOT] App message sent to user: ${ctx.from?.id}`);
    }).catch(err => {
      console.error(`[BOT] Failed to send app message to user ${ctx.from?.id}:`, err);
    });
  });
  
  bot.action(/webapp/, (ctx) => {
    console.log(`[BOT] WebApp button clicked by user: ${ctx.from?.id}`);
    console.log(`[BOT] Callback data: ${(ctx.callbackQuery as any)?.data}`);
    console.log(`[BOT] Opening WebApp with URL: ${frontendUrl}`);
  });
  
  bot.command('help', (ctx) => {
    console.log(`[BOT] /help command received from user: ${ctx.from?.id}`);
    const helpText = `🤖 *Mnemine Mining Bot*

*Доступные команды:*
/start - Запустить приложение
/app - Быстрый доступ к приложению
/help - Показать эту справку

*Как использовать:*
1. Нажмите /start или /app
2. Нажмите кнопку "🚀 Запустить WebApp"
3. Приложение откроется в Telegram

*Поддержка:*
Если у вас проблемы, попробуйте перезапустить приложение через /start`;

    ctx.reply(helpText, { parse_mode: 'Markdown' }).then(() => {
      console.log(`[BOT] Help message sent to user: ${ctx.from?.id}`);
    }).catch(err => {
      console.error(`[BOT] Failed to send help message to user ${ctx.from?.id}:`, err);
    });
  });
  
  bot.catch((err, ctx) => {
    console.error(`[BOT] Error occurred for user ${ctx.from?.id}:`, err);
  });
  
  logger.telegram("Bot initialized successfully");
} else {
  logger.warn(LogContext.TELEGRAM, "Telegram bot token is not provided. Bot features will be disabled.");
}

// Setup webhook endpoint
if (token && bot) {
  const webhookPath = `/api/webhook`;
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `${backendUrl}${webhookPath}`;
  const webhookDelayMs = parseInt(process.env.WEBHOOK_DELAY_MS || '0', 10);
  
  console.log(`[BOT] Webhook delay configured: ${webhookDelayMs}ms`);
  console.log(`[BOT] Webhook path: ${webhookPath}`);
  console.log(`[BOT] Webhook URL: ${webhookUrl}`);
  
  const manualWebhookHandler = async (req: any, res: any) => {
    try {
      console.log(`[WEBHOOK] Manual handler processing update`);
      console.log(`[WEBHOOK] Bot instance available:`, !!bot);
      console.log(`[WEBHOOK] Bot token:`, token ? `${token.substring(0, 10)}...` : 'Not available');
      
      const update = req.body;
      if (update) {
        console.log(`[WEBHOOK] Processing update ID:`, update.update_id);
        await bot?.handleUpdate(update);
        console.log(`[WEBHOOK] Update processed successfully`);
        res.status(200).json({ ok: true });
      } else {
        console.log(`[WEBHOOK] No update data received`);
        res.status(400).json({ error: 'No update data' });
      }
    } catch (error) {
      console.error(`[WEBHOOK] Manual handler error:`, error);
      console.error(`[WEBHOOK] Error stack:`, error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({ error: 'Update processing failed' });
    }
  };
  
  if (webhookDelayMs > 0) {
    app.use(webhookPath, async (req, res, next) => {
      console.log(`[WEBHOOK] Processing webhook with ${webhookDelayMs}ms delay...`);
      console.log(`[WEBHOOK] Request body:`, JSON.stringify(req.body, null, 2));
      await new Promise(resolve => setTimeout(resolve, webhookDelayMs));
      
      try {
        await manualWebhookHandler(req, res);
      } catch (error) {
        console.error(`[WEBHOOK] Error in webhook handler:`, error);
        res.status(500).json({ error: 'Webhook processing failed' });
      }
    });
  } else {
    app.use(webhookPath, async (req, res, next) => {
      console.log(`[WEBHOOK] Received webhook request`);
      console.log(`[WEBHOOK] Method: ${req.method}`);
      console.log(`[WEBHOOK] Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[WEBHOOK] Body:`, JSON.stringify(req.body, null, 2));
      
      const originalSend = res.send;
      res.send = function(data) {
        console.log(`[WEBHOOK] Response status: ${res.statusCode}`);
        console.log(`[WEBHOOK] Response data:`, data);
        return originalSend.call(this, data);
      };
      
      try {
        await manualWebhookHandler(req, res);
      } catch (error) {
        console.error(`[WEBHOOK] Error in webhook handler:`, error);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Webhook processing failed' });
        }
      }
    });
  }
  
  console.log(`[BOT] Webhook endpoint registered at: ${webhookPath}`);
}

// API routes
app.use('/api', apiRoutes);

// Static file serving
const projectRoot = process.cwd();
console.log(`[SERVER] Current working directory: ${projectRoot}`);

const publicPath = projectRoot.endsWith('/server') || projectRoot.endsWith('\\server') 
  ? path.join(projectRoot, 'public')
  : path.join(projectRoot, 'server/public');
console.log(`[SERVER] Public path: ${publicPath}`);

app.use('/assets', express.static(path.join(publicPath, 'assets'), {
  setHeaders: (res, path) => {
    console.log(`[STATIC] Serving asset: ${path}`);
    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));

app.use('/locales', express.static(path.join(publicPath, 'locales'), {
  setHeaders: (res, path) => {
    console.log(`[STATIC] Serving locale: ${path}`);
  }
}));

app.use('/favicon.ico', express.static(path.join(publicPath, 'favicon.ico')));
app.use('/robots.txt', express.static(path.join(publicPath, 'robots.txt')));
app.use('/placeholder.svg', express.static(path.join(publicPath, 'placeholder.svg')));

// SPA fallback
app.get('*', (req: any, res: any) => {
  console.log(`[SPA] Serving index.html for route: ${req.path}`);
  console.log(`[SPA] User-Agent: ${req.get('User-Agent') || 'Unknown'}`);
  console.log(`[SPA] Origin: ${req.get('Origin') || 'None'}`);
  console.log(`[SPA] Referer: ${req.get('Referer') || 'None'}`);
  
  const indexPath = path.join(publicPath, 'index.html');
  console.log(`[SPA] Index file path: ${indexPath}`);
  
  res.sendFile(indexPath, (err: any) => {
    if (err) {
      console.error(`[SPA] Error serving index.html:`, err);
      res.status(500).send('Error loading application');
    } else {
      console.log(`[SPA] Successfully served index.html`);
    }
  });
});

// Enhanced global error handlers
process.on('uncaughtException', (error) => {
  logger.error(LogContext.SERVER, 'Uncaught Exception', error);
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  } else {
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(LogContext.SERVER, 'Unhandled Rejection', {
    promise: promise.toString(),
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : 'No stack trace',
  });
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

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
  // Booster functionality removed
}

async function ensureDatabaseSchema() {
  try {
    console.log('[SEED] Ensuring database schema is complete...');
    
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

    try {
      await prisma.$executeRaw`ALTER TABLE "LotteryTicket" ADD COLUMN IF NOT EXISTS "isAdminSelected" BOOLEAN NOT NULL DEFAULT false;`;
      console.log('[SEED] LotteryTicket.isAdminSelected column added/verified');
    } catch (columnError) {
      console.warn('[SEED] Could not add isAdminSelected column (may already exist):', columnError);
    }

    const existingRate = await prisma.exchangeRate.findFirst();
    
    if (!existingRate) {
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
          wallets: { create: { currency: 'USD', balance: 0 } },
          miningSlots: {
            create: {
              principal: 1.00,
              startAt: new Date(),
              lastAccruedAt: new Date(),
              effectiveWeeklyRate: SLOT_WEEKLY_RATE,
              expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000),
              isActive: true,
            },
          },
          captchaValidated: true,
          isSuspicious: false,
          lastSuspiciousPenaltyAppliedAt: null,
          lastSeenAt: new Date(),
        },
      });
    } else {
      console.log(`[SEED] Admin user ${ADMIN_TELEGRAM_ID} already exists`);
    }

    if (user.telegramId === ADMIN_TELEGRAM_ID) {
      const wallet = await prisma.wallet.findFirst({
        where: { userId: user.id, currency: 'USD' },
      });

      if (wallet) {
        if (wallet.balance < 50000) {
          await prisma.wallet.update({
            where: { id: wallet.id },
            data: { balance: 50000 },
          });
          console.log(`[SEED] Updated admin balance to 50000 USD`);
        }
      } else {
        await prisma.wallet.create({
          data: {
            userId: user.id,
            currency: 'USD',
            balance: 50000,
          },
        });
        console.log(`[SEED] Created admin wallet with 50000 USD`);
      }
    }
  } catch (error) {
    console.error('[DB] CRITICAL: Failed to ensure admin user exists:', error);
  }
}

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.server(`Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.server('HTTP server closed');
    
    try {
      await prisma.$disconnect();
      logger.database('Database connection closed');
      process.exit(0);
    } catch (error) {
      logger.error(LogContext.SERVER, 'Error during shutdown', error);
      process.exit(1);
    }
  });
  
  setTimeout(() => {
    logger.error(LogContext.SERVER, 'Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

async function startServer() {
  try {
    console.log('[SERVER] Testing database connection...');
    const dbConnectionPromise = prisma.$connect();
    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );
    
    await Promise.race([dbConnectionPromise, dbTimeoutPromise]);
    logger.database('Database connection successful');

    server.listen(port, '0.0.0.0', async () => {
      logger.server(`Backend server listening on port ${port}`);
      logger.websocket(`WebSocket server available at ws://localhost:${port}/ws`);
      logger.server(`Frontend URL for bot: ${frontendUrl}`);
      
      ProductionHealthCheck.markAsHealthy();
      
      try {
        const wsServer = new WebSocketServer(server);
        webSocketManager.setWebSocketServer(wsServer);
        logger.websocket('WebSocket server initialized');
      } catch (wsError) {
        logger.error(LogContext.WEBSOCKET, 'Failed to initialize WebSocket server', wsError);
      }

      if (bot && token && token.length > 0) {
        const webhookPath = `/api/webhook/${token}`;
        const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `${backendUrl}${webhookPath}`;

        console.log(`[BOT] Webhook configuration:`);
        console.log(`[BOT] - Webhook path: ${webhookPath}`);
        console.log(`[BOT] - Backend URL: ${backendUrl}`);
        console.log(`[BOT] - Webhook URL: ${webhookUrl}`);
        console.log(`[BOT] - Is HTTPS: ${webhookUrl.startsWith('https://')}`);

        if (webhookUrl.startsWith('https://')) {
          console.log(`[BOT] Setting webhook to: ${webhookUrl}`);
          
          bot.telegram.setWebhook(webhookUrl)
            .then(() => console.log(`[BOT] ✅ Webhook successfully set to ${webhookUrl}`))
            .catch((err: any) => console.error('[BOT] ❌ Failed to set webhook:', err));
        } else {
          console.warn('[BOT] Webhook not set: Backend URL is not HTTPS. Bot will only respond to direct messages in development.');
        }
      }
      
      try {
        const { continuousEarningsProcessor } = await import('./utils/continuousEarningsProcessor.js');
        await continuousEarningsProcessor.start();
        logger.business('Continuous earnings processor started');
      } catch (error) {
        logger.error(LogContext.BUSINESS, 'Failed to start continuous earnings processor', error);
      }
      
      try {
        const { slotExpirationProcessor } = await import('./utils/slotExpirationProcessor.js');
        await slotExpirationProcessor.start();
        logger.business('Slot expiration processor started');
      } catch (error) {
        logger.error(LogContext.BUSINESS, 'Failed to start slot expiration processor', error);
      }
      
      try {
        const { autoClaimProcessor } = await import('./utils/autoClaimProcessor.js');
        await autoClaimProcessor.start();
        logger.business('Auto-claim processor started');
      } catch (error) {
        logger.error(LogContext.BUSINESS, 'Failed to start auto-claim processor', error);
      }

      try {
        const { earningsAccumulator } = await import('./services/earningsAccumulator.js');
        earningsAccumulator.start();
        logger.business('Earnings accumulator started');
      } catch (error) {
        logger.error(LogContext.BUSINESS, 'Failed to start earnings accumulator', error);
      }
    });

    Promise.all([seedTasks(), seedBoosters(), seedAdmin(), ensureDatabaseSchema()])
      .then(() => {
        logger.database('Database seeding completed');
      })
      .catch((error) => {
        logger.error(LogContext.DATABASE, 'Database seeding failed', error);
      });

  } catch (error) {
    logger.error(LogContext.SERVER, 'Failed to start server', error);
    process.exit(1);
  }
}

startServer();

export default app;