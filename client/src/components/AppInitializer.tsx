"use client";

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initializeTelegramWebApp, isTelegramWebApp } from '@/utils/telegramWebApp';

export const AppInitializer = () => {
  const location = useLocation();

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
      
      // Prevent context menu and selection
      document.addEventListener('contextmenu', (e) => e.preventDefault());
      document.addEventListener('selectstart', (e) => e.preventDefault());
      
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

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [location.pathname]);

  return null; // This component doesn't render anything itself
};