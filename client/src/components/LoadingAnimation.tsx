import { useLoading } from '@/contexts/LoadingContext';
import React, { useEffect, useRef, useState } from 'react';

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  duration = 3500
}) => {
  const { setAnimationComplete, loadingState } = useLoading();
  const [showNON, setShowNON] = useState(false);
  const [showMINING, setShowMINING] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLetter, setCurrentLetter] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [showDots, setShowDots] = useState(false);
  const animationRef = useRef<number>();

  useEffect(() => {
    // Refined progress animation with smoother increments
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + Math.random() * 8 + 3;
      });
    }, 150);

    // Show NON text with refined timing
    const showNONTimer = setTimeout(() => {
      setShowNON(true);
    }, 300);

    // Show MINING text
    const showMININGTimer = setTimeout(() => {
      setShowMINING(true);
    }, 1200);

    // Show progress bar
    const showProgressTimer = setTimeout(() => {
      setShowProgress(true);
    }, 2000);

    // Show loading dots
    const showDotsTimer = setTimeout(() => {
      setShowDots(true);
    }, 2500);

    // Letter animation with refined timing
    const letterInterval = setInterval(() => {
      setCurrentLetter(prev => (prev + 1) % 7); // NON MINING = 7 letters
    }, 200);

    // Complete animation
    const completeTimer = setTimeout(() => {
      setAnimationComplete(true);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(showNONTimer);
      clearTimeout(showMININGTimer);
      clearTimeout(showProgressTimer);
      clearTimeout(showDotsTimer);
      clearTimeout(completeTimer);
      clearInterval(progressInterval);
      clearInterval(letterInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [duration, onComplete, setAnimationComplete]);

  const renderLetter = (letter: string, index: number, isActive: boolean) => {
    return (
      <span
        key={index}
        className={`letter ${isActive ? 'active' : ''}`}
        style={{
          animationDelay: `${index * 0.08}s`,
          '--letter-index': index
        } as React.CSSProperties}
      >
        {letter}
      </span>
    );
  };

  return (
    <div className="simple-loading-screen">
      {/* Background */}
      <div className="loading-background"></div>

      {/* Main Content */}
      <div className="loading-content">
        {/* NON Text */}
        <div className={`text-container non-text ${showNON ? 'visible' : ''}`}>
          {['N', 'O', 'N'].map((letter, index) =>
            renderLetter(letter, index, currentLetter >= index)
          )}
        </div>

        {/* MINING Text */}
        <div className={`text-container mining-text ${showMINING ? 'visible' : ''}`}>
          {['M', 'I', 'N', 'I', 'N', 'G'].map((letter, index) =>
            renderLetter(letter, index, currentLetter >= index + 3)
          )}
        </div>

        {/* Progress Bar */}
        <div className={`progress-container ${showProgress ? 'visible' : ''}`}>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="progress-text">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Loading Dots */}
        <div className={`loading-dots ${showDots ? 'visible' : ''}`}>
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};