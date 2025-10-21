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
  const [loadingMessage, setLoadingMessage] = useState('Initializing System');
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);
  const [performanceMode, setPerformanceMode] = useState<'high' | 'medium' | 'low'>('high');
  const animationRef = useRef<number>();

  useEffect(() => {
    // Keyboard user detection
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    // Performance detection and adaptive optimization
    const detectPerformance = () => {
      const start = performance.now();
      requestAnimationFrame(() => {
        const end = performance.now();
        const frameTime = end - start;

        if (frameTime > 16.67) { // More than 60fps threshold
          setPerformanceMode('low');
        } else if (frameTime > 8.33) { // More than 120fps threshold
          setPerformanceMode('medium');
        } else {
          setPerformanceMode('high');
        }
      });
    };

    detectPerformance();

    // Dynamic loading messages based on progress
    const messageInterval = setInterval(() => {
      setLoadingMessage(prev => {
        const messages = [
          'Initializing System',
          'Loading Components',
          'Preparing Interface',
          'Optimizing Performance',
          'Finalizing Setup',
          'Almost Ready'
        ];
        const currentIndex = messages.indexOf(prev);
        return messages[(currentIndex + 1) % messages.length];
      });
    }, 800);

    // Refined progress animation with smoother increments
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(messageInterval);
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
      clearInterval(messageInterval);
      clearInterval(letterInterval);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
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
    <div
      className={`simple-loading-screen ${isKeyboardUser ? 'keyboard-user' : ''} performance-${performanceMode}`}
      role="progressbar"
      aria-label="Loading application"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          // Allow users to skip loading if needed
          setAnimationComplete(true);
          if (onComplete) {
            onComplete();
          }
        }
      }}
    >
      {/* Background */}
      <div className="loading-background" aria-hidden="true"></div>

      {/* Geometric Background Shapes */}
      <div className="geometric-shapes" aria-hidden="true">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
        <div className="shape shape-4"></div>
        <div className="shape shape-5"></div>
        <div className="shape shape-6"></div>
      </div>

      {/* Floating Particles */}
      <div className="floating-particles" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              '--particle-delay': `${i * 0.5}s`,
              '--particle-duration': `${3 + Math.random() * 2}s`,
              '--particle-x': `${Math.random() * 100}%`,
              '--particle-y': `${Math.random() * 100}%`
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Connection Lines */}
      <div className="connection-lines" aria-hidden="true">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="connection-line"
            style={{
              '--line-delay': `${i * 0.3}s`,
              '--line-duration': `${4 + Math.random() * 2}s`
            } as React.CSSProperties}
          />
        ))}
      </div>

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

        {/* Progress Section */}
        <div className={`progress-section ${showProgress ? 'visible' : ''}`}>
          {/* Circular Progress Ring */}
          <div className="circular-progress">
            <svg className="progress-ring" width="120" height="120">
              <circle
                className="progress-ring-circle"
                stroke="url(#gradient)"
                strokeWidth="4"
                fill="transparent"
                r="52"
                cx="60"
                cy="60"
                style={{
                  strokeDasharray: `${2 * Math.PI * 52}`,
                  strokeDashoffset: `${2 * Math.PI * 52 * (1 - progress / 100)}`
                }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="50%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#c084fc" />
                </linearGradient>
              </defs>
            </svg>
            <div className="progress-percentage">{Math.round(progress)}%</div>
          </div>

          {/* Linear Progress Bar */}
          <div className="progress-container">
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

          {/* Loading Status */}
          <div className="loading-status">
            <div className="status-text" aria-live="polite">{loadingMessage}</div>
            <div className="status-dots" aria-hidden="true">
              <span className="status-dot"></span>
              <span className="status-dot"></span>
              <span className="status-dot"></span>
            </div>
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