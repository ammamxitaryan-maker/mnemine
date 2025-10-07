// Production health check utility
export class ProductionHealthCheck {
  private static isHealthy = false;
  private static startTime = Date.now();
  private static maxStartupTime = 30000; // 30 seconds max startup time

  static markAsHealthy() {
    this.isHealthy = true;
    console.log(`[HEALTH] Application marked as healthy after ${Date.now() - this.startTime}ms`);
  }

  static isApplicationHealthy(): boolean {
    return this.isHealthy;
  }

  static getStartupTime(): number {
    return Date.now() - this.startTime;
  }

  static isStartupTimeout(): boolean {
    return this.getStartupTime() > this.maxStartupTime;
  }

  static getHealthStatus() {
    return {
      healthy: this.isHealthy,
      startupTime: this.getStartupTime(),
      isTimeout: this.isStartupTimeout(),
      timestamp: new Date().toISOString()
    };
  }
}

// Health check endpoint for production monitoring
export const productionHealthCheck = async (req: any, res: any) => {
  const healthStatus = ProductionHealthCheck.getHealthStatus();
  
  if (healthStatus.healthy) {
    res.status(200).json({
      status: 'healthy',
      ...healthStatus
    });
  } else if (healthStatus.isTimeout) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Application startup timeout',
      ...healthStatus
    });
  } else {
    res.status(503).json({
      status: 'starting',
      ...healthStatus
    });
  }
};
