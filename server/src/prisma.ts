import { PrismaClient } from '@prisma/client';

// Debug logging for DATABASE_URL
console.log('[PRISMA] DATABASE_URL from env:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
if (process.env.DATABASE_URL) {
  console.log('[PRISMA] DATABASE_URL host:', process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'UNKNOWN');
}

// Ensure DATABASE_URL is set before creating PrismaClient
if (!process.env.DATABASE_URL) {
  console.log('[PRISMA] Using fallback DATABASE_URL');
  process.env.DATABASE_URL = 'postgresql://fastmine_user:tpormjFKIYZmslVCDDkMkTBlkVFdvRJI@dpg-d3mqjku3jp1c73d0ec5g-a.ohio-postgres.render.com/fastmine';
} else {
  console.log('[PRISMA] Using environment DATABASE_URL');
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