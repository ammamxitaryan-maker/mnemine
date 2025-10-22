import React, { createContext, ReactNode, useContext, useState } from 'react';

interface LoadingState {
  isAppReady: boolean;
}

interface LoadingContextType {
  loadingState: LoadingState;
  setAppReady: (ready: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isAppReady: false
  });

  const setAppReady = (ready: boolean) => {
    setLoadingState({ isAppReady: ready });
  };

  const value: LoadingContextType = {
    loadingState,
    setAppReady
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = (): LoadingContextType => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};
