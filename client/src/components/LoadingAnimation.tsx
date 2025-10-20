import { useLoading } from '@/contexts/LoadingContext';
import React, { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  duration = 2500
}) => {
  const { setAnimationComplete, loadingState } = useLoading();
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'logo' | 'text' | 'complete'>('initial');
  const [isWinking, setIsWinking] = useState(false);

  useEffect(() => {
    // Phase 1: Logo entrance
    const phase1Timer = setTimeout(() => {
      setAnimationPhase('logo');
    }, 200);

    // Phase 2: Text animation
    const phase2Timer = setTimeout(() => {
      setAnimationPhase('text');
    }, 800);

    // Wink animation
    const winkTimer = setTimeout(() => {
      setIsWinking(true);
    }, duration - 600);

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
    <div className="professional-loading-screen">
      {/* Subtle background gradient */}
      <div className="loading-background" />

      {/* Floating particles */}
      <div className="floating-particles">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className={`particle particle-${i}`} />
        ))}
      </div>

      {/* Main content container */}
      <div className="loading-content">
        {/* NONMINE Logo */}
        <div className={`brand-logo ${animationPhase}`}>
          {/* N (Left) */}
          <div className="letter-n left-n">
            <div className="n-stroke n-left-vertical"></div>
            <div className="n-stroke n-diagonal"></div>
            <div className="n-stroke n-right-vertical"></div>
          </div>

          {/* O (Mouse head) */}
          <div className={`mouse-icon ${animationPhase === 'logo' ? 'visible' : ''}`}>
            <svg className="mouse-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="NONMINE mouse logo">
              <defs>
                <linearGradient id="primaryGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00D4FF" />
                  <stop offset="50%" stopColor="#0099CC" />
                  <stop offset="100%" stopColor="#0066CC" />
                </linearGradient>
                <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8EF0FF" />
                  <stop offset="100%" stopColor="#00D4FF" />
                </linearGradient>
                <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Mouse head */}
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="url(#primaryGradient)"
                filter="url(#softGlow)"
                className="mouse-head"
              />

              {/* Ears */}
              <circle cx="35" cy="35" r="8" fill="url(#accentGradient)" opacity="0.9" />
              <circle cx="65" cy="35" r="8" fill="url(#accentGradient)" opacity="0.9" />

              {/* Eyes */}
              <g className="mouse-eyes">
                <circle cx="42" cy="45" r="4" fill="#FFFFFF" opacity="0.95" />
                <circle cx="58" cy="45" r="4" fill="#FFFFFF" opacity="0.95" />
                <circle cx="41" cy="44" r="1.5" fill="#1A1A1A" opacity="0.8" />
                <circle cx="57" cy="44" r="1.5" fill="#1A1A1A" opacity="0.8" />

                {/* Wink line */}
                <path
                  className={`wink-line ${isWinking ? 'wink-active' : ''}`}
                  d="M38 45 Q42 42 46 45"
                  stroke="#1A1A1A"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                />
              </g>

              {/* Nose */}
              <circle cx="50" cy="55" r="2.5" fill="#FFB6C1" opacity="0.9" />

              {/* Smile */}
              <path
                d="M42 60 Q50 65 58 60"
                stroke="#1A1A1A"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
            </svg>
          </div>

          {/* N (Right) */}
          <div className="letter-n right-n">
            <div className="n-stroke n-left-vertical"></div>
            <div className="n-stroke n-diagonal"></div>
            <div className="n-stroke n-right-vertical"></div>
          </div>
        </div>

        {/* MINE Text */}
        <div className={`brand-text ${animationPhase === 'text' ? 'visible' : ''}`}>
          <span className="brand-letter">M</span>
          <span className="brand-letter">I</span>
          <span className="brand-letter">N</span>
          <span className="brand-letter">E</span>
        </div>

        {/* Subtitle */}
        <div className={`brand-subtitle ${animationPhase === 'text' ? 'visible' : ''}`}>
          Crypto Mining Platform
        </div>
      </div>

      {/* Loading indicator */}
      <div className="loading-indicator">
        <div className="progress-container">
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${loadingState.loadingProgress}%` }}
            />
          </div>
          <div className="progress-text">
            {loadingState.loadingMessage}
          </div>
        </div>

        {/* Elegant loading dots */}
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    </div>
  );
};
