import { useLoading } from '@/contexts/LoadingContext';
import React from 'react';
import { AppContent } from './AppContent';
import { LoadingAnimation } from './LoadingAnimation';

export const AppWithLoading: React.FC = () => {
  const { loadingState } = useLoading();

  if (!loadingState.isAppReady) {
    return <LoadingAnimation duration={400} />;
  }

  return <AppContent />;
};
