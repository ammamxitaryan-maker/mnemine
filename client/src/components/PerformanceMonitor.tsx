import React, { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
}

export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    reRenderCount: 0
  });
  
  const [isMonitoring, setIsMonitoring] = useState(false);
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    // Start monitoring when component mounts
    startTimeRef.current = performance.now();
    setIsMonitoring(true);
    
    // Monitor memory usage
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // Convert to MB
        }));
      }
    };

    const interval = setInterval(updateMemoryUsage, 1000);
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, []);

  useEffect(() => {
    // Track re-renders
    renderCountRef.current++;
    setMetrics(prev => ({
      ...prev,
      reRenderCount: renderCountRef.current
    }));
  });

  const runPerformanceTest = () => {
    const startTime = performance.now();
    
    // Simulate heavy operations
    const operations = [
      () => {
        // Simulate data processing
        let result = 0;
        for (let i = 0; i < 1000000; i++) {
          result += Math.random();
        }
        return result;
      },
      () => {
        // Simulate DOM operations
        const div = document.createElement('div');
        div.innerHTML = 'test';
        document.body.appendChild(div);
        document.body.removeChild(div);
      },
      () => {
        // Simulate state updates
        const arr = new Array(10000).fill(0).map((_, i) => i);
        return arr.reduce((sum, val) => sum + val, 0);
      }
    ];

    const results = operations.map((op, index) => {
      const opStart = performance.now();
      const result = op();
      const opEnd = performance.now();
      
      return {
        operation: `Operation ${index + 1}`,
        duration: opEnd - opStart,
        result: result
      };
    });

    const totalTime = performance.now() - startTime;
    
    setMetrics(prev => ({
      ...prev,
      loadTime: totalTime,
      renderTime: totalTime / operations.length
    }));

    console.log('Performance Test Results:', {
      totalTime: `${totalTime.toFixed(2)}ms`,
      operations: results,
      metrics
    });
  };

  const measureComponentPerformance = () => {
    const startTime = performance.now();
    
    // Count DOM elements
    const elementCount = document.querySelectorAll('*').length;
    
    // Measure layout time
    const layoutStart = performance.now();
    document.body.offsetHeight; // Force layout
    const layoutTime = performance.now() - layoutStart;
    
    const endTime = performance.now();
    
    setMetrics(prev => ({
      ...prev,
      componentCount: elementCount,
      renderTime: endTime - startTime
    }));
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg text-white">
      <h3 className="text-lg font-bold mb-4">Performance Monitor</h3>
      
      <div className="mb-4">
        <button 
          onClick={runPerformanceTest}
          className="mr-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
        >
          Run Performance Test
        </button>
        <button 
          onClick={measureComponentPerformance}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
        >
          Measure Components
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="font-semibold mb-2">Load Performance</h4>
          <p>Load Time: {metrics.loadTime.toFixed(2)}ms</p>
          <p>Render Time: {metrics.renderTime.toFixed(2)}ms</p>
          <p>Status: {metrics.loadTime < 100 ? '✅ Fast' : metrics.loadTime < 500 ? '⚠️ Medium' : '❌ Slow'}</p>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <h4 className="font-semibold mb-2">Memory & Components</h4>
          <p>Memory Usage: {metrics.memoryUsage.toFixed(2)}MB</p>
          <p>Component Count: {metrics.componentCount}</p>
          <p>Re-renders: {metrics.reRenderCount}</p>
        </div>
      </div>

      <div className="bg-gray-800 p-3 rounded">
        <h4 className="font-semibold mb-2">Performance Recommendations</h4>
        <ul className="text-sm space-y-1">
          {metrics.loadTime > 500 && (
            <li className="text-red-400">⚠️ Load time is slow. Consider lazy loading components.</li>
          )}
          {metrics.memoryUsage > 50 && (
            <li className="text-yellow-400">⚠️ High memory usage. Check for memory leaks.</li>
          )}
          {metrics.reRenderCount > 10 && (
            <li className="text-yellow-400">⚠️ Many re-renders. Check for unnecessary updates.</li>
          )}
          {metrics.loadTime < 100 && metrics.memoryUsage < 20 && (
            <li className="text-green-400">✅ Performance looks good!</li>
          )}
        </ul>
      </div>

      <div className="mt-4 text-xs text-gray-400">
        <p>Monitoring: {isMonitoring ? '🟢 Active' : '🔴 Inactive'}</p>
        <p>Last Update: {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
};