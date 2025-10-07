import React from 'react';

// Frontend performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private metrics: Map<string, number[]> = new Map();
  private observers: PerformanceObserver[] = [];

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Initialize performance monitoring
  init() {
    this.setupPerformanceObserver();
    this.setupMemoryMonitoring();
    this.setupBundleAnalysis();
  }

  // Monitor Core Web Vitals
  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // Monitor Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordMetric('lcp', lastEntry.startTime);
        console.log(`[PERF] LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(lcpObserver);

      // Monitor First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.recordMetric('fid', entry.processingStart - entry.startTime);
          console.log(`[PERF] FID: ${(entry.processingStart - entry.startTime).toFixed(2)}ms`);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      this.observers.push(fidObserver);

      // Monitor Cumulative Layout Shift (CLS)
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            this.recordMetric('cls', entry.value);
            console.log(`[PERF] CLS: ${entry.value.toFixed(4)}`);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      this.observers.push(clsObserver);
    }
  }

  // Monitor memory usage
  private setupMemoryMonitoring() {
    if ('memory' in performance) {
      const checkMemory = () => {
        const memory = (performance as any).memory;
        this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024); // MB
        this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024); // MB
      };

      // Check memory every 5 seconds
      setInterval(checkMemory, 5000);
    }
  }

  // Analyze bundle size and loading performance
  private setupBundleAnalysis() {
    // Monitor resource loading
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.initiatorType === 'script' || entry.initiatorType === 'link') {
            this.recordMetric('resource_load_time', entry.duration);
            
            // Log slow resources
            if (entry.duration > 1000) {
              console.warn(`[PERF] Slow resource: ${entry.name} took ${entry.duration.toFixed(2)}ms`);
            }
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);
    }
  }

  // Record performance metrics
  recordMetric(name: string, value: number) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const metrics = this.metrics.get(name)!;
    metrics.push(value);
    
    // Keep only last 50 measurements
    if (metrics.length > 50) {
      metrics.shift();
    }
  }

  // Get performance report
  getPerformanceReport() {
    const report: any = {
      coreWebVitals: {},
      memory: {},
      resources: {},
      recommendations: []
    };

    // Calculate Core Web Vitals
    const lcpMetrics = this.metrics.get('lcp') || [];
    const fidMetrics = this.metrics.get('fid') || [];
    const clsMetrics = this.metrics.get('cls') || [];

    if (lcpMetrics.length > 0) {
      const avgLCP = lcpMetrics.reduce((sum, val) => sum + val, 0) / lcpMetrics.length;
      report.coreWebVitals.lcp = {
        average: avgLCP.toFixed(2),
        status: avgLCP < 2500 ? 'good' : avgLCP < 4000 ? 'needs_improvement' : 'poor'
      };
    }

    if (fidMetrics.length > 0) {
      const avgFID = fidMetrics.reduce((sum, val) => sum + val, 0) / fidMetrics.length;
      report.coreWebVitals.fid = {
        average: avgFID.toFixed(2),
        status: avgFID < 100 ? 'good' : avgFID < 300 ? 'needs_improvement' : 'poor'
      };
    }

    if (clsMetrics.length > 0) {
      const avgCLS = clsMetrics.reduce((sum, val) => sum + val, 0) / clsMetrics.length;
      report.coreWebVitals.cls = {
        average: avgCLS.toFixed(4),
        status: avgCLS < 0.1 ? 'good' : avgCLS < 0.25 ? 'needs_improvement' : 'poor'
      };
    }

    // Memory metrics
    const memoryUsed = this.metrics.get('memory_used') || [];
    const memoryTotal = this.metrics.get('memory_total') || [];

    if (memoryUsed.length > 0) {
      const avgMemoryUsed = memoryUsed.reduce((sum, val) => sum + val, 0) / memoryUsed.length;
      const maxMemoryUsed = Math.max(...memoryUsed);
      report.memory = {
        averageUsed: avgMemoryUsed.toFixed(2) + 'MB',
        maxUsed: maxMemoryUsed.toFixed(2) + 'MB',
        status: maxMemoryUsed < 50 ? 'good' : maxMemoryUsed < 100 ? 'needs_improvement' : 'poor'
      };
    }

    // Resource loading metrics
    const resourceLoadTimes = this.metrics.get('resource_load_time') || [];
    if (resourceLoadTimes.length > 0) {
      const avgLoadTime = resourceLoadTimes.reduce((sum, val) => sum + val, 0) / resourceLoadTimes.length;
      const slowResources = resourceLoadTimes.filter(time => time > 1000).length;
      report.resources = {
        averageLoadTime: avgLoadTime.toFixed(2) + 'ms',
        slowResources,
        status: slowResources === 0 ? 'good' : slowResources < 3 ? 'needs_improvement' : 'poor'
      };
    }

    // Generate recommendations
    this.generateRecommendations(report);

    return report;
  }

  // Generate performance recommendations
  private generateRecommendations(report: any) {
    const recommendations: string[] = [];

    // LCP recommendations
    if (report.coreWebVitals.lcp?.status === 'poor') {
      recommendations.push('Optimize images and reduce largest contentful paint time');
      recommendations.push('Consider lazy loading for below-the-fold content');
    }

    // FID recommendations
    if (report.coreWebVitals.fid?.status === 'poor') {
      recommendations.push('Reduce JavaScript execution time');
      recommendations.push('Consider code splitting and lazy loading');
    }

    // CLS recommendations
    if (report.coreWebVitals.cls?.status === 'poor') {
      recommendations.push('Add size attributes to images and videos');
      recommendations.push('Avoid inserting content above existing content');
    }

    // Memory recommendations
    if (report.memory?.status === 'poor') {
      recommendations.push('Check for memory leaks in components');
      recommendations.push('Consider implementing virtual scrolling for large lists');
    }

    // Resource recommendations
    if (report.resources?.status === 'poor') {
      recommendations.push('Optimize bundle size and implement code splitting');
      recommendations.push('Use CDN for static assets');
    }

    report.recommendations = recommendations;
  }

  // Cleanup observers
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// React performance optimization hooks
export const usePerformanceOptimization = () => {
  const optimizer = PerformanceOptimizer.getInstance();

  React.useEffect(() => {
    optimizer.init();
    return () => optimizer.cleanup();
  }, []);

  return {
    recordMetric: optimizer.recordMetric.bind(optimizer),
    getReport: optimizer.getPerformanceReport.bind(optimizer)
  };
};

// Bundle optimization utilities
export class BundleOptimizer {
  // Analyze bundle size
  static analyzeBundleSize() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const resources = performance.getEntriesByType('resource');
      const scripts = resources.filter((resource: any) => resource.initiatorType === 'script');
      
      const bundleAnalysis = {
        totalScripts: scripts.length,
        totalSize: scripts.reduce((sum: number, script: any) => sum + (script.transferSize || 0), 0),
        averageSize: 0,
        largeScripts: scripts.filter((script: any) => (script.transferSize || 0) > 100000)
      };

      bundleAnalysis.averageSize = bundleAnalysis.totalSize / bundleAnalysis.totalScripts;

      return bundleAnalysis;
    }
    return null;
  }

  // Get loading performance metrics
  static getLoadingMetrics() {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoadTime: navigation.loadEventEnd - navigation.fetchStart,
        firstByte: navigation.responseStart - navigation.fetchStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart
      };
    }
    return null;
  }
}

// Component optimization utilities
export const optimizeComponent = (Component: React.ComponentType<any>) => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison logic for better performance
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
};

// Lazy loading optimization
export const createLazyComponent = (importFn: () => Promise<any>, fallback?: React.ReactNode) => {
  const LazyComponent = React.lazy(importFn);
  
  return (props: any) => {
    const FallbackComponent = fallback || React.createElement('div', { 
      className: 'animate-pulse bg-gray-200 h-32 rounded' 
    });
    
    return React.createElement(React.Suspense, { fallback: FallbackComponent },
      React.createElement(LazyComponent, props)
    );
  };
};

// Image optimization
export const optimizeImage = (src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
} = {}) => {
  const { width, height, quality = 80, format = 'webp' } = options;
  
  // Add image optimization parameters
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);
  
  return `${src}?${params.toString()}`;
};

// Export the optimizer instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();
