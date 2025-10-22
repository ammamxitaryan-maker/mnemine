import React from 'react';
import { LoadingScreen } from './LoadingScreen';

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  duration = 5000
}) => {
  const handleFinish = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <LoadingScreen
      onFinish={handleFinish}
      duration={duration}
    />
  );
};