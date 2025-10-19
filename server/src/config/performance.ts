/**
 * Performance Configuration
 * Centralized configuration for performance optimizations
 */

export const PERFORMANCE_CONFIG = {
  // Database optimization
  DATABASE: {
    CONNECTION_LIMIT: 10,
    POOL_TIMEOUT: 20000,
    QUERY_TIMEOUT: 30000,
    BATCH_SIZE: 100,
  },

  // Caching configuration
  CACHE: {
    DEFAULT_TTL: 300, // 5 minutes
    USER_DATA_TTL: 120, // 2 minutes
    ADMIN_DATA_TTL: 180, // 3 minutes
    STATS_TTL: 300, // 5 minutes
  },

  // Rate limiting
  RATE_LIMIT: {
    WINDOW_MS: 900000, // 15 minutes
    MAX_REQUESTS: 100,
    AUTH_MAX_REQUESTS: 10,
  },

  // WebSocket optimization
  WEBSOCKET: {
    HEARTBEAT_INTERVAL: 30000, // 30 seconds
    RECONNECT_DELAY: 5000, // 5 seconds
    MAX_RECONNECT_ATTEMPTS: 5,
  },

  // Memory management
  MEMORY: {
    MAX_HEAP_SIZE: 512, // MB
    GC_INTERVAL: 60000, // 1 minute
    WARNING_THRESHOLD: 0.8, // 80% of max heap
  },
} as const;

export const QUERY_OPTIMIZATION = {
  // Refetch intervals (in milliseconds)
  REFETCH_INTERVALS: {
    USER_DATA: 300000, // 5 minutes
    BALANCE: 180000, // 3 minutes
    ADMIN_DATA: 180000, // 3 minutes
    SLOTS: 240000, // 4 minutes
    LOTTERY: 300000, // 5 minutes
    REFERRALS: 300000, // 5 minutes
    EARNINGS: 180000, // 3 minutes
    LEADERBOARD: 300000, // 5 minutes
  },

  // Stale time (in milliseconds)
  STALE_TIME: {
    USER_DATA: 120000, // 2 minutes
    BALANCE: 60000, // 1 minute
    ADMIN_DATA: 120000, // 2 minutes
    SLOTS: 120000, // 2 minutes
    LOTTERY: 180000, // 3 minutes
    REFERRALS: 180000, // 3 minutes
    EARNINGS: 60000, // 1 minute
    LEADERBOARD: 180000, // 3 minutes
  },
} as const;
