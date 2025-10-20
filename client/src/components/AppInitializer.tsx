"use client";

import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';
import { initializeTelegramWebApp, isTelegramWebApp } from '@/utils/telegramWebApp';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const AppInitializer = () => {
  const location = useLocation();

  // Initialize WebSocket notifications for real-time updates
  useWebSocketNotifications({
    enabled: true,
    autoConnect: true,
    reconnectOnFocus: true,
  });

  useEffect(() => {
    if (isTelegramWebApp()) {
      // Initialize Telegram Web App with version compatibility
      initializeTelegramWebApp();

      // Set up app lock functionality
      const preventClose = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '';
        return '';
      };

      // Add event listeners to prevent closing
      window.addEventListener('beforeunload', preventClose);

      // Prevent context menu and selection, but allow button interactions
      document.addEventListener('contextmenu', (e) => {
        // Allow context menu on buttons and interactive elements
        if (e.target instanceof HTMLElement &&
          (e.target.tagName === 'BUTTON' ||
            e.target.closest('button') ||
            e.target.closest('[role="button"]') ||
            e.target.closest('.cursor-pointer'))) {
          return;
        }

        // In dev mode, allow context menu everywhere
        const isLocalDev = window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('192.168.') ||
          window.location.hostname.includes('10.0.');

        if (isLocalDev) {
          return; // Allow context menu in dev mode
        }

        e.preventDefault();
      });

      document.addEventListener('selectstart', (e) => {
        // Allow selection on input fields and textareas
        if (e.target instanceof HTMLElement &&
          (e.target.tagName === 'INPUT' ||
            e.target.tagName === 'TEXTAREA' ||
            e.target.closest('input') ||
            e.target.closest('textarea'))) {
          return;
        }

        // In dev mode, allow text selection everywhere
        const isLocalDev = window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('192.168.') ||
          window.location.hostname.includes('10.0.');

        if (isLocalDev) {
          return; // Allow text selection in dev mode
        }

        e.preventDefault();
      });

      // Enable vertical scrolling but prevent horizontal scroll
      document.body.style.overscrollBehavior = 'auto';
      document.body.style.overflowX = 'hidden';
      document.body.style.overflowY = 'auto';

      // Cleanup function
      return () => {
        window.removeEventListener('beforeunload', preventClose);
      };
    } else {
      console.warn('[TelegramWebApp] Telegram WebApp object not found. Running in a non-Telegram environment.');
    }
  }, []);

  useEffect(() => {
    // Apply consistent styling for all pages
    document.body.classList.add('telegram-web-app');

    // Remove no-scroll class to ensure scrolling works on all pages
    document.body.classList.remove('no-scroll');

    // Check if we're in development mode (localhost)
    const isLocalDev = window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.') ||
      window.location.hostname.includes('10.0.');

    if (isLocalDev) {
      // Enable dev mode for text selection
      document.body.classList.add('dev-mode');
      console.log('[DEV] Development mode enabled - text selection allowed');
    } else {
      // Ensure dev mode is disabled in production
      document.body.classList.remove('dev-mode');
    }

    return () => {
      document.body.classList.remove('no-scroll');
      document.body.classList.remove('dev-mode');
    };
  }, [location.pathname]);

  return null; // This component doesn't render anything itself
};