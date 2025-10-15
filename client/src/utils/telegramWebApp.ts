/**
 * Telegram WebApp utility functions
 * Handles version compatibility and feature detection
 */

// Use the TelegramWebApp type from types/telegram.d.ts

// Telegram types are already declared in types/telegram.d.ts

/**
 * Check if a feature is supported in the current Telegram WebApp version
 */
export const isFeatureSupported = (feature: string, version: string = '6.0'): boolean => {
  const versionMap: Record<string, string[]> = {
    'closingConfirmation': ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '7.0'],
    'verticalSwipes': ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '7.0'],
    'headerColor': ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '7.0'],
    'backgroundColor': ['6.1', '6.2', '6.3', '6.4', '6.5', '6.6', '6.7', '6.8', '6.9', '7.0'],
  };

  return versionMap[feature]?.includes(version) || false;
};

/**
 * Get the current Telegram WebApp instance with version checking
 */
export const getTelegramWebApp = (): any | null => {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.warn('[TelegramWebApp] Telegram WebApp not found');
    return null;
  }

  return tg;
};

/**
 * Safely initialize Telegram WebApp with version compatibility
 */
export const initializeTelegramWebApp = (): void => {
  const tg = getTelegramWebApp();
  if (!tg) return;

  // Always available features
  tg.ready();
  tg.expand();

  // Version-dependent features (using default version)
  if (isFeatureSupported('closingConfirmation', '6.0')) {
    tg.enableClosingConfirmation?.();
    tg.isClosingConfirmationEnabled = true;
  }

  if (isFeatureSupported('verticalSwipes', '6.0')) {
    // Enable vertical swipes for scrolling
    tg.enableVerticalSwipes?.();
  }
};

/**
 * Safely set Telegram WebApp colors with version checking
 */
export const setTelegramWebAppColors = (headerColor?: string, backgroundColor?: string): void => {
  const tg = getTelegramWebApp();
  if (!tg) return;

  const version = tg.version;

  if (isFeatureSupported('headerColor', version) && headerColor) {
    tg.headerColor = headerColor;
  }

  if (isFeatureSupported('backgroundColor', version) && backgroundColor) {
    tg.backgroundColor = backgroundColor;
  }
};

/**
 * Check if running in Telegram WebApp environment
 */
export const isTelegramWebApp = (): boolean => {
  return !!window.Telegram?.WebApp;
};

// Type definitions for Telegram WebApp
interface TelegramWebApp {
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  showAlert?: (message: string) => void;
  showConfirm?: (message: string, callback: (confirmed: boolean) => void) => void;
}



