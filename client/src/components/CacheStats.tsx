import { useState, useEffect } from 'react';
import { useCacheManager, useCachePerformance } from '@/hooks/useCacheManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, BarChart3, RefreshCw } from 'lucide-react';

interface CacheStatsProps {
  isVisible?: boolean;
}

export const CacheStats = ({ isVisible = false }: CacheStatsProps) => {
  const { clearAllCache, clearExpiredCache, getCacheStats } = useCacheManager();
  const { cacheHits, cacheMisses, cacheHitRate, resetStats } = useCachePerformance();
  const [stats, setStats] = useState(getCacheStats());
  const [isExpanded, setIsExpanded] = useState(false);

  const refreshStats = () => {
    setStats(getCacheStats());
  };

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(refreshStats, 5000); // Update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-80 bg-white/95 backdrop-blur-sm border border-gray-200 dark:bg-gray-800/95 dark:border-gray-600 z-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Cache Performance
          </CardTitle>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0"
          >
            {isExpanded ? '−' : '+'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Hit Rate:</span>
            <span className={`font-medium ${cacheHitRate > 80 ? 'text-green-600' : cacheHitRate > 60 ? 'text-yellow-600' : 'text-red-600'}`}>
              {cacheHitRate.toFixed(1)}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Cache Hits:</span>
            <span className="font-medium text-green-600">{cacheHits}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Cache Misses:</span>
            <span className="font-medium text-red-600">{cacheMisses}</span>
          </div>

          {isExpanded && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Entries:</span>
                <span className="font-medium">{stats.totalEntries}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Size:</span>
                <span className="font-medium">{(stats.totalSize / 1024).toFixed(1)} KB</span>
              </div>

              <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshStats}
                    className="flex-1 h-6 text-xs"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearExpiredCache}
                    className="flex-1 h-6 text-xs"
                  >
                    Clean
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      clearAllCache();
                      resetStats();
                      refreshStats();
                    }}
                    className="flex-1 h-6 text-xs"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
