import { useLoading } from '@/contexts/LoadingContext';
import React, { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  duration = 3000
}) => {
  const { setAnimationComplete, loadingState } = useLoading();
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'logo' | 'text' | 'complete'>('initial');
  const [isWinking, setIsWinking] = useState(false);

  useEffect(() => {
    // Phase 1: Initial appearance
    const phase1Timer = setTimeout(() => {
      setAnimationPhase('logo');
    }, 300);

    // Phase 2: Text animation
    const phase2Timer = setTimeout(() => {
      setAnimationPhase('text');
    }, 1000);

    // Wink animation
    const winkTimer = setTimeout(() => {
      setIsWinking(true);
    }, duration - 800);

    // Phase 3: Complete
    const completeTimer = setTimeout(() => {
      setAnimationPhase('complete');
      setAnimationComplete(true);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(phase1Timer);
      clearTimeout(phase2Timer);
      clearTimeout(winkTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete, setAnimationComplete]);

  return (
    <div className="professional-loading-container">
      {/* Animated background particles */}
      <div className="particles-background">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className={`particle particle-${i}`} />
        ))}
      </div>

      {/* Main logo container */}
      <div className="logo-container">
        {/* NONMINE Logo */}
        <div className={`nonmine-logo ${animationPhase}`}>
          {/* N (Left) */}
          <div className="letter-n left-n">
            <div className="n-vertical n-left"></div>
            <div className="n-diagonal"></div>
            <div className="n-vertical n-right"></div>
          </div>

          {/* O (Mouse head) */}
          <div className={`mouse-head ${animationPhase === 'logo' ? 'visible' : ''}`}>
            <svg className="mouse-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="NONMINE mouse logo">
              <defs>
                <linearGradient id="neonGrad" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#00f0f0" />
                  <stop offset="50%" stopColor="#8ef0ff" />
                  <stop offset="100%" stopColor="#7a6bff" />
                </linearGradient>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Mouse head outline */}
              <path
                className="neon"
                d="M30 70 C30 50, 45 35, 60 35 C75 35, 90 50, 90 70 C90 88, 75 100, 60 100 C45 100, 30 88, 30 70Z"
                strokeLinejoin="round"
                strokeWidth="2"
                fill="url(#neonGrad)"
                filter="url(#glow)"
              />

              {/* Ears */}
              <g transform="translate(0, -3)">
                <path className="neon" d="M35 40 C25 35, 20 25, 30 20 C40 15, 50 20, 55 30 C50 32, 40 38, 35 40Z" strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" fill="url(#neonGrad)" filter="url(#glow)" />
                <path className="neon" d="M85 40 C95 35, 100 25, 90 20 C80 15, 70 20, 65 30 C70 32, 80 38, 85 40Z" strokeLinejoin="round" strokeLinecap="round" strokeWidth="1.5" fill="url(#neonGrad)" filter="url(#glow)" />
              </g>

              {/* Eyes */}
              <g className="mouse-eyes">
                <circle className="eye" cx="45" cy="65" r="6" fill="#ffffff" opacity="0.9" />
                <circle className="eye" cx="75" cy="65" r="6" fill="#ffffff" opacity="0.9" />
                <circle cx="43" cy="63" r="1.5" fill="#000000" opacity="0.8" />
                <circle cx="73" cy="63" r="1.5" fill="#000000" opacity="0.8" />

                {/* Wink line for left eye */}
                <path
                  className={`wink-line ${isWinking ? 'wink-active' : ''}`}
                  d="M39 65 Q45 62 51 65"
                  stroke="rgba(0,0,0,0.8)"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              {/* Nose */}
              <circle className="nose" cx="60" cy="75" r="3" fill="rgba(255, 182, 193, 0.9)" />

              {/* Smile */}
              <path d="M50 80 C55 85, 65 85, 70 80" stroke="rgba(0,0,0,0.3)" strokeWidth="2" fill="none" strokeLinecap="round" />
            </svg>
          </div>

          {/* N (Right) */}
          <div className="letter-n right-n">
            <div className="n-vertical n-left"></div>
            <div className="n-diagonal"></div>
            <div className="n-vertical n-right"></div>
          </div>
        </div>

        {/* MINE Text */}
        <div className={`mine-text ${animationPhase === 'text' ? 'visible' : ''}`}>
          <span className="letter-m">M</span>
          <span className="letter-i">I</span>
          <span className="letter-n">N</span>
          <span className="letter-e">E</span>
        </div>
      </div>

      {/* Loading progress */}
      <div className="loading-progress">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${loadingState.loadingProgress}%` }}
          />
        </div>
        <div className="loading-message">
          {loadingState.loadingMessage}
        </div>
      </div>

      {/* Professional loading dots */}
      <div className="loading-dots">
        <div className="dot"></div>
        <div className="dot"></div>
        <div className="dot"></div>
      </div>
    </div>
  );
};
