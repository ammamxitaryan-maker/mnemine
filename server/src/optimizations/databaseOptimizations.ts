import prisma from '../prisma.js';

// Database connection pool optimization
export const optimizeDatabaseConnection = () => {
  // Increase connection pool size for better performance
  const connectionPoolSize = process.env.NODE_ENV === 'production' ? 20 : 10;
  
  console.log(`[DB] Optimizing database connection pool: ${connectionPoolSize} connections`);
  
  return {
    connectionLimit: connectionPoolSize,
    acquireTimeoutMillis: 60000,
    timeout: 60000,
    idleTimeoutMillis: 30000,
    max: connectionPoolSize,
    min: 2
  };
};

// Query optimization utilities
export class DatabaseOptimizer {
  // Batch operations for better performance
  static async batchUpdateSlots(slotUpdates: Array<{ id: string; lastAccruedAt: Date }>) {
    const startTime = performance.now();
    
    try {
      // Process in batches of 100 to avoid memory issues
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < slotUpdates.length; i += batchSize) {
        batches.push(slotUpdates.slice(i, i + batchSize));
      }
      
      const results = await Promise.all(
        batches.map(batch => 
          prisma.$transaction(
            batch.map(update => 
              prisma.miningSlot.update({
                where: { id: update.id },
                data: { lastAccruedAt: update.lastAccruedAt }
              })
            )
          )
        )
      );
      
      const totalTime = performance.now() - startTime;
      console.log(`[DB] Batch updated ${slotUpdates.length} slots in ${totalTime.toFixed(2)}ms`);
      
      return results.flat();
    } catch (error) {
      console.error('[DB] Batch update failed:', error);
      throw error;
    }
  }

  // Optimized user data fetch with minimal queries
  static async getUserDataOptimized(telegramId: string) {
    const startTime = performance.now();
    
    try {
      // Single query to get all user data
      const user = await prisma.user.findUnique({
        where: { telegramId },
        select: {
          id: true,
          telegramId: true,
          firstName: true,
          totalInvested: true,
          rank: true,
          wallets: {
            select: {
              currency: true,
              balance: true
            }
          },
          miningSlots: {
            where: { isActive: true },
            select: {
              id: true,
              principal: true,
              effectiveWeeklyRate: true,
              lastAccruedAt: true,
              expiresAt: true,
              isActive: true
            }
          },
          _count: {
            select: { referrals: true }
          }
        }
      });

      const totalTime = performance.now() - startTime;
      console.log(`[DB] User data fetched in ${totalTime.toFixed(2)}ms`);
      
      return user;
    } catch (error) {
      console.error('[DB] User data fetch failed:', error);
      throw error;
    }
  }

  // Optimized earnings calculation
  static calculateEarningsOptimized(slots: any[]) {
    const startTime = performance.now();
    const currentTime = new Date();
    let totalEarnings = 0;

    for (const slot of slots) {
      if (slot.isActive && new Date(slot.expiresAt) > currentTime) {
        const timeElapsedMs = currentTime.getTime() - slot.lastAccruedAt.getTime();
        if (timeElapsedMs > 0) {
          const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
          const earnings = earningsPerSecond * (timeElapsedMs / 1000);
          totalEarnings += earnings;
        }
      }
    }

    const totalTime = performance.now() - startTime;
    console.log(`[DB] Earnings calculated in ${totalTime.toFixed(2)}ms`);
    
    return totalEarnings;
  }
}

// Index optimization recommendations
export const getIndexRecommendations = () => {
  return [
    'CREATE INDEX IF NOT EXISTS idx_mining_slots_active_expires ON "MiningSlot" ("isActive", "expiresAt") WHERE "isActive" = true;',
    'CREATE INDEX IF NOT EXISTS idx_mining_slots_user_active ON "MiningSlot" ("userId", "isActive") WHERE "isActive" = true;',
    'CREATE INDEX IF NOT EXISTS idx_users_telegram_id ON "User" ("telegramId");',
    'CREATE INDEX IF NOT EXISTS idx_wallets_user_currency ON "Wallet" ("userId", "currency");',
    'CREATE INDEX IF NOT EXISTS idx_activity_logs_user_created ON "ActivityLog" ("userId", "createdAt");',
    'CREATE INDEX IF NOT EXISTS idx_referrals_referred_by ON "User" ("referredById");'
  ];
};

// Performance monitoring for database operations
export class DatabasePerformanceMonitor {
  private static metrics: Map<string, number[]> = new Map();

  static recordQuery(operation: string, duration: number) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const metrics = this.metrics.get(operation)!;
    metrics.push(duration);
    
    // Keep only last 100 measurements
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  static getAverageTime(operation: string): number {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) return 0;
    
    return metrics.reduce((sum, time) => sum + time, 0) / metrics.length;
  }

  static getSlowQueries(threshold: number = 1000): Array<{ operation: string; avgTime: number }> {
    const slowQueries: Array<{ operation: string; avgTime: number }> = [];
    
    for (const [operation] of this.metrics.entries()) {
      const avgTime = this.getAverageTime(operation);
      if (avgTime > threshold) {
        slowQueries.push({ operation, avgTime });
      }
    }
    
    return slowQueries.sort((a, b) => b.avgTime - a.avgTime);
  }

  static getPerformanceReport() {
    const report = {
      totalOperations: this.metrics.size,
      slowQueries: this.getSlowQueries(),
      recommendations: []
    };

    // Add recommendations based on slow queries
    if (report.slowQueries.length > 0) {
      (report.recommendations as string[]).push('Consider adding database indexes for slow queries');
      (report.recommendations as string[]).push('Review query patterns and optimize N+1 queries');
    }

    return report;
  }
}
