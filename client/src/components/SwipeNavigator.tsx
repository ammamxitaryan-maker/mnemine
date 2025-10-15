"use client";

import { useSwipeGestures } from '@/hooks/useSwipeGestures';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SwipeNavigatorProps {
  children: React.ReactNode;
  className?: string;
}

export const SwipeNavigator = ({ children, className = '' }: SwipeNavigatorProps) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { hapticLight } = useHapticFeedback();

  const swipeRef = useSwipeGestures({
    onSwipeLeft: () => {
      hapticLight();
      // Navigate to next page in sequence
      const currentPath = window.location.pathname;
      const routes = ['/', '/slots', '/lottery', '/wallet', '/profile'];
      const currentIndex = routes.indexOf(currentPath);
      if (currentIndex < routes.length - 1) {
        navigate(routes[currentIndex + 1]);
      }
    },
    onSwipeRight: () => {
      hapticLight();
      // Navigate to previous page in sequence
      const currentPath = window.location.pathname;
      const routes = ['/', '/slots', '/lottery', '/wallet', '/profile'];
      const currentIndex = routes.indexOf(currentPath);
      if (currentIndex > 0) {
        navigate(routes[currentIndex - 1]);
      }
    },
    threshold: 80
  });

  return (
    <div 
      ref={swipeRef}
      className={`swipe-navigator ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
      
      {/* Swipe indicator */}
      <div className="fixed top-1/2 left-4 transform -translate-y-1/2 z-40 opacity-0 hover:opacity-100 transition-opacity">
        <div className="w-1 h-16 bg-primary/30 rounded-full">
          <div className="w-1 h-8 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
      
      <div className="fixed top-1/2 right-4 transform -translate-y-1/2 z-40 opacity-0 hover:opacity-100 transition-opacity">
        <div className="w-1 h-16 bg-primary/30 rounded-full">
          <div className="w-1 h-8 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
};
