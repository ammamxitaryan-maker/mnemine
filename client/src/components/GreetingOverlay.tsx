import { useEffect, useState } from 'react';
import { AuthenticatedUser } from '@/types/telegram';

interface GreetingOverlayProps {
  user: AuthenticatedUser;
  onFadeOutComplete?: () => void;
}

export const GreetingOverlay = ({ user, onFadeOutComplete }: GreetingOverlayProps) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Show the greeting for 2 seconds, then start fading out
    const showTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 2000);

    // Complete the fade out after animation duration
    const fadeTimer = setTimeout(() => {
      onFadeOutComplete?.();
    }, 2500); // 2s show + 0.5s fade out

    // Handle keyboard navigation
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsFadingOut(true);
        // Complete fade out immediately on key press
        setTimeout(() => onFadeOutComplete?.(), 300);
      }
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [onFadeOutComplete]);

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm transition-all duration-500 will-change-transform ${
        isFadingOut ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="greeting-title"
    >
      <div className="text-center transform transition-all duration-300">
        <div className="mb-6">
          <h1 
            id="greeting-title"
            className="text-4xl sm:text-5xl font-bold text-blue-600 mb-2 animate-pulse"
          >
            Բարի առավոտ
          </h1>
          <p className="text-2xl sm:text-3xl text-purple-600 font-semibold animate-bounce">
            {user.firstName || 'A'}
          </p>
        </div>
        <button 
          onClick={() => {
            setIsFadingOut(true);
            setTimeout(() => onFadeOutComplete?.(), 300);
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 text-sm font-medium transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Skip greeting"
        >
          Пропустить
        </button>
      </div>
    </div>
  );
};
