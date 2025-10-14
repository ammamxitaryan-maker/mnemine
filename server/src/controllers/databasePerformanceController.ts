import { Request, Response } from 'express';
import { DatabaseOptimizationService } from '../services/databaseOptimizationService.js';

export class DatabasePerformanceController {
  // GET /api/admin/database-performance - Database performance metrics
  static async getDatabasePerformance(req: Request, res: Response) {
    try {
      const queryStats = DatabaseOptimizationService.getQueryStats();
      
      // Calculate performance improvements
      const totalQueries = Object.values(queryStats).reduce((sum, stat) => sum + stat.count, 0);
      const avgDuration = Object.values(queryStats).reduce((sum, stat) => sum + stat.avgDuration, 0) / Object.keys(queryStats).length;
      
      res.status(200).json({
        success: true,
        data: {
          queryStats,
          summary: {
            totalQueries,
            averageDuration: avgDuration,
            optimizedQueries: Object.keys(queryStats).length
          },
          recommendations: [
            'Batch operations are being used for mining slot updates',
            'Parallel queries are implemented for dashboard stats',
            'Single transaction queries for user data fetching',
            'Optimized select statements to reduce data transfer'
          ]
        }
      });
    } catch (error) {
      console.error('Error fetching database performance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch database performance metrics'
      });
    }
  }

  // POST /api/admin/clear-database-stats - Clear database performance stats
  static async clearDatabaseStats(req: Request, res: Response) {
    try {
      DatabaseOptimizationService.clearQueryStats();
      
      res.status(200).json({
        success: true,
        message: 'Database performance statistics cleared'
      });
    } catch (error) {
      console.error('Error clearing database stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to clear database statistics'
      });
    }
  }

  // GET /api/admin/database-optimization-report - Database optimization report
  static async getOptimizationReport(req: Request, res: Response) {
    try {
      const queryStats = DatabaseOptimizationService.getQueryStats();
      
      // Generate optimization report
      const report = {
        timestamp: new Date().toISOString(),
        optimizations: {
          batchOperations: {
            description: 'Mining slot updates are batched to reduce database round trips',
            implementation: 'DatabaseOptimizationService.batchUpdateMiningSlots()',
            benefit: 'Reduces N+1 query problems and improves performance'
          },
          parallelQueries: {
            description: 'Dashboard statistics use parallel queries instead of sequential',
            implementation: 'Promise.all() for multiple independent queries',
            benefit: 'Reduces total query time by running queries concurrently'
          },
          singleTransactionQueries: {
            description: 'User data fetching uses single transaction with optimized selects',
            implementation: 'DatabaseOptimizationService.getUserDataOptimized()',
            benefit: 'Reduces database connections and improves data consistency'
          },
          optimizedSelects: {
            description: 'Only necessary fields are selected to reduce data transfer',
            implementation: 'Specific select statements instead of include all',
            benefit: 'Reduces memory usage and network transfer time'
          }
        },
        performanceMetrics: queryStats,
        recommendations: [
          'Consider implementing query result caching for frequently accessed data',
          'Monitor slow queries and add database indexes where needed',
          'Implement connection pooling for high-traffic scenarios',
          'Add database query monitoring and alerting'
        ]
      };

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Error generating optimization report:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate optimization report'
      });
    }
  }
}
