import { useLoading } from '@/contexts/LoadingContext';
import React, { useEffect, useRef, useState } from 'react';

interface LoadingAnimationProps {
  onComplete?: () => void;
  duration?: number;
  theme?: 'default' | 'dark' | 'neon' | 'premium' | 'cyberpunk' | 'minimalist';
  showTips?: boolean;
  showMetrics?: boolean;
  allowSkip?: boolean;
  animationStyle?: 'smooth' | 'dynamic' | 'dramatic' | 'elegant';
  brandMode?: 'corporate' | 'creative' | 'tech' | 'luxury';
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  onComplete,
  duration = 4000,
  theme = 'default',
  showTips = true,
  showMetrics = true,
  allowSkip = true,
  animationStyle = 'smooth',
  brandMode = 'tech'
}) => {
  const { setAnimationComplete, loadingState } = useLoading();
  const [isVisible, setIsVisible] = useState(false);
  const [showMouse, setShowMouse] = useState(false);
  const [showSecondN, setShowSecondN] = useState(false);
  const [winkActive, setWinkActive] = useState(false);
  const [noseWiggle, setNoseWiggle] = useState(false);
  const [showMine, setShowMine] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Initializing...');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number; size: number }>>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [showGlow, setShowGlow] = useState(false);
  const [currentTip, setCurrentTip] = useState(0);
  const [showSkipOption, setShowSkipOption] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    memoryUsage: 0,
    networkLatency: 0
  });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [loadingSequence, setLoadingSequence] = useState(0);
  const [particleSystem, setParticleSystem] = useState<Array<{
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    size: number;
    color: string;
    type: 'sparkle' | 'glow' | 'trail' | 'burst';
  }>>([]);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [brandElements, setBrandElements] = useState({
    logo: false,
    tagline: false,
    features: false,
    completion: false
  });
  const animationRef = useRef<number>();
  const progressRef = useRef<number>();
  const tipIntervalRef = useRef<NodeJS.Timeout>();
  const particleRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const masterAnimationRef = useRef<number>();

  useEffect(() => {
    // Generate floating particles for background
    const generateParticles = () => {
      const newParticles = Array.from({ length: 15 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        delay: Math.random() * 3,
        size: Math.random() * 4 + 2
      }));
      setParticles(newParticles);
    };

    generateParticles();

    // Master-level particle system with advanced physics
    const createParticle = (x: number, y: number, type: 'sparkle' | 'glow' | 'trail' | 'burst' = 'sparkle') => {
      const colorPalettes = {
        default: ['#00D4FF', '#8EF0FF', '#FF69B4', '#00FF88', '#FF00FF'],
        premium: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'],
        cyberpunk: ['#FF0080', '#00FFFF', '#FFFF00', '#FF00FF', '#00FF00'],
        minimalist: ['#FFFFFF', '#E0E0E0', '#B0B0B0', '#808080', '#404040']
      };

      const colors = colorPalettes[theme as keyof typeof colorPalettes] || colorPalettes.default;
      const particleTypes = {
        sparkle: { size: Math.random() * 4 + 2, life: 1, speed: 2 },
        glow: { size: Math.random() * 8 + 4, life: 1.5, speed: 1 },
        trail: { size: Math.random() * 3 + 1, life: 0.8, speed: 3 },
        burst: { size: Math.random() * 12 + 6, life: 2, speed: 4 }
      };

      const config = particleTypes[type];

      return {
        id: Date.now() + Math.random(),
        x,
        y,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        life: config.life,
        size: config.size,
        color: colors[Math.floor(Math.random() * colors.length)],
        type
      };
    };

    const updateParticleSystem = () => {
      setParticleSystem(prev => {
        const updated = prev
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            life: particle.life - 0.02,
            vx: particle.vx * 0.98,
            vy: particle.vy * 0.98
          }))
          .filter(particle => particle.life > 0);

        // Add new particles occasionally
        if (Math.random() < 0.1 && updated.length < 50) {
          const newParticle = createParticle(
            Math.random() * (containerRef.current?.clientWidth || 800),
            Math.random() * (containerRef.current?.clientHeight || 600)
          );
          updated.push(newParticle);
        }

        return updated;
      });
    };

    particleRef.current = setInterval(updateParticleSystem, 50);

    // Mouse tracking for interactive effects
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });

        // Create particles on mouse movement with different types
        if (Math.random() < 0.4) {
          const particleType = Math.random() < 0.3 ? 'trail' : 'sparkle';
          const newParticle = createParticle(
            e.clientX - rect.left,
            e.clientY - rect.top,
            particleType
          );
          setParticleSystem(prev => [...prev, newParticle]);
        }
      }
    };

    // Performance metrics simulation
    const updatePerformanceMetrics = () => {
      setPerformanceMetrics(prev => ({
        loadTime: prev.loadTime + Math.random() * 50,
        memoryUsage: Math.random() * 100,
        networkLatency: Math.random() * 200
      }));
    };

    const metricsInterval = setInterval(updatePerformanceMetrics, 1000);

    // Loading tips rotation
    const loadingTips = [
      '💡 Tip: Keep your browser updated for best performance',
      '🔒 Your data is encrypted and secure',
      '⚡ Fast mining requires stable internet connection',
      '🎯 Start with small investments to learn the platform',
      '📊 Monitor your earnings regularly for best results',
      '🛡️ Never share your wallet credentials with anyone'
    ];

    const rotateTips = () => {
      setCurrentTip(prev => (prev + 1) % loadingTips.length);
    };

    tipIntervalRef.current = setInterval(rotateTips, 3000);

    // Master-level loading sequences with brand personality
    const loadingSequences = {
      corporate: [
        'Initializing enterprise systems...',
        'Establishing secure connections...',
        'Loading business intelligence...',
        'Preparing dashboard interface...',
        'Validating user credentials...',
        'System ready for deployment...'
      ],
      creative: [
        'Awakening creative algorithms...',
        'Loading inspiration modules...',
        'Synchronizing artistic vision...',
        'Preparing design canvas...',
        'Calibrating color palettes...',
        'Creative engine online...'
      ],
      tech: [
        'Initializing quantum processors...',
        'Calibrating neural networks...',
        'Optimizing blockchain connections...',
        'Synchronizing with mining pools...',
        'Validating cryptographic signatures...',
        'Establishing secure channels...'
      ],
      luxury: [
        'Preparing premium experience...',
        'Loading exclusive features...',
        'Synchronizing luxury protocols...',
        'Calibrating elite performance...',
        'Validating VIP access...',
        'Premium service activated...'
      ]
    };

    const currentSequences = loadingSequences[brandMode as keyof typeof loadingSequences] || loadingSequences.tech;

    const sequenceInterval = setInterval(() => {
      setLoadingSequence(prev => (prev + 1) % currentSequences.length);
    }, 2000);

    // Add mouse event listeners
    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
    }

    // Show skip option after 2 seconds (if allowed)
    const skipTimer = allowSkip ? setTimeout(() => {
      setShowSkipOption(true);
    }, 2000) : null;

    // Enhanced progress animation with loading messages
    const loadingMessages = [
      'Initializing...',
      'Loading assets...',
      'Connecting to network...',
      'Preparing interface...',
      'Almost ready...',
      'Complete!'
    ];

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 12 + 3;
        if (newProgress >= 100) {
          clearInterval(progressInterval);
          setLoadingMessage('Complete!');
          return 100;
        }

        // Update loading message based on progress
        const messageIndex = Math.floor((newProgress / 100) * loadingMessages.length);
        if (messageIndex < loadingMessages.length - 1) {
          setLoadingMessage(loadingMessages[messageIndex]);
        }

        return newProgress;
      });
    }, 250);

    // First N (Right Ear) appears with a twitch
    const showFirstNTimer = setTimeout(() => {
      setIsVisible(true);
    }, 200);

    // Mouse Head (O) fades in with a bounce
    const showMouseHeadTimer = setTimeout(() => {
      setShowMouse(true);
    }, 1000);

    // Second N (Left Ear) slides in with a tilt
    const showSecondNTimer = setTimeout(() => {
      setShowSecondN(true);
    }, 1600);

    // Nose wiggle for extra personality
    const noseWiggleTimer = setTimeout(() => {
      setNoseWiggle(true);
      setTimeout(() => setNoseWiggle(false), 400);
    }, 2000);

    // Wink animation, slow and flirty
    const winkTimer = setTimeout(() => {
      setWinkActive(true);
      setTimeout(() => setWinkActive(false), 800);
    }, 2400);

    // Show MINE text with glow
    const showMineTimer = setTimeout(() => {
      setShowMine(true);
    }, 3000);

    // Show glow effect
    const showGlowTimer = setTimeout(() => {
      setShowGlow(true);
    }, 3500);

    // Complete animation with a bang
    const completeTimer = setTimeout(() => {
      setAnimationComplete(true);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(showFirstNTimer);
      clearTimeout(showMouseHeadTimer);
      clearTimeout(showSecondNTimer);
      clearTimeout(noseWiggleTimer);
      clearTimeout(winkTimer);
      clearTimeout(showMineTimer);
      clearTimeout(showGlowTimer);
      if (skipTimer) clearTimeout(skipTimer);
      clearTimeout(completeTimer);
      clearInterval(progressInterval);
      clearInterval(metricsInterval);
      clearInterval(sequenceInterval);
      if (tipIntervalRef.current) {
        clearInterval(tipIntervalRef.current);
      }
      if (particleRef.current) {
        clearInterval(particleRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (progressRef.current) {
        cancelAnimationFrame(progressRef.current);
      }
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, [duration, onComplete, setAnimationComplete]);

  const handleSkipAnimation = () => {
    setAnimationComplete(true);
    if (onComplete) {
      onComplete();
    }
  };

  const loadingTips = [
    '💡 Tip: Keep your browser updated for best performance',
    '🔒 Your data is encrypted and secure',
    '⚡ Fast mining requires stable internet connection',
    '🎯 Start with small investments to learn the platform',
    '📊 Monitor your earnings regularly for best results',
    '🛡️ Never share your wallet credentials with anyone'
  ];

  const loadingSequences = {
    corporate: [
      'Initializing enterprise systems...',
      'Establishing secure connections...',
      'Loading business intelligence...',
      'Preparing dashboard interface...',
      'Validating user credentials...',
      'System ready for deployment...'
    ],
    creative: [
      'Awakening creative algorithms...',
      'Loading inspiration modules...',
      'Synchronizing artistic vision...',
      'Preparing design canvas...',
      'Calibrating color palettes...',
      'Creative engine online...'
    ],
    tech: [
      'Initializing quantum processors...',
      'Calibrating neural networks...',
      'Optimizing blockchain connections...',
      'Synchronizing with mining pools...',
      'Validating cryptographic signatures...',
      'Establishing secure channels...'
    ],
    luxury: [
      'Preparing premium experience...',
      'Loading exclusive features...',
      'Synchronizing luxury protocols...',
      'Calibrating elite performance...',
      'Validating VIP access...',
      'Premium service activated...'
    ]
  };

  const currentSequences = loadingSequences[brandMode as keyof typeof loadingSequences] || loadingSequences.tech;

  return (
    <div
      ref={containerRef}
      className={`professional-loading-screen ${theme !== 'default' ? `theme-${theme}` : ''} ${isDragging ? 'dragging' : ''} animation-${animationStyle} brand-${brandMode}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsDragging(true)}
      onMouseUp={() => setIsDragging(false)}
      role="progressbar"
      aria-label="Loading application"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      style={{
        '--mouse-x': `${mousePosition.x}px`,
        '--mouse-y': `${mousePosition.y}px`
      } as React.CSSProperties}
    >
      {/* Animated Background Particles */}
      <div className="particles-background">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="floating-particle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              width: `${particle.size}px`,
              height: `${particle.size}px`
            }}
          />
        ))}
      </div>

      {/* Advanced Particle System */}
      <div className="particle-system">
        {particleSystem.map((particle) => (
          <div
            key={particle.id}
            className="physics-particle"
            data-type={particle.type}
            style={{
              left: `${particle.x}px`,
              top: `${particle.y}px`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              opacity: particle.life,
              transform: `scale(${particle.life})`
            }}
          />
        ))}
      </div>

      {/* Mouse Trail Effect */}
      <div
        className="mouse-trail"
        style={{
          left: `${mousePosition.x}px`,
          top: `${mousePosition.y}px`
        }}
      />

      {/* Energy Rings */}
      <div className={`energy-rings ${showGlow ? 'active' : ''}`}>
        <div className="energy-ring ring-1"></div>
        <div className="energy-ring ring-2"></div>
        <div className="energy-ring ring-3"></div>
      </div>

      {/* Glow Effect */}
      <div className={`glow-effect ${showGlow ? 'active' : ''}`}></div>

      <div className="loading-content">
        {/* Professional Mouse Logo */}
        <div className={`brand-logo ${isVisible ? 'logo' : ''}`}>
          {/* Right Ear (First N) */}
          <div className="letter-n">
            <div className="n-stroke n-left-vertical"></div>
            <div className="n-stroke n-right-vertical"></div>
            <div className="n-stroke n-diagonal"></div>
          </div>

          {/* Mouse Head (O) */}
          <div className={`mouse-icon ${showMouse ? 'visible' : ''} ${isHovered ? 'hovered' : ''}`}>
            <svg className="mouse-svg" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="neonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#00D4FF', stopOpacity: 1 }} />
                  <stop offset="50%" style={{ stopColor: '#8EF0FF', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#0099CC', stopOpacity: 1 }} />
                </linearGradient>
                <linearGradient id="cheekGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#FF69B4', stopOpacity: 0.8 }} />
                  <stop offset="100%" style={{ stopColor: '#FF1493', stopOpacity: 0.6 }} />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Mouse Head Outline */}
              <ellipse cx="50" cy="50" rx="45" ry="40" className="neon" />

              {/* Mouse Ears */}
              <ellipse cx="30" cy="25" rx="12" ry="18" className="neon" />
              <ellipse cx="70" cy="25" rx="12" ry="18" className="neon" />

              {/* Eyes */}
              <circle cx="40" cy="45" r="6" className="eye" />
              <circle cx="60" cy="45" r="6" className="eye">
                <line x1="55" y1="45" x2="65" y2="45" stroke="#000" strokeWidth="2" className={`wink-line ${winkActive ? 'wink-active' : ''}`} />
              </circle>

              {/* Nose */}
              <ellipse cx="50" cy="55" rx="3" ry="2" className={`nose ${noseWiggle ? 'wiggle' : ''}`} />

              {/* Mouth */}
              <path d="M 45 60 Q 50 65 55 60" stroke="#8EF0FF" strokeWidth="2" fill="none" />

              {/* Cheeks */}
              <circle cx="35" cy="55" r="4" className="mouse-cheek left-cheek" />
              <circle cx="65" cy="55" r="4" className="mouse-cheek right-cheek" />
            </svg>
          </div>

          {/* Left Ear (Second N) */}
          <div className="letter-n">
            <div className="n-stroke n-left-vertical"></div>
            <div className="n-stroke n-right-vertical"></div>
            <div className="n-stroke n-diagonal"></div>
          </div>
        </div>

        {/* Professional Brand Text */}
        <div className={`brand-text ${showMine ? 'visible' : ''}`}>
          <span className="brand-letter">M</span>
          <span className="brand-letter">I</span>
          <span className="brand-letter">N</span>
          <span className="brand-letter">E</span>
        </div>

        {/* Professional Subtitle */}
        <div className={`brand-subtitle ${showMine ? 'visible' : ''}`}>
          Crypto Mining Platform
        </div>

        {/* Enhanced Progress Indicator */}
        <div className="loading-indicator">
          <div className="progress-container">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
              <div className="progress-glow" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-text">
              {loadingMessage} {progress < 100 ? `${Math.round(progress)}%` : ''}
            </div>
            <div className="sequence-text">
              {currentSequences[loadingSequence]}
            </div>
          </div>

          {/* Professional Loading Dots */}
          <div className="loading-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>

          {/* Loading Stats */}
          <div className="loading-stats">
            <div className="stat-item">
              <span className="stat-label">Performance</span>
              <span className="stat-value">Optimal</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Security</span>
              <span className="stat-value">Enabled</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Network</span>
              <span className="stat-value">Connected</span>
            </div>
          </div>

          {/* Performance Metrics */}
          {showMetrics && (
            <div className="performance-metrics">
              <div className="metric-item">
                <span className="metric-label">Load Time</span>
                <span className="metric-value">{Math.round(performanceMetrics.loadTime)}ms</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Memory</span>
                <span className="metric-value">{Math.round(performanceMetrics.memoryUsage)}%</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Latency</span>
                <span className="metric-value">{Math.round(performanceMetrics.networkLatency)}ms</span>
              </div>
            </div>
          )}

          {/* Loading Tips */}
          {showTips && (
            <div className="loading-tips">
              <div className="tip-content">
                {loadingTips[currentTip]}
              </div>
              <div className="tip-indicators">
                {loadingTips.map((_, index) => (
                  <div
                    key={index}
                    className={`tip-dot ${index === currentTip ? 'active' : ''}`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Skip Option */}
          {allowSkip && showSkipOption && (
            <div className="skip-option">
              <button
                className="skip-button"
                onClick={handleSkipAnimation}
                aria-label="Skip loading animation"
              >
                Skip Animation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
