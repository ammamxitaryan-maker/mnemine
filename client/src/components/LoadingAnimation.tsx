import { useLoading } from '@/contexts/LoadingContext';
import React, { useEffect, useState } from 'react';

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  duration = 4000
}) => {
  const { setAnimationComplete, loadingState } = useLoading();
  const [stage, setStage] = useState<'particles' | 'forming' | 'eyes' | 'text' | 'complete'>('particles');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2000
    }));
    setParticles(newParticles);

    // Animation timeline
    const timeline = [
      { stage: 'particles' as const, delay: 0 },
      { stage: 'forming' as const, delay: 1000 },
      { stage: 'eyes' as const, delay: 2000 },
      { stage: 'text' as const, delay: 3000 },
      { stage: 'complete' as const, delay: duration }
    ];

    timeline.forEach(({ stage, delay }) => {
      setTimeout(() => {
        setStage(stage);
        if (stage === 'complete') {
          setAnimationComplete(true);
          if (onComplete) {
            onComplete();
          }
        }
      }, delay);
    });
  }, [duration, onComplete, setAnimationComplete]);

  return (
    <div className="loading-animation-container">
      <div className="loading-animation">
        {/* Background particles */}
        <div className="particles-container">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={`particle ${stage === 'particles' ? 'active' : ''}`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${particle.delay}ms`
              }}
            />
          ))}
        </div>

        {/* Mouse head SVG */}
        <div className={`mouse-head ${stage === 'forming' || stage === 'eyes' || stage === 'text' || stage === 'complete' ? 'visible' : ''}`}>
          <svg className="mouse-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" role="img" aria-label="NON mouse logo">
            <defs>
              {/* neon gradient used for stroke */}
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

              {/* face gradient */}
              <linearGradient id="faceGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#1e293b" />
                <stop offset="50%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#000000" />
              </linearGradient>

              {/* face fill */}
              <linearGradient id="faceFill" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.03)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.01)" />
              </linearGradient>

              {/* cheek gradient */}
              <radialGradient id="cheekGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255, 182, 193, 0.8)" />
                <stop offset="100%" stopColor="rgba(255, 192, 203, 0.4)" />
              </radialGradient>
            </defs>

            {/* face circle (soft fill for depth) */}
            <circle cx="100" cy="110" r="48" fill="url(#faceGrad)" opacity="0.03" />

            {/* ears (left and right) - outer neon outline */}
            <g transform="translate(0, -6)">
              <path className="neon" d="M52 60
                                   C36 52, 32 36, 48 28
                                   C64 20, 78 28, 84 44
                                   C78 48, 64 56, 52 60Z" strokeLinejoin="round" strokeLinecap="round" />
              <path className="neon" d="M148 60
                                   C164 52, 168 36, 152 28
                                   C136 20, 122 28, 116 44
                                   C122 48, 136 56, 148 60Z" strokeLinejoin="round" strokeLinecap="round" />
            </g>

            {/* head outline (neon) */}
            <path className="neon" d="M48 110
                                 C48 82, 70 60, 100 60
                                 C130 60, 152 82, 152 110
                                 C152 136, 124 156, 100 156
                                 C76 156, 48 136, 48 110Z" strokeLinejoin="round" strokeWidth="2.6" />

            {/* internal subtle face shape */}
            <path d="M60 112 C60 94, 78 80, 100 80 C122 80, 140 94, 140 112 C140 130, 118 146, 100 146 C82 146, 60 130, 60 112Z"
              fill="url(#faceFill)" opacity="0.06" />

            {/* eyes (glowing) */}
            <g className={`mouse-eyes ${stage === 'eyes' || stage === 'text' || stage === 'complete' ? 'glowing' : ''}`}>
              <circle className="eye" cx="84" cy="106" r="6" />
              <circle className="eye" cx="116" cy="106" r="6" />
              {/* little catch highlights */}
              <circle cx="82" cy="104" r="1.3" fill="#ffffff" opacity="0.9" />
              <circle cx="114" cy="104" r="1.3" fill="#ffffff" opacity="0.9" />
            </g>

            {/* nose */}
            <circle className="nose" cx="100" cy="122" r="3.6" />

            {/* gentle smile */}
            <path d="M88 128 C94 134, 106 134, 112 128" stroke="rgba(255,255,255,0.12)" strokeWidth="2.2" fill="none" strokeLinecap="round" />

            {/* cute cheeks */}
            <circle className="mouse-cheek left-cheek" cx="70" cy="130" r="6" />
            <circle className="mouse-cheek right-cheek" cx="130" cy="130" r="6" />

            {/* NON text inside */}
            <text className={`non-text ${stage === 'text' || stage === 'complete' ? 'visible' : ''}`}
              x="100" y="150" textAnchor="middle" fontSize="20" fontWeight="700"
              letterSpacing="3" fill="#00f0f0">
              NON
            </text>

            {/* small inner stroke to add depth */}
            <path d="M64 110 C64 92, 84 76, 100 76 C116 76, 136 92, 136 110" stroke="rgba(255,255,255,0.03)" strokeWidth="2" fill="none" />
          </svg>
        </div>

        {/* Energy effects */}
        <div className={`energy-rings ${stage === 'forming' || stage === 'eyes' || stage === 'text' || stage === 'complete' ? 'active' : ''}`}>
          <div className="energy-ring ring-1" />
          <div className="energy-ring ring-2" />
          <div className="energy-ring ring-3" />
        </div>

        {/* Glow effect */}
        <div className={`glow-effect ${stage === 'eyes' || stage === 'text' || stage === 'complete' ? 'active' : ''}`} />

      </div>
    </div>
  );
};
