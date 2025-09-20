import React, { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface RealTimeSyncProps {
  onSync?: () => void;
  syncInterval?: number;
}

export const RealTimeSync: React.FC<RealTimeSyncProps> = ({ 
  onSync, 
  syncInterval = 30000 // 30 seconds default
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<Date>(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const queryClient = useQueryClient();

  const handleSync = useCallback(async () => {
    if (isSyncing) return;
    
    setIsSyncing(true);
    try {
      // Invalidate all queries to trigger refetch
      await queryClient.invalidateQueries();
      setLastSync(new Date());
      onSync?.();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [queryClient, onSync, isSyncing]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync(); // Sync when coming back online
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleSync]);

  // Auto-sync interval
  useEffect(() => {
    if (!isOnline) return;

    const interval = setInterval(handleSync, syncInterval);
    return () => clearInterval(interval);
  }, [handleSync, syncInterval, isOnline]);

  // Focus sync - sync when user returns to tab
  useEffect(() => {
    const handleFocus = () => {
      if (isOnline) {
        handleSync();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [handleSync, isOnline]);

  return (
    <div className="flex items-center space-x-2 text-sm">
      {isOnline ? (
        <Wifi className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-red-500" />
      )}
      
      <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        {isOnline ? 'Connected' : 'Offline'}
      </span>
      
      {isOnline && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="text-xs">
            {isSyncing ? 'Syncing...' : 'Sync'}
          </span>
        </button>
      )}
      
      <span className="text-xs text-gray-500">
        Last: {lastSync.toLocaleTimeString()}
      </span>
    </div>
  );
};

// Hook for real-time data synchronization
export const useRealTimeSync = (queryKey: string[], interval = 30000) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const syncData = () => {
      queryClient.invalidateQueries({ queryKey });
    };

    const intervalId = setInterval(syncData, interval);
    
    // Sync on window focus
    const handleFocus = () => syncData();
    window.addEventListener('focus', handleFocus);

    // Sync on online status
    const handleOnline = () => {
      setIsConnected(true);
      syncData();
    };
    const handleOffline = () => setIsConnected(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queryClient, queryKey, interval]);

  return { isConnected };
};

// WebSocket-like real-time updates using polling
export const useRealTimeUpdates = <T,>(
  fetchFn: () => Promise<T>,
  interval = 10000,
  enabled = true
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const updateData = async () => {
      setIsLoading(true);
      try {
        const result = await fetchFn();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial fetch
    updateData();

    // Set up interval
    const intervalId = setInterval(updateData, interval);

    return () => clearInterval(intervalId);
  }, [fetchFn, interval, enabled]);

  return { data, isLoading, error, refetch: () => fetchFn().then(setData) };
};
