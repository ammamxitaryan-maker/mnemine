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
  // In production, only load from process.env (Render sets these)
  logger.server('Production mode - using process.env variables');
} else {
  // Development mode - try multiple paths for flexibility
  const envPaths = [
    path.resolve(__dirname, '../../../.env.local'),  // Local development .env
    path.resolve(__dirname, '../../../.env'),        // Root .env (development mode)
    path.resolve(__dirname, '../../.env'),           // Server .env (fallback)
    path.resolve(process.cwd(), '.env.local'),       // Current working directory local
    path.resolve(process.cwd(), '.env'),             // Current working directory
    path.resolve(process.cwd(), '../.env'),          // Parent directory
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
  
  // Also load from process.env (for development)
  dotenv.config();
}

// Set fallback values for environment variables BEFORE validation
// SECURITY WARNING: In production, these MUST be set via environment variables
if (!process.env.DATABASE_URL) {
  if (process.env.NODE_ENV === 'production') {
    logger.error(LogContext.SERVER, 'CRITICAL: DATABASE_URL not set in production!');
    throw new Error('DATABASE_URL must be set in production environment');
  }
  // Development fallback only
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
// import cors from 'cors'; // Removed for static file serving
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
import './utils/slotProcessor.js'; // Запускаем процессор слотов

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
// For Telegram WebApp, we use the same URL as backend since the frontend is served from there
const frontendUrl = process.env.FRONTEND_URL || backendUrl;
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
  // Allow iframe embedding for Telegram WebApp
  res.removeHeader("X-Frame-Options");
  res.setHeader("X-Frame-Options", "ALLOWALL");
  res.setHeader("Content-Security-Policy", "frame-ancestors https://web.telegram.org https://telegram.org");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// Security middleware removed

// Telegram WebApp middleware removed for unrestricted access

// Compression middleware
app.use(compression());

// Monitoring and logging middleware removed
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Production-ready rate limiting configuration - DISABLED
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute window
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '10000', 10), // Very high limit to effectively disable
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for all requests - effectively disabled
    return true;
  },
  keyGenerator: (req) => {
    // Use IP address + user agent for more granular rate limiting
    return `${req.ip}-${req.get('User-Agent')?.slice(0, 50) || 'unknown'}`;
  }
});
// app.use('/api', limiter); // Commented out to disable rate limiting

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

// CORS middleware removed to allow static file serving
// const corsOptions = {
//   origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
//     // Allow requests with no origin (like mobile apps or curl requests)
//     if (!origin) return callback(null, true);
//     
//     // Allow local development origins
//     const allowedOrigins = [
//       'http://localhost:5173',
//       'http://127.0.0.1:5173',
//       'http://localhost:3000',
//       'http://127.0.0.1:3000',
//       frontendUrl,
//       backendUrl
//     ];
//     
//     // Allow all origins in development mode
//     if (process.env.NODE_ENV === 'development' || process.env.LOCAL_DEV_MODE === 'true') {
//       return callback(null, true);
//     }
//     
//     // In production, check against allowed origins
//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }
//     
//     // For Telegram WebApp, allow Telegram domains
//     if (origin.includes('telegram.org') || origin.includes('web.telegram.org')) {
//       return callback(null, true);
//     }
//     
//     callback(new Error('Not allowed by CORS'));
//   },
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//   preflightContinue: false,
//   optionsSuccessStatus: 204,
//   credentials: true,
// };
// app.use(cors(corsOptions));

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const origin = req.headers.origin;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const referer = req.get('Referer') || 'None';
  
  // Log all requests with detailed information
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
  
  // Simplified CORS handling - Allow all origins for development
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
    
    // Log errors
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

// Production health check endpoint
app.get('/health', async (req: any, res: any) => {
  try {
    // Check database connection with timeout
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

// Initialize bot and setup webhook BEFORE API routes and rate limiting
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
  
  // Add /app command for quick access
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
  
  // Add callback query handler for WebApp button
  bot.action(/webapp/, (ctx) => {
    console.log(`[BOT] WebApp button clicked by user: ${ctx.from?.id}`);
    console.log(`[BOT] Callback data: ${(ctx.callbackQuery as any)?.data}`);
    console.log(`[BOT] Opening WebApp with URL: ${frontendUrl}`);
  });
  
  // Add /help command
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
  
  // Add error handling for bot
  bot.catch((err, ctx) => {
    console.error(`[BOT] Error occurred for user ${ctx.from?.id}:`, err);
  });
  
  logger.telegram("Bot initialized successfully");
} else {
  logger.warn(LogContext.TELEGRAM, "Telegram bot token is not provided. Bot features will be disabled.");
}

// Setup webhook endpoint BEFORE API routes to ensure it takes precedence
if (token && bot) {
  const webhookPath = `/api/webhook`;
  const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `${backendUrl}${webhookPath}`;
  const webhookDelayMs = parseInt(process.env.WEBHOOK_DELAY_MS || '0', 10);
  
  console.log(`[BOT] Webhook delay configured: ${webhookDelayMs}ms`);
  console.log(`[BOT] Webhook path: ${webhookPath}`);
  console.log(`[BOT] Webhook URL: ${webhookUrl}`);
  
  // Create webhook callback - use the standard /api/webhook path
  const webhookCallback = bot.webhookCallback(`/api/webhook`);
  
  // Alternative manual webhook handler for debugging
  const manualWebhookHandler = async (req: any, res: any) => {
    try {
      console.log(`[WEBHOOK] Manual handler processing update`);
      console.log(`[WEBHOOK] Bot instance available:`, !!bot);
      console.log(`[WEBHOOK] Bot token:`, token ? `${token.substring(0, 10)}...` : 'Not available');
      
      // Process the update directly with the bot
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
    // Wrap webhook callback with delay
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
    // Wrap webhook callback with logging and error handling
    app.use(webhookPath, async (req, res, next) => {
      console.log(`[WEBHOOK] Received webhook request`);
      console.log(`[WEBHOOK] Method: ${req.method}`);
      console.log(`[WEBHOOK] Headers:`, JSON.stringify(req.headers, null, 2));
      console.log(`[WEBHOOK] Body:`, JSON.stringify(req.body, null, 2));
      
      // Add response logging
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

// Telegram WebApp middleware removed

// API routes - MUST be before static files for proper SPA routing
app.use('/api', apiRoutes);

// Static file serving with detailed logging - AFTER API routes
// Use process.cwd() to get the project root directory
const projectRoot = process.cwd();
console.log(`[SERVER] Current working directory: ${projectRoot}`);
// Check if we're in the server directory or root directory
const publicPath = projectRoot.endsWith('/server') || projectRoot.endsWith('\\server') 
  ? path.join(projectRoot, 'public')  // We're in server directory
  : path.join(projectRoot, 'server/public');  // We're in root directory
console.log(`[SERVER] Public path: ${publicPath}`);

app.use('/assets', express.static(path.join(publicPath, 'assets'), {
  setHeaders: (res, path) => {
    console.log(`[STATIC] Serving asset: ${path}`);
    // Set cache headers for assets
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
}));

app.use('/locales', express.static(path.join(publicPath, 'locales'), {
  setHeaders: (res, path) => {
    console.log(`[STATIC] Serving locale: ${path}`);
  }
}));

// Serve other static files (favicon, robots.txt, etc.) - but only for specific files
app.use('/favicon.ico', express.static(path.join(publicPath, 'favicon.ico')));
app.use('/robots.txt', express.static(path.join(publicPath, 'robots.txt')));
app.use('/placeholder.svg', express.static(path.join(publicPath, 'placeholder.svg')));

// Error handling middleware removed

// SPA fallback - serve index.html for all non-API routes (GET only to avoid interfering with webhooks)
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


// Enhanced global error handlers with better logging
process.on('uncaughtException', (error) => {
  logger.error(LogContext.SERVER, 'Uncaught Exception', error);
  // Don't exit immediately in production, allow graceful shutdown
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
  // Don't exit immediately in production, allow graceful shutdown
  if (process.env.NODE_ENV === 'production') {
    gracefulShutdown('UNHANDLED_REJECTION');
  } else {
    process.exit(1);
  }
});

// Handle SIGTERM and SIGINT for graceful shutdown
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
          wallets: { create: { currency: 'USD', balance: 0 } }, // Changed currency to USD
          miningSlots: {
            create: {
              principal: 1.00,
              startAt: new Date(),
              lastAccruedAt: new Date(),
              effectiveWeeklyRate: SLOT_WEEKLY_RATE, // Use new constant
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
      // Admin already exists, just ensure they have proper balance
      console.log(`[SEED] Admin user ${ADMIN_TELEGRAM_ID} already exists`);
    }

    // Only set admin balance for the specific admin user
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
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error(LogContext.SERVER, 'Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

// Shutdown handlers are registered above

async function startServer() {
  try {
    // Test database connection with timeout
    console.log('[SERVER] Testing database connection...');
    const dbConnectionPromise = prisma.$connect();
    const dbTimeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 10000)
    );
    
    await Promise.race([dbConnectionPromise, dbTimeoutPromise]);
    logger.database('Database connection successful');

    // Start server first to avoid hanging
    server.listen(port, '0.0.0.0', async () => {
      logger.server(`Backend server listening on port ${port}`);
      logger.websocket(`WebSocket server available at ws://localhost:${port}/ws`);
      logger.server(`Frontend URL for bot: ${frontendUrl}`);
      
      // Mark application as healthy
      ProductionHealthCheck.markAsHealthy();
      
      // Initialize WebSocket server after server is running
      try {
        const wsServer = new WebSocketServer(server);
        webSocketManager.setWebSocketServer(wsServer);
        logger.websocket('WebSocket server initialized');
      } catch (wsError) {
        logger.error(LogContext.WEBSOCKET, 'Failed to initialize WebSocket server', wsError);
      }

      // Set Telegram webhook URL if bot is initialized (non-blocking)
      if (bot && token && token.length > 0) {
        const webhookPath = `/api/webhook/${token}`;
        const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || `${backendUrl}${webhookPath}`;

        console.log(`[BOT] Webhook configuration:`);
        console.log(`[BOT] - Webhook path: ${webhookPath}`);
        console.log(`[BOT] - Backend URL: ${backendUrl}`);
        console.log(`[BOT] - Webhook URL: ${webhookUrl}`);
        console.log(`[BOT] - Is HTTPS: ${webhookUrl.startsWith('https://')}`);

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
      
      // Start background processors (non-blocking)
      try {
        // Start continuous earnings processor for 24/7 earnings
        const { continuousEarningsProcessor } = await import('./utils/continuousEarningsProcessor.js');
        await continuousEarningsProcessor.start();
        logger.business('Continuous earnings processor started');
      } catch (error) {
        logger.error(LogContext.BUSINESS, 'Failed to start continuous earnings processor', error);
      }
      
      try {
        // Start slot expiration processor for automatic slot handling
        const { slotExpirationProcessor } = await import('./utils/slotExpirationProcessor.js');
        await slotExpirationProcessor.start();
        logger.business('Slot expiration processor started');
      } catch (error) {
        logger.error(LogContext.BUSINESS, 'Failed to start slot expiration processor', error);
      }
      
      try {
        // Start auto-claim processor for automatic MNE transfers after 7 days
        const { autoClaimProcessor } = await import('./utils/autoClaimProcessor.js');
        await autoClaimProcessor.start();
        logger.business('Auto-claim processor started');
      } catch (error) {
        logger.error(LogContext.BUSINESS, 'Failed to start auto-claim processor', error);
      }

      try {
        // Start earnings accumulator for real-time earnings updates
        const { earningsAccumulator } = await import('./services/earningsAccumulator.js');
        earningsAccumulator.start();
        logger.business('Earnings accumulator started');
      } catch (error) {
        logger.error(LogContext.BUSINESS, 'Failed to start earnings accumulator', error);
      }
    });

    // Run database seeding in background (non-blocking)
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

// Export the app for testing
export default app;
