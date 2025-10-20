import { useLoading } from '@/contexts/LoadingContext';
import React from 'react';
import { AppContent } from './AppContent';
import { LoadingAnimation } from './LoadingAnimation';

export const AppWithLoading: React.FC = () => {
  const { loadingState } = useLoading();

  if (!loadingState.isAppReady) {
    return <LoadingAnimation duration={4000} />;
  }

  return <AppContent />;
};
