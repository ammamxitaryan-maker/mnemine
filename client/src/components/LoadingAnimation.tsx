import { useLoading } from '@/contexts/LoadingContext';
import React, { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  duration = 400
}) => {
  const { setAnimationComplete, loadingState } = useLoading();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show content immediately
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 50);

    // Complete animation quickly
    const completeTimer = setTimeout(() => {
      setAnimationComplete(true);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete, setAnimationComplete]);

  return (
    <div className="simple-loading-screen">
      <div className="simple-content">
        {/* Simple NONMINE Logo */}
        <div className={`simple-logo ${isVisible ? 'visible' : ''}`}>
          <div className="logo-text">NONMINE</div>
          <div className="logo-subtitle">Crypto Mining</div>
        </div>

        {/* Simple loading indicator */}
        <div className="simple-loading">
          <div className="simple-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
