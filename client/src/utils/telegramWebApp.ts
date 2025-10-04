/**
 * Telegram WebApp utility functions
 * Handles version compatibility and feature detection
 */

export interface TelegramWebApp {
  version: string;
  ready(): void;
  expand(): void;
  enableClosingConfirmation?(): void;
  disableVerticalSwipes?(): void;
  enableVerticalSwipes?(): void;
  headerColor?: string;
  backgroundColor?: string;
  isClosingConfirmationEnabled?: boolean;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}

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
export const getTelegramWebApp = (): TelegramWebApp | null => {
  const tg = window.Telegram?.WebApp;
  if (!tg) {
    console.warn('[TelegramWebApp] Telegram WebApp not found');
    return null;
  }

  // Ensure version is set
  if (!tg.version) {
    tg.version = '6.0';
    console.warn('[TelegramWebApp] Version not detected, defaulting to 6.0');
  }

  return tg;
};

/**
 * Safely initialize Telegram WebApp with version compatibility
 */
export const initializeTelegramWebApp = (): void => {
  const tg = getTelegramWebApp();
  if (!tg) return;

  const version = tg.version;

  // Always available features
  tg.ready();
  tg.expand();

  // Version-dependent features
  if (isFeatureSupported('closingConfirmation', version)) {
    tg.enableClosingConfirmation?.();
    tg.isClosingConfirmationEnabled = true;
  } else {
    console.log(`[TelegramWebApp] Closing confirmation not supported in version ${version}`);
  }

  if (isFeatureSupported('verticalSwipes', version)) {
    // Enable vertical swipes for scrolling
    tg.enableVerticalSwipes?.();
  } else {
    console.log(`[TelegramWebApp] Vertical swipes control not supported in version ${version}`);
  }

  console.log(`[TelegramWebApp] Initialized with version ${version}`);
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
  } else if (headerColor) {
    console.log(`[TelegramWebApp] Header color not supported in version ${version}`);
  }

  if (isFeatureSupported('backgroundColor', version) && backgroundColor) {
    tg.backgroundColor = backgroundColor;
  } else if (backgroundColor) {
    console.log(`[TelegramWebApp] Background color not supported in version ${version}`);
  }
};

/**
 * Check if running in Telegram WebApp environment
 */
export const isTelegramWebApp = (): boolean => {
  return !!window.Telegram?.WebApp;
};

/**
 * Get user data from Telegram WebApp
 */
export const getTelegramUser = () => {
  const tg = getTelegramWebApp();
  return tg ? (tg as any).initDataUnsafe?.user : null;
};

/**
 * Show alert in Telegram WebApp
 */
export const showTelegramAlert = (message: string): void => {
  const tg = getTelegramWebApp();
  if (tg && (tg as any).showAlert) {
    (tg as any).showAlert(message);
  } else {
    alert(message);
  }
};

/**
 * Show confirm dialog in Telegram WebApp
 */
export const showTelegramConfirm = (message: string, callback: (confirmed: boolean) => void): void => {
  const tg = getTelegramWebApp();
  if (tg && (tg as any).showConfirm) {
    (tg as any).showConfirm(message, callback);
  } else {
    const confirmed = confirm(message);
    callback(confirmed);
  }
};
