// Performance monitoring and optimization
import { performance } from 'perf_hooks';

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): void {
    performance.mark(`${label}-start`);
  }

  endTimer(label: string): number {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label, 'measure')[0];
    const duration = measure.duration;
    
    // Store metric
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
    
    // Clean up marks
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
    
    return duration;
  }

  getAverageTime(label: string): number {
    const times = this.metrics.get(label) || [];
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  getMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};
    
    for (const [label, times] of this.metrics.entries()) {
      result[label] = {
        average: this.getAverageTime(label),
        count: times.length,
      };
    }
    
    return result;
  }

  clearMetrics(): void {
    this.metrics.clear();
  }
}

// Memory usage monitoring
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: Math.round(usage.rss / 1024 / 1024), // MB
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
    external: Math.round(usage.external / 1024 / 1024), // MB
  };
}

// CPU usage monitoring
export async function getCPUUsage() {
  const os = await import('os');
  const cpus = os.cpus();
  return {
    cores: cpus.length,
    model: cpus[0]?.model || 'Unknown',
  };
}

export default PerformanceMonitor;
