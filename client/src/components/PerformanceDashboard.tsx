import React, { useState, useEffect } from 'react';
import { performanceOptimizer, BundleOptimizer } from '../optimizations/performanceOptimizations';

interface PerformanceData {
  coreWebVitals: {
    lcp?: { average: string; status: string };
    fid?: { average: string; status: string };
    cls?: { average: string; status: string };
  };
  memory: {
    averageUsed: string;
    maxUsed: string;
    status: string;
  };
  resources: {
    averageLoadTime: string;
    slowResources: number;
    status: string;
  };
  recommendations: string[];
}

export const PerformanceDashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [bundleData, setBundleData] = useState<any>(null);
  const [loadingMetrics, setLoadingMetrics] = useState<any>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    // Initialize performance monitoring
    performanceOptimizer.init();
    setIsMonitoring(true);

    // Get initial performance data
    updatePerformanceData();

    // Update performance data every 10 seconds
    const interval = setInterval(updatePerformanceData, 10000);

    return () => {
      clearInterval(interval);
      performanceOptimizer.cleanup();
      setIsMonitoring(false);
    };
  }, []);

  const updatePerformanceData = () => {
    const report = performanceOptimizer.getPerformanceReport();
    setPerformanceData(report);

    const bundleAnalysis = BundleOptimizer.analyzeBundleSize();
    setBundleData(bundleAnalysis);

    const loadingMetrics = BundleOptimizer.getLoadingMetrics();
    setLoadingMetrics(loadingMetrics);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-500';
      case 'needs_improvement': return 'text-yellow-500';
      case 'poor': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return '✅';
      case 'needs_improvement': return '⚠️';
      case 'poor': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="p-4 bg-gray-900 rounded-lg text-white">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Performance Dashboard</h3>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isMonitoring ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm">{isMonitoring ? 'Monitoring' : 'Stopped'}</span>
        </div>
      </div>

      {/* Core Web Vitals */}
      {performanceData?.coreWebVitals && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Core Web Vitals</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {performanceData.coreWebVitals.lcp && (
              <div className="bg-gray-800 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">LCP</span>
                  <span className={getStatusColor(performanceData.coreWebVitals.lcp.status)}>
                    {getStatusIcon(performanceData.coreWebVitals.lcp.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {performanceData.coreWebVitals.lcp.average}ms
                </p>
                <p className="text-xs text-gray-400">
                  Status: {performanceData.coreWebVitals.lcp.status}
                </p>
              </div>
            )}

            {performanceData.coreWebVitals.fid && (
              <div className="bg-gray-800 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">FID</span>
                  <span className={getStatusColor(performanceData.coreWebVitals.fid.status)}>
                    {getStatusIcon(performanceData.coreWebVitals.fid.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {performanceData.coreWebVitals.fid.average}ms
                </p>
                <p className="text-xs text-gray-400">
                  Status: {performanceData.coreWebVitals.fid.status}
                </p>
              </div>
            )}

            {performanceData.coreWebVitals.cls && (
              <div className="bg-gray-800 p-3 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">CLS</span>
                  <span className={getStatusColor(performanceData.coreWebVitals.cls.status)}>
                    {getStatusIcon(performanceData.coreWebVitals.cls.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  {performanceData.coreWebVitals.cls.average}
                </p>
                <p className="text-xs text-gray-400">
                  Status: {performanceData.coreWebVitals.cls.status}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Memory Usage */}
      {performanceData?.memory && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Memory Usage</h4>
          <div className="bg-gray-800 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Memory</span>
              <span className={getStatusColor(performanceData.memory.status)}>
                {getStatusIcon(performanceData.memory.status)}
              </span>
            </div>
            <p className="text-sm text-gray-300">
              Average: {performanceData.memory.averageUsed}
            </p>
            <p className="text-sm text-gray-300">
              Peak: {performanceData.memory.maxUsed}
            </p>
          </div>
        </div>
      )}

      {/* Bundle Analysis */}
      {bundleData && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Bundle Analysis</h4>
          <div className="bg-gray-800 p-3 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-300">
                  Total Scripts: {bundleData.totalScripts}
                </p>
                <p className="text-sm text-gray-300">
                  Total Size: {(bundleData.totalSize / 1024).toFixed(2)}KB
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-300">
                  Average Size: {(bundleData.averageSize / 1024).toFixed(2)}KB
                </p>
                <p className="text-sm text-gray-300">
                  Large Scripts: {bundleData.largeScripts.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Metrics */}
      {loadingMetrics && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Loading Performance</h4>
          <div className="bg-gray-800 p-3 rounded">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-300">
                  DOM Content Loaded: {loadingMetrics.domContentLoaded.toFixed(2)}ms
                </p>
                <p className="text-sm text-gray-300">
                  Load Complete: {loadingMetrics.loadComplete.toFixed(2)}ms
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-300">
                  Total Load Time: {loadingMetrics.totalLoadTime.toFixed(2)}ms
                </p>
                <p className="text-sm text-gray-300">
                  First Byte: {loadingMetrics.firstByte.toFixed(2)}ms
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recommendations */}
      {performanceData?.recommendations && performanceData.recommendations.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">Recommendations</h4>
          <div className="bg-gray-800 p-3 rounded">
            <ul className="space-y-2">
              {performanceData.recommendations.map((recommendation, index) => (
                <li key={index} className="text-sm text-gray-300 flex items-start">
                  <span className="text-yellow-500 mr-2">💡</span>
                  {recommendation}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={updatePerformanceData}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 text-sm"
        >
          Refresh Data
        </button>
        <button
          onClick={() => {
            performanceOptimizer.cleanup();
            performanceOptimizer.init();
          }}
          className="px-4 py-2 bg-green-600 rounded hover:bg-green-700 text-sm"
        >
          Restart Monitoring
        </button>
      </div>
    </div>
  );
};
