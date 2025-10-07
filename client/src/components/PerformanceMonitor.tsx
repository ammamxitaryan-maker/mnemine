import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0
  });

  useEffect(() => {
    const startTime = performance.now();
    
    // Monitor memory usage if available
    const updateMetrics = () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Get memory usage if available (Chrome DevTools)
      const memoryUsage = (performance as any).memory 
        ? (performance as any).memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
        : 0;

      setMetrics({
        renderTime: Math.round(renderTime),
        memoryUsage: Math.round(memoryUsage),
        componentCount: document.querySelectorAll('[data-component]').length
      });
    };

    // Update metrics after render
    const timeoutId = setTimeout(updateMetrics, 100);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs font-mono z-50">
      <div>Render: {metrics.renderTime}ms</div>
      <div>Memory: {metrics.memoryUsage}MB</div>
      <div>Components: {metrics.componentCount}</div>
    </div>
  );
};
