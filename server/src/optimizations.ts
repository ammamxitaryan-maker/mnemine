// Server optimizations for production
export const serverOptimizations = {
  // Memory management
  memoryLimit: process.env.NODE_OPTIONS?.includes('--max-old-space-size') 
    ? parseInt(process.env.NODE_OPTIONS.split('--max-old-space-size=')[1]) 
    : 4096,

  // Database connection pooling
  databasePool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },

  // Caching settings
  cache: {
    staticFiles: 31536000, // 1 year
    apiResponses: 300, // 5 minutes
    userData: 60, // 1 minute
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Compression
  compression: {
    level: 6,
    threshold: 1024,
  },

  // Security headers
  security: {
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    csp: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  },
};

export default serverOptimizations;
