import { useEffect } from 'react';
import { setTelegramWebAppColors, isTelegramWebApp, getTelegramWebApp } from '@/utils/telegramWebApp';

const ViewportOptimizer: React.FC = () => {
  useEffect(() => {
    // Optimize viewport for Telegram Web App
    const setViewportMeta = () => {
      const viewport = document.querySelector('meta[name="viewport"]');
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
      } else {
        const meta = document.createElement('meta');
        meta.name = 'viewport';
        meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
        document.head.appendChild(meta);
      }
    };

    // Set viewport meta tag
    setViewportMeta();

    // Handle Telegram Web App specific optimizations
    if (isTelegramWebApp()) {
      // Set colors with version compatibility
      setTelegramWebAppColors('#1f2937', '#111827'); // gray-800, gray-900
      
      // Enable vertical swipes for scrolling if supported
      const tg = getTelegramWebApp();
      if (tg && tg.version !== '6.0') {
        tg.enableVerticalSwipes?.();
      }
    }

    // Prevent zoom on double tap for mobile
    let lastTouchEnd = 0;
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    document.addEventListener('touchend', preventZoom, { passive: false });

    return () => {
      document.removeEventListener('touchend', preventZoom);
    };
  }, []);

  return null;
};

export { ViewportOptimizer };
