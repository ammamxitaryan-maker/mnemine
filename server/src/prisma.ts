import { PrismaClient } from '@prisma/client';

// Ensure DATABASE_URL is set before creating PrismaClient
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://mnemine_user:2DpMhmihzMUXfaVlksxOaWvYvNlB2YtL@dpg-d38dq93e5dus73a34u3g-a.oregon-postgres.render.com/mnemine_zupy';
}

const prisma = new PrismaClient({
  // Production-optimized connection settings
  transactionOptions: {
    maxWait: process.env.NODE_ENV === 'production' ? 10000 : 20000, // Shorter timeout in production
    timeout: process.env.NODE_ENV === 'production' ? 10000 : 20000, // Shorter timeout in production
  },
  // Production optimizations - minimal logging
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  // Connection pool optimization for production
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.NODE_ENV === 'production' ? '?connection_limit=5&pool_timeout=20' : ''),
    },
  },
});

export default prisma;