import { useLoading } from '@/contexts/LoadingContext';
import React, { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  duration = 1500
}) => {
  const { setAnimationComplete } = useLoading();
  const [isVisible, setIsVisible] = useState(false);
  const [isWinking, setIsWinking] = useState(false);

  useEffect(() => {
    // Simple, fast animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 200);

    // Wink animation near the end
    const winkTimer = setTimeout(() => {
      setIsWinking(true);
    }, duration - 300);

    const completeTimer = setTimeout(() => {
      setAnimationComplete(true);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(winkTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete, setAnimationComplete]);

  return (
    <div className="loading-animation-container">
      <div className="loading-animation">
        {/* Simple Mouse Logo */}
        <div className={`mouse-head ${isVisible ? 'visible' : ''}`}>
          <svg className="mouse-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="NON mouse logo">
            <defs>
              {/* neon gradient */}
              <linearGradient id="neonGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#00f0f0" />
                <stop offset="50%" stopColor="#8ef0ff" />
                <stop offset="100%" stopColor="#7a6bff" />
              </linearGradient>
              {/* glow filter */}
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* head outline */}
            <path className="neon" d="M48 110
                                 C48 82, 70 60, 100 60
                                 C130 60, 152 82, 152 110
                                 C152 136, 124 156, 100 156
                                 C76 156, 48 136, 48 110Z" strokeLinejoin="round" strokeWidth="2.6" />

            {/* ears */}
            <g transform="translate(0, -6)">
              <path className="neon" d="M52 60 C36 52, 32 36, 48 28 C64 20, 78 28, 84 44 C78 48, 64 56, 52 60Z" strokeLinejoin="round" strokeLinecap="round" />
              <path className="neon" d="M148 60 C164 52, 168 36, 152 28 C136 20, 122 28, 116 44 C122 48, 136 56, 148 60Z" strokeLinejoin="round" strokeLinecap="round" />
            </g>

            {/* eyes */}
            <g className="mouse-eyes">
              {/* Left eye - with wink animation */}
              <circle className="eye" cx="84" cy="106" r="8" />
              <circle cx="82" cy="104" r="2" fill="#ffffff" opacity="0.9" />

              {/* Right eye - normal */}
              <circle className="eye" cx="116" cy="106" r="8" />
              <circle cx="114" cy="104" r="2" fill="#ffffff" opacity="0.9" />

              {/* Wink line for left eye */}
              <path
                className={`wink-line ${isWinking ? 'wink-active' : ''}`}
                d="M76 106 Q84 102 92 106"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
              />
            </g>

            {/* nose */}
            <circle className="nose" cx="100" cy="122" r="4" fill="rgba(255, 182, 193, 0.8)" />

            {/* smile */}
            <path d="M88 128 C94 136, 106 136, 112 128" stroke="rgba(255,255,255,0.2)" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* cheeks */}
            <circle className="mouse-cheek left-cheek" cx="70" cy="130" r="8" />
            <circle className="mouse-cheek right-cheek" cx="130" cy="130" r="8" />

            {/* NON text */}
            <text className="non-text" x="100" y="155" textAnchor="middle" fontSize="24" fontWeight="800" letterSpacing="4" fill="#00f0f0">
              NON
            </text>
          </svg>
        </div>
      </div>
    </div>
  );
};
