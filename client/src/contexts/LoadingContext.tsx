import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface LoadingState {
  isAppReady: boolean;
  loadingProgress: number;
  loadingMessage: string;
  isAnimationComplete: boolean;
}

interface LoadingContextType {
  loadingState: LoadingState;
  setAppReady: (ready: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setLoadingMessage: (message: string) => void;
  setAnimationComplete: (complete: boolean) => void;
  resetLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isAppReady: false,
    loadingProgress: 0,
    loadingMessage: 'Initializing...',
    isAnimationComplete: false
  });

  const setAppReady = (ready: boolean) => {
    setLoadingState(prev => ({ ...prev, isAppReady: ready }));
  };

  const setLoadingProgress = (progress: number) => {
    setLoadingState(prev => ({ ...prev, loadingProgress: Math.min(100, Math.max(0, progress)) }));
  };

  const setLoadingMessage = (message: string) => {
    setLoadingState(prev => ({ ...prev, loadingMessage: message }));
  };

  const setAnimationComplete = (complete: boolean) => {
    setLoadingState(prev => ({ ...prev, isAnimationComplete: complete }));
  };

  const resetLoading = () => {
    setLoadingState({
      isAppReady: false,
      loadingProgress: 0,
      loadingMessage: 'Initializing...',
      isAnimationComplete: false
    });
  };

  // Simulate loading progress
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setLoadingState(prev => {
        if (prev.loadingProgress < 90 && !prev.isAppReady) {
          const newProgress = prev.loadingProgress + Math.random() * 10;
          return {
            ...prev,
            loadingProgress: newProgress,
            loadingMessage: getLoadingMessage(newProgress)
          };
        }
        return prev;
      });
    }, 200);

    return () => clearInterval(progressInterval);
  }, []);

  // Mark app as ready when all conditions are met
  useEffect(() => {
    if (loadingState.loadingProgress >= 90 && loadingState.isAnimationComplete) {
      const timer = setTimeout(() => {
        setAppReady(true);
        setLoadingMessage('Ready!');
        setLoadingProgress(100);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [loadingState.loadingProgress, loadingState.isAnimationComplete]);

  const value: LoadingContextType = {
    loadingState,
    setAppReady,
    setLoadingProgress,
    setLoadingMessage,
    setAnimationComplete,
    resetLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

const getLoadingMessage = (progress: number): string => {
  if (progress < 20) return 'Loading particles...';
  if (progress < 40) return 'Forming mouse head...';
  if (progress < 60) return 'Activating eyes...';
  if (progress < 80) return 'Preparing NON text...';
  if (progress < 90) return 'Finalizing...';
  return 'Almost ready...';
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
