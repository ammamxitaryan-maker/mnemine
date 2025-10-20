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
    USER_DATA: 30000, // 30 seconds
    BALANCE: 5000, // 5 seconds
    ADMIN_DATA: 180000, // 3 minutes
    SLOTS: 5000, // 5 seconds
    LOTTERY: 300000, // 5 minutes
    REFERRALS: 300000, // 5 minutes
    EARNINGS: 3000, // 3 seconds
    LEADERBOARD: 300000, // 5 minutes
  },

  // Stale time (in milliseconds)
  STALE_TIME: {
    USER_DATA: 15000, // 15 seconds
    BALANCE: 0, // Always fresh
    ADMIN_DATA: 120000, // 2 minutes
    SLOTS: 0, // Always fresh
    LOTTERY: 180000, // 3 minutes
    REFERRALS: 180000, // 3 minutes
    EARNINGS: 0, // Always fresh
    LEADERBOARD: 180000, // 3 minutes
  },
} as const;
