"use client";

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const AppInitializer = () => {
  const location = useLocation();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      tg.isClosingConfirmationEnabled = true;
      tg.disableVerticalSwipes(); 

      // console.log('[TelegramWebApp] Ready, expanded, vertical swipes disabled, and closing confirmation enabled.'); // Removed log
    } else {
      console.warn('[TelegramWebApp] Telegram WebApp object not found. Running in a non-Telegram environment.');
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/') {
      document.body.classList.add('no-scroll');
      // console.log('[TelegramWebApp] Body scroll locked for path:', location.pathname); // Removed log
    } else {
      document.body.classList.remove('no-scroll');
      // console.log('[TelegramWebApp] Body scroll unlocked for path:', location.pathname); // Removed log
    }
    
    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [location.pathname]);

  return null; // This component doesn't render anything itself
};