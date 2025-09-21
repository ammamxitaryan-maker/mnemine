import React, { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface FullscreenSectionProps {
  children: ReactNode;
  isActive: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  className?: string;
}

export const FullscreenSection: React.FC<FullscreenSectionProps> = ({
  children,
  isActive,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      // Only trigger swipe if it's fast enough and far enough
      if (deltaTime < 300 && Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0 && onSwipeRight) {
            onSwipeRight();
          } else if (deltaX < 0 && onSwipeLeft) {
            onSwipeLeft();
          }
        } else {
          // Vertical swipe
          if (deltaY > 0 && onSwipeDown) {
            onSwipeDown();
          } else if (deltaY < 0 && onSwipeUp) {
            onSwipeUp();
          }
        }
      }

      touchStartRef.current = null;
    };

    const container = containerRef.current;
    if (container && isActive) {
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [isActive, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <motion.div
          ref={containerRef}
          className={`fixed inset-0 z-50 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-y-auto ${className}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{
            duration: 0.3,
            ease: [0.4, 0.0, 0.2, 1],
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          <div className="min-h-screen w-full">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Mobile-optimized container component
export const MobileContainer: React.FC<{ children: ReactNode; className?: string }> = ({
  children,
  className = ''
}) => {
  return (
    <div className={`w-full max-w-sm mx-auto px-4 py-6 ${className}`}>
      {children}
    </div>
  );
};

// Touch-friendly button component
export const TouchButton: React.FC<{
  children: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}> = ({ children, onClick, className = '', disabled = false }) => {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`touch-manipulation select-none ${className}`}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.1 }}
      style={{
        WebkitTapHighlightColor: 'transparent',
        touchAction: 'manipulation'
      }}
    >
      {children}
    </motion.button>
  );
};

// Swipe indicator component
export const SwipeIndicator: React.FC<{
  direction: 'left' | 'right' | 'up' | 'down';
  isVisible: boolean;
}> = ({ direction, isVisible }) => {
  const getIcon = () => {
    switch (direction) {
      case 'left': return '←';
      case 'right': return '→';
      case 'up': return '↑';
      case 'down': return '↓';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-60 bg-black/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center text-white text-2xl font-bold"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {getIcon()}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
