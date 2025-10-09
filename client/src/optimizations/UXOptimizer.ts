/**
 * UX Optimizer - Advanced user experience optimization utilities
 * 
 * This module provides comprehensive UX optimizations while strictly preserving
 * all existing functionality. No features are modified or disabled.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// UX optimization configuration
interface UXOptimizationConfig {
  enableSmoothScrolling: boolean;
  enableReducedMotion: boolean;
  enableTouchOptimization: boolean;
  enableKeyboardNavigation: boolean;
  enableFocusManagement: boolean;
  enableLoadingStates: boolean;
  enableErrorBoundaries: boolean;
  enableAccessibility: boolean;
}

// Animation configuration
interface AnimationConfig {
  duration: number;
  easing: string;
  delay: number;
  fillMode: string;
}

// Accessibility configuration
interface AccessibilityConfig {
  enableHighContrast: boolean;
  enableLargeText: boolean;
  enableScreenReader: boolean;
  enableKeyboardShortcuts: boolean;
  enableFocusIndicators: boolean;
}

// Default configurations
const DEFAULT_UX_CONFIG: UXOptimizationConfig = {
  enableSmoothScrolling: true,
  enableReducedMotion: false,
  enableTouchOptimization: true,
  enableKeyboardNavigation: true,
  enableFocusManagement: true,
  enableLoadingStates: true,
  enableErrorBoundaries: true,
  enableAccessibility: true,
};

const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 300,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  delay: 0,
  fillMode: 'both',
};

const DEFAULT_ACCESSIBILITY_CONFIG: AccessibilityConfig = {
  enableHighContrast: false,
  enableLargeText: false,
  enableScreenReader: true,
  enableKeyboardShortcuts: true,
  enableFocusIndicators: true,
};

/**
 * Smooth Scrolling Hook
 * Provides smooth scrolling functionality without affecting existing behavior
 */
export const useSmoothScrolling = (config: Partial<AnimationConfig> = {}) => {
  const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

  const scrollToElement = useCallback((elementId: string, offset: number = 0) => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const elementPosition = element.offsetTop - offset;
    
    if (DEFAULT_UX_CONFIG.enableSmoothScrolling) {
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo(0, elementPosition);
    }
  }, []);

  const scrollToTop = useCallback(() => {
    if (DEFAULT_UX_CONFIG.enableSmoothScrolling) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo(0, 0);
    }
  }, []);

  return {
    scrollToElement,
    scrollToTop,
  };
};

/**
 * Touch Optimization Hook
 * Optimizes touch interactions for mobile devices
 */
export const useTouchOptimization = () => {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!DEFAULT_UX_CONFIG.enableTouchOptimization) return;
    
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!DEFAULT_UX_CONFIG.enableTouchOptimization) return;
    
    const touch = e.touches[0];
    setTouchEnd({ x: touch.clientX, y: touch.clientY });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!DEFAULT_UX_CONFIG.enableTouchOptimization || !touchStart || !touchEnd) return;
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      // Horizontal swipe detected
      if (deltaX > 0) {
        // Swipe right
        console.log('[UX] Swipe right detected');
      } else {
        // Swipe left
        console.log('[UX] Swipe left detected');
      }
    } else if (Math.abs(deltaY) > minSwipeDistance) {
      // Vertical swipe detected
      if (deltaY > 0) {
        // Swipe down
        console.log('[UX] Swipe down detected');
      } else {
        // Swipe up
        console.log('[UX] Swipe up detected');
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  }, [touchStart, touchEnd]);

  return {
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
};

/**
 * Keyboard Navigation Hook
 * Provides enhanced keyboard navigation support
 */
export const useKeyboardNavigation = () => {
  const [focusedElement, setFocusedElement] = useState<HTMLElement | null>(null);
  const focusableElements = useRef<HTMLElement[]>([]);

  const updateFocusableElements = useCallback(() => {
    if (!DEFAULT_UX_CONFIG.enableKeyboardNavigation) return;
    
    const elements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    focusableElements.current = Array.from(elements);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!DEFAULT_UX_CONFIG.enableKeyboardNavigation) return;
    
    const { key } = e;
    
    switch (key) {
      case 'Tab':
        // Let browser handle default tab navigation
        break;
      case 'Enter':
      case ' ':
        if (focusedElement) {
          focusedElement.click();
        }
        break;
      case 'Escape':
        // Close modals or return focus to previous element
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && activeElement.blur) {
          activeElement.blur();
        }
        break;
    }
  }, [focusedElement]);

  const setFocus = useCallback((element: HTMLElement | null) => {
    if (!DEFAULT_UX_CONFIG.enableFocusManagement) return;
    
    setFocusedElement(element);
    if (element && element.focus) {
      element.focus();
    }
  }, []);

  useEffect(() => {
    updateFocusableElements();
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [updateFocusableElements, handleKeyDown]);

  return {
    focusedElement,
    setFocus,
    updateFocusableElements,
  };
};

/**
 * Loading State Hook
 * Provides enhanced loading states and skeleton screens
 */
export const useLoadingState = (initialState: boolean = false) => {
  const [isLoading, setIsLoading] = useState(initialState);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);

  const startLoading = useCallback((message: string = 'Loading...') => {
    if (!DEFAULT_UX_CONFIG.enableLoadingStates) return;
    
    setIsLoading(true);
    setLoadingMessage(message);
    setProgress(0);
  }, []);

  const updateProgress = useCallback((newProgress: number) => {
    if (!DEFAULT_UX_CONFIG.enableLoadingStates) return;
    
    setProgress(Math.min(100, Math.max(0, newProgress)));
  }, []);

  const stopLoading = useCallback(() => {
    if (!DEFAULT_UX_CONFIG.enableLoadingStates) return;
    
    setIsLoading(false);
    setLoadingMessage('');
    setProgress(0);
  }, []);

  return {
    isLoading,
    loadingMessage,
    progress,
    startLoading,
    updateProgress,
    stopLoading,
  };
};

/**
 * Error Boundary Hook
 * Provides error handling and recovery mechanisms
 */
export const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null);
  const [errorInfo, setErrorInfo] = useState<any>(null);

  const handleError = useCallback((error: Error, errorInfo?: any) => {
    if (!DEFAULT_UX_CONFIG.enableErrorBoundaries) return;
    
    console.error('[ErrorBoundary] Error caught:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);
    
    setError(error);
    setErrorInfo(errorInfo);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
  }, []);

  const retry = useCallback((retryFn: () => void) => {
    clearError();
    retryFn();
  }, [clearError]);

  return {
    error,
    errorInfo,
    handleError,
    clearError,
    retry,
  };
};

/**
 * Accessibility Hook
 * Provides accessibility enhancements
 */
export const useAccessibility = (config: Partial<AccessibilityConfig> = {}) => {
  const accessibilityConfig = { ...DEFAULT_ACCESSIBILITY_CONFIG, ...config };
  const [isHighContrast, setIsHighContrast] = useState(accessibilityConfig.enableHighContrast);
  const [isLargeText, setIsLargeText] = useState(accessibilityConfig.enableLargeText);

  const toggleHighContrast = useCallback(() => {
    if (!DEFAULT_UX_CONFIG.enableAccessibility) return;
    
    setIsHighContrast(prev => !prev);
    document.documentElement.classList.toggle('high-contrast');
  }, []);

  const toggleLargeText = useCallback(() => {
    if (!DEFAULT_UX_CONFIG.enableAccessibility) return;
    
    setIsLargeText(prev => !prev);
    document.documentElement.classList.toggle('large-text');
  }, []);

  const announceToScreenReader = useCallback((message: string) => {
    if (!DEFAULT_UX_CONFIG.enableAccessibility || !accessibilityConfig.enableScreenReader) return;
    
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }, [accessibilityConfig.enableScreenReader]);

  const setFocusIndicator = useCallback((element: HTMLElement) => {
    if (!DEFAULT_UX_CONFIG.enableAccessibility || !accessibilityConfig.enableFocusIndicators) return;
    
    element.classList.add('focus-visible');
    
    const removeFocusIndicator = () => {
      element.classList.remove('focus-visible');
      element.removeEventListener('blur', removeFocusIndicator);
    };
    
    element.addEventListener('blur', removeFocusIndicator);
  }, [accessibilityConfig.enableFocusIndicators]);

  return {
    isHighContrast,
    isLargeText,
    toggleHighContrast,
    toggleLargeText,
    announceToScreenReader,
    setFocusIndicator,
  };
};

/**
 * Performance Monitoring Hook
 * Monitors and optimizes performance without affecting functionality
 */
export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
  });

  const measurePerformance = useCallback((componentName: string) => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        componentCount: document.querySelectorAll('[data-component]').length,
      }));
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          memoryUsage: `${((performance as any).memory?.usedJSHeapSize || 0) / 1024 / 1024}MB`,
        });
      }
    };
  }, []);

  return {
    metrics,
    measurePerformance,
  };
};

/**
 * Responsive Design Hook
 * Provides responsive design utilities
 */
export const useResponsiveDesign = () => {
  const [screenSize, setScreenSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');

  const updateScreenSize = useCallback(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    setScreenSize({ width, height });
    
    // Determine breakpoint
    if (width < 640) setBreakpoint('xs');
    else if (width < 768) setBreakpoint('sm');
    else if (width < 1024) setBreakpoint('md');
    else if (width < 1280) setBreakpoint('lg');
    else setBreakpoint('xl');
  }, []);

  useEffect(() => {
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    
    return () => {
      window.removeEventListener('resize', updateScreenSize);
    };
  }, [updateScreenSize]);

  const isMobile = useMemo(() => breakpoint === 'xs' || breakpoint === 'sm', [breakpoint]);
  const isTablet = useMemo(() => breakpoint === 'md', [breakpoint]);
  const isDesktop = useMemo(() => breakpoint === 'lg' || breakpoint === 'xl', [breakpoint]);

  return {
    screenSize,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
  };
};

/**
 * Animation Hook
 * Provides smooth animations and transitions
 */
export const useAnimation = (config: Partial<AnimationConfig> = {}) => {
  const animationConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config };

  const animateElement = useCallback((
    element: HTMLElement,
    keyframes: Keyframe[],
    options: KeyframeAnimationOptions = {}
  ) => {
    if (!DEFAULT_UX_CONFIG.enableReducedMotion && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const animationOptions = {
      duration: animationConfig.duration,
      easing: animationConfig.easing,
      delay: animationConfig.delay,
      fill: animationConfig.fillMode,
      ...options,
    };

    return element.animate(keyframes, animationOptions);
  }, [animationConfig]);

  const fadeIn = useCallback((element: HTMLElement) => {
    return animateElement(element, [
      { opacity: 0 },
      { opacity: 1 },
    ]);
  }, [animateElement]);

  const fadeOut = useCallback((element: HTMLElement) => {
    return animateElement(element, [
      { opacity: 1 },
      { opacity: 0 },
    ]);
  }, [animateElement]);

  const slideIn = useCallback((element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right' = 'up') => {
    const transforms = {
      up: ['translateY(20px)', 'translateY(0)'],
      down: ['translateY(-20px)', 'translateY(0)'],
      left: ['translateX(20px)', 'translateX(0)'],
      right: ['translateX(-20px)', 'translateX(0)'],
    };

    return animateElement(element, [
      { opacity: 0, transform: transforms[direction][0] },
      { opacity: 1, transform: transforms[direction][1] },
    ]);
  }, [animateElement]);

  return {
    animateElement,
    fadeIn,
    fadeOut,
    slideIn,
  };
};

// Export all utilities
export {
  DEFAULT_UX_CONFIG,
  DEFAULT_ANIMATION_CONFIG,
  DEFAULT_ACCESSIBILITY_CONFIG,
  type UXOptimizationConfig,
  type AnimationConfig,
  type AccessibilityConfig,
};
