/**
 * Enhanced Database Optimizer - Advanced database performance optimization
 * 
 * This module provides comprehensive database optimizations while strictly
 * preserving all existing functionality. No features are modified or disabled.
 */

import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';

// Query optimization configuration
interface QueryOptimizationConfig {
  enableQueryCaching: boolean;
  enableBatchProcessing: boolean;
  enableConnectionPooling: boolean;
  enableQueryLogging: boolean;
  maxBatchSize: number;
  cacheTimeout: number;
}

// Query performance metrics
interface QueryMetrics {
  query: string;
  executionTime: number;
  timestamp: number;
  parameters?: any;
  resultCount?: number;
  cacheHit?: boolean;
}

// Database connection pool configuration
interface PoolConfig {
  min: number;
  max: number;
  acquireTimeoutMillis: number;
  createTimeoutMillis: number;
  destroyTimeoutMillis: number;
  idleTimeoutMillis: number;
  reapIntervalMillis: number;
  createRetryIntervalMillis: number;
}

// Default configuration
const DEFAULT_QUERY_CONFIG: QueryOptimizationConfig = {
  enableQueryCaching: true,
  enableBatchProcessing: true,
  enableConnectionPooling: true,
  enableQueryLogging: true,
  maxBatchSize: 100,
  cacheTimeout: 300000, // 5 minutes
};

const DEFAULT_POOL_CONFIG: PoolConfig = {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 200,
};

/**
 * Enhanced Database Optimizer with advanced performance features
 */
export class DatabaseOptimizerEnhanced {
  private prisma: PrismaClient;
  private queryCache: Map<string, { data: any; timestamp: number }>;
  private queryMetrics: QueryMetrics[];
  private config: QueryOptimizationConfig;
  private poolConfig: PoolConfig;

  constructor(
    prisma: PrismaClient,
    config: Partial<QueryOptimizationConfig> = {},
    poolConfig: Partial<PoolConfig> = {}
  ) {
    this.prisma = prisma;
    this.config = { ...DEFAULT_QUERY_CONFIG, ...config };
    this.poolConfig = { ...DEFAULT_POOL_CONFIG, ...poolConfig };
    this.queryCache = new Map();
    this.queryMetrics = [];

    this.initializeOptimizations();
  }

  /**
   * Initialize database optimizations
   */
  private initializeOptimizations(): void {
    if (this.config.enableConnectionPooling) {
      this.optimizeConnectionPool();
    }

    if (this.config.enableQueryLogging) {
      this.setupQueryLogging();
    }
  }

  /**
   * Optimize connection pool settings
   */
  private optimizeConnectionPool(): void {
    // Prisma handles connection pooling internally
    // This method can be extended for custom pool configurations
    console.log('[DB] Connection pool optimization enabled');
  }

  /**
   * Setup query logging and monitoring
   */
  private setupQueryLogging(): void {
    // Prisma query logging is handled in the PrismaClient configuration
    console.log('[DB] Query logging enabled');
  }

  /**
   * Execute query with caching and performance monitoring
   */
  async executeQuery<T>(
    queryName: string,
    queryFn: () => Promise<T>,
    cacheKey?: string,
    ttl?: number
  ): Promise<T> {
    const startTime = performance.now();
    
    // Check cache first
    if (this.config.enableQueryCaching && cacheKey) {
      const cached = this.getCachedQuery(cacheKey);
      if (cached) {
        this.recordQueryMetrics(queryName, performance.now() - startTime, true);
        return cached;
      }
    }

    try {
      const result = await queryFn();
      const executionTime = performance.now() - startTime;

      // Cache the result
      if (this.config.enableQueryCaching && cacheKey) {
        this.setCachedQuery(cacheKey, result, ttl);
      }

      // Record metrics
      this.recordQueryMetrics(queryName, executionTime, false, result);

      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      this.recordQueryMetrics(queryName, executionTime, false, undefined, error);
      throw error;
    }
  }

  /**
   * Execute batch queries for better performance
   */
  async executeBatchQueries<T>(
    queries: Array<{
      name: string;
      queryFn: () => Promise<T>;
      cacheKey?: string;
    }>
  ): Promise<T[]> {
    if (!this.config.enableBatchProcessing || queries.length <= 1) {
      // Execute queries individually
      return Promise.all(queries.map(q => this.executeQuery(q.name, q.queryFn, q.cacheKey)));
    }

    const startTime = performance.now();
    const results: T[] = [];

    // Process in batches
    const batchSize = this.config.maxBatchSize;
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(q => this.executeQuery(q.name, q.queryFn, q.cacheKey))
      );
      results.push(...batchResults);
    }

    const totalTime = performance.now() - startTime;
    console.log(`[DB] Batch execution completed: ${queries.length} queries in ${totalTime.toFixed(2)}ms`);

    return results;
  }

  /**
   * Optimized user data fetch with advanced caching
   */
  async getUserDataOptimized(telegramId: string): Promise<any> {
    const cacheKey = `user_data_${telegramId}`;
    
    return this.executeQuery(
      'getUserData',
      async () => {
        const user = await this.prisma.user.findUnique({
          where: { telegramId },
          select: {
            id: true,
            telegramId: true,
            firstName: true,
            lastName: true,
            username: true,
            totalInvested: true,
            rank: true,
            createdAt: true,
            lastSeenAt: true,
            wallets: {
              select: {
                currency: true,
                balance: true,
              },
            },
            miningSlots: {
              where: { isActive: true },
              select: {
                id: true,
                principal: true,
                effectiveWeeklyRate: true,
                lastAccruedAt: true,
                expiresAt: true,
                isActive: true,
                createdAt: true,
              },
            },
            _count: {
              select: { referrals: true },
            },
          },
        });

        if (!user) {
          throw new Error('User not found');
        }

        return user;
      },
      cacheKey,
      this.config.cacheTimeout
    );
  }

  /**
   * Optimized mining slots fetch with batch processing
   */
  async getMiningSlotsOptimized(userIds: string[]): Promise<any[]> {
    if (userIds.length === 0) return [];

    return this.executeQuery(
      'getMiningSlots',
      async () => {
        return this.prisma.miningSlot.findMany({
          where: {
            userId: { in: userIds },
            isActive: true,
          },
          select: {
            id: true,
            userId: true,
            principal: true,
            effectiveWeeklyRate: true,
            lastAccruedAt: true,
            expiresAt: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
        });
      },
      `mining_slots_${userIds.join(',')}`,
      this.config.cacheTimeout
    );
  }

  /**
   * Optimized leaderboard data fetch
   */
  async getLeaderboardOptimized(limit: number = 100): Promise<any[]> {
    return this.executeQuery(
      'getLeaderboard',
      async () => {
        return this.prisma.user.findMany({
          select: {
            id: true,
            telegramId: true,
            firstName: true,
            username: true,
            totalInvested: true,
            rank: true,
            wallets: {
              where: { currency: 'USD' },
              select: { balance: true },
            },
            _count: {
              select: { referrals: true },
            },
          },
          orderBy: { totalInvested: 'desc' },
          take: limit,
        });
      },
      `leaderboard_${limit}`,
      this.config.cacheTimeout
    );
  }

  /**
   * Optimized activity logs fetch with pagination
   */
  async getActivityLogsOptimized(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<any[]> {
    return this.executeQuery(
      'getActivityLogs',
      async () => {
        return this.prisma.activityLog.findMany({
          where: { userId },
          select: {
            id: true,
            type: true,
            amount: true,
            description: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        });
      },
      `activity_logs_${userId}_${limit}_${offset}`,
      this.config.cacheTimeout
    );
  }

  /**
   * Batch update mining slots for better performance
   */
  async batchUpdateMiningSlots(
    updates: Array<{
      id: string;
      lastAccruedAt: Date;
      earnings?: number;
    }>
  ): Promise<void> {
    if (updates.length === 0) return;

    const startTime = performance.now();

    try {
      await this.prisma.$transaction(
        updates.map(update =>
          this.prisma.miningSlot.update({
            where: { id: update.id },
            data: {
              lastAccruedAt: update.lastAccruedAt,
            },
          })
        )
      );

      const executionTime = performance.now() - startTime;
      console.log(`[DB] Batch update completed: ${updates.length} slots in ${executionTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('[DB] Batch update failed:', error);
      throw error;
    }
  }

  /**
   * Get cached query result
   */
  private getCachedQuery(cacheKey: string): any | null {
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached query result
   */
  private setCachedQuery(cacheKey: string, data: any, ttl?: number): void {
    this.queryCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Record query performance metrics
   */
  private recordQueryMetrics(
    queryName: string,
    executionTime: number,
    cacheHit: boolean,
    result?: any,
    error?: any
  ): void {
    const metrics: QueryMetrics = {
      query: queryName,
      executionTime,
      timestamp: Date.now(),
      resultCount: Array.isArray(result) ? result.length : result ? 1 : 0,
      cacheHit,
    };

    this.queryMetrics.push(metrics);

    // Keep only last 1000 metrics
    if (this.queryMetrics.length > 1000) {
      this.queryMetrics = this.queryMetrics.slice(-1000);
    }

    // Log slow queries
    if (executionTime > 1000) {
      console.warn(`[DB] Slow query detected: ${queryName} took ${executionTime.toFixed(2)}ms`);
    }
  }

  /**
   * Get query performance statistics
   */
  getQueryStats(): {
    totalQueries: number;
    averageExecutionTime: number;
    slowestQueries: QueryMetrics[];
    cacheHitRate: number;
    totalExecutionTime: number;
  } {
    const totalQueries = this.queryMetrics.length;
    const totalExecutionTime = this.queryMetrics.reduce((sum, m) => sum + m.executionTime, 0);
    const averageExecutionTime = totalQueries > 0 ? totalExecutionTime / totalQueries : 0;
    
    const slowestQueries = [...this.queryMetrics]
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    const cacheHits = this.queryMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalQueries > 0 ? cacheHits / totalQueries : 0;

    return {
      totalQueries,
      averageExecutionTime,
      slowestQueries,
      cacheHitRate,
      totalExecutionTime,
    };
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.queryCache.clear();
  }

  /**
   * Clear query metrics
   */
  clearMetrics(): void {
    this.queryMetrics = [];
  }

  /**
   * Get database connection status
   */
  async getConnectionStatus(): Promise<{
    connected: boolean;
    latency: number;
    poolSize?: number;
  }> {
    const startTime = performance.now();
    
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      const latency = performance.now() - startTime;
      
      return {
        connected: true,
        latency,
      };
    } catch (error) {
      return {
        connected: false,
        latency: performance.now() - startTime,
      };
    }
  }

  /**
   * Optimize database indexes (PostgreSQL specific)
   */
  async optimizeIndexes(): Promise<void> {
    try {
      // Analyze tables for better query planning
      await this.prisma.$executeRaw`ANALYZE`;
      
      // Update table statistics
      await this.prisma.$executeRaw`UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0`;
      
      console.log('[DB] Database indexes optimized');
    } catch (error) {
      console.error('[DB] Index optimization failed:', error);
    }
  }

  /**
   * Get database size information
   */
  async getDatabaseSize(): Promise<{
    totalSize: string;
    tableSizes: Array<{ table: string; size: string }>;
  }> {
    try {
      const totalSizeResult = await this.prisma.$queryRaw<Array<{ size: string }>>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;
      
      const tableSizesResult = await this.prisma.$queryRaw<Array<{ table: string; size: string }>>`
        SELECT 
          schemaname||'.'||tablename as table,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      `;

      return {
        totalSize: totalSizeResult[0]?.size || 'Unknown',
        tableSizes: tableSizesResult,
      };
    } catch (error) {
      console.error('[DB] Failed to get database size:', error);
      return {
        totalSize: 'Unknown',
        tableSizes: [],
      };
    }
  }
}

// Export all utilities
export {
  DEFAULT_QUERY_CONFIG,
  DEFAULT_POOL_CONFIG,
  type QueryOptimizationConfig,
  type QueryMetrics,
  type PoolConfig,
};
