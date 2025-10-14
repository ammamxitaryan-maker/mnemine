import { useEffect, useState } from 'react';

interface NetworkErrorState {
  hasNetworkError: boolean;
  lastErrorTime: number;
  errorCount: number;
}

export const useNetworkErrorHandler = () => {
  const [networkState, setNetworkState] = useState<NetworkErrorState>({
    hasNetworkError: false,
    lastErrorTime: 0,
    errorCount: 0,
  });

  const handleNetworkError = (error: unknown) => {
    const now = Date.now();
    const isNetworkError = error && typeof error === 'object' && 'code' in error && error.code === 'ERR_NETWORK';
    
    if (isNetworkError) {
      setNetworkState(prev => ({
        hasNetworkError: true,
        lastErrorTime: now,
        errorCount: prev.errorCount + 1,
      }));

      // Only log the first few errors to avoid spam
      if (networkState.errorCount < 3) {
        console.error('[NETWORK_ERROR] Backend server appears to be unavailable:', error);
      }
    }
  };

  const clearNetworkError = () => {
    setNetworkState({
      hasNetworkError: false,
      lastErrorTime: 0,
      errorCount: 0,
    });
  };

  // Auto-clear network error state after 30 seconds
  useEffect(() => {
    if (networkState.hasNetworkError) {
      const timer = setTimeout(() => {
        setNetworkState(prev => ({
          ...prev,
          hasNetworkError: false,
        }));
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [networkState.hasNetworkError]);

  return {
    networkState,
    handleNetworkError,
    clearNetworkError,
  };
};
