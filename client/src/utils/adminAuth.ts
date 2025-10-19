/**
 * Centralized admin authentication utilities
 */

import { ADMIN_CONFIG } from '@/config/adminConfig';

// Types for authentication
export interface AuthState {
  isVerified: boolean;
  lastVerified: string | null;
  attempts: number;
  lockedUntil: string | null;
}

export interface LoginAttempt {
  timestamp: string;
  success: boolean;
  ip?: string;
}

/**
 * Get admin Telegram IDs from environment or fallback to default
 */
export const getAdminTelegramIds = (): string[] => {
  return ADMIN_CONFIG.TELEGRAM_IDS;
};

/**
 * Check if a user is an admin based on their Telegram ID
 */
export const isAdminUser = (telegramId: string): boolean => {
  const adminIds = getAdminTelegramIds();
  return adminIds.includes(telegramId);
};

/**
 * Get current authentication state
 */
export const getAuthState = (): AuthState => {
  const stored = sessionStorage.getItem('admin_auth_state');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // If data is corrupted, reset
      clearAuthState();
    }
  }

  return {
    isVerified: false,
    lastVerified: null,
    attempts: 0,
    lockedUntil: null,
  };
};

/**
 * Save authentication state
 */
export const setAuthState = (state: Partial<AuthState>): void => {
  const currentState = getAuthState();
  const newState = { ...currentState, ...state };
  sessionStorage.setItem('admin_auth_state', JSON.stringify(newState));
  console.log('[ADMIN_AUTH] Auth state updated:', newState);
};

/**
 * Check if admin password is verified in current session
 */
export const isAdminPasswordVerified = (): boolean => {
  const state = getAuthState();

  // Check if session has expired
  if (state.lastVerified) {
    const lastVerified = new Date(state.lastVerified);
    const now = new Date();
    const timeDiff = now.getTime() - lastVerified.getTime();

    if (timeDiff > ADMIN_CONFIG.SESSION.TIMEOUT) {
      console.log('[ADMIN_AUTH] Session expired, clearing verification');
      clearAuthState();
      return false;
    }
  }

  // Check if account is locked
  if (state.lockedUntil) {
    const lockUntil = new Date(state.lockedUntil);
    const now = new Date();

    if (now < lockUntil) {
      console.log('[ADMIN_AUTH] Account is locked until:', state.lockedUntil);
      return false;
    } else {
      // Lock has expired, reset
      setAuthState({ lockedUntil: null, attempts: 0 });
    }
  }

  const verified = state.isVerified;
  console.log('[ADMIN_AUTH] Password verified:', verified);
  return verified;
};

/**
 * Set admin password as verified
 */
export const setAdminPasswordVerified = (): void => {
  setAuthState({
    isVerified: true,
    lastVerified: new Date().toISOString(),
    attempts: 0,
    lockedUntil: null,
  });

  // Create and store admin token
  createAdminToken();

  console.log('[ADMIN_AUTH] Password verification set to true');
};

/**
 * Create admin token
 */
export const createAdminToken = (): string | null => {
  try {
    // Get user data from Telegram
    const tg = window.Telegram?.WebApp;
    if (tg?.initData) {
      const urlParams = new URLSearchParams(tg.initData);
      const userStr = urlParams.get('user');
      if (userStr) {
        const user = JSON.parse(userStr);

        // Create a simple admin token (in production, use proper JWT)
        const adminToken = btoa(JSON.stringify({
          isAdmin: true,
          telegramId: user.id.toString(),
          firstName: user.first_name,
          username: user.username,
          timestamp: Date.now()
        }));

        localStorage.setItem('admin_token', adminToken);
        console.log('[ADMIN_AUTH] Admin token created and stored');
        return adminToken;
      }
    }
  } catch (error) {
    console.error('[ADMIN_AUTH] Error creating admin token:', error);
  }
  return null;
};

/**
 * Clear admin password verification (logout)
 */
export const clearAdminPasswordVerification = (): void => {
  clearAuthState();
  localStorage.removeItem('admin_token');
  console.log('[ADMIN_AUTH] Password verification cleared');
};

/**
 * Clear all authentication data
 */
export const clearAuthState = (): void => {
  sessionStorage.removeItem('admin_auth_state');
  console.log('[ADMIN_AUTH] Auth state cleared');
};

/**
 * Verify admin password
 */
export const verifyAdminPassword = (password: string): boolean => {
  const state = getAuthState();

  // Check if account is locked
  if (state.lockedUntil) {
    const lockUntil = new Date(state.lockedUntil);
    const now = new Date();

    if (now < lockUntil) {
      console.log('[ADMIN_AUTH] Account is locked, cannot verify password');
      return false;
    }
  }

  const isValid = password === ADMIN_CONFIG.PASSWORD;

  if (isValid) {
    // Successful authentication
    setAuthState({
      isVerified: true,
      lastVerified: new Date().toISOString(),
      attempts: 0,
      lockedUntil: null,
    });
    console.log('[ADMIN_AUTH] Password verification successful');
  } else {
    // Failed attempt
    const newAttempts = state.attempts + 1;
    let lockedUntil: string | null = null;

    if (newAttempts >= ADMIN_CONFIG.SECURITY.MAX_LOGIN_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + ADMIN_CONFIG.SECURITY.LOCKOUT_DURATION).toISOString();
      console.log('[ADMIN_AUTH] Account locked due to too many failed attempts');
    }

    setAuthState({
      attempts: newAttempts,
      lockedUntil,
    });
    console.log('[ADMIN_AUTH] Password verification failed, attempts:', newAttempts);
  }

  return isValid;
};

/**
 * Get lockout information
 */
export const getLockoutInfo = (): { isLocked: boolean; remainingTime?: number } => {
  const state = getAuthState();

  if (!state.lockedUntil) {
    return { isLocked: false };
  }

  const lockUntil = new Date(state.lockedUntil);
  const now = new Date();

  if (now >= lockUntil) {
    return { isLocked: false };
  }

  const remainingTime = lockUntil.getTime() - now.getTime();
  return { isLocked: true, remainingTime };
};

/**
 * Get remaining session time
 */
export const getSessionTimeRemaining = (): number | null => {
  const state = getAuthState();

  if (!state.lastVerified) {
    return null;
  }

  const lastVerified = new Date(state.lastVerified);
  const now = new Date();
  const timeDiff = now.getTime() - lastVerified.getTime();
  const remaining = ADMIN_CONFIG.SESSION.TIMEOUT - timeDiff;

  return remaining > 0 ? remaining : 0;
};

/**
 * Check if user has admin access (both Telegram ID and password verification)
 */
export const hasAdminAccess = (telegramId: string): boolean => {
  return isAdminUser(telegramId) && isAdminPasswordVerified();
};

/**
 * Get admin authentication status
 */
export const getAdminAuthStatus = (telegramId: string) => {
  const isAdmin = isAdminUser(telegramId);
  const isPasswordVerified = isAdminPasswordVerified();
  const hasAccess = isAdmin && isPasswordVerified;

  return {
    isAdmin,
    isPasswordVerified,
    hasAccess,
    needsPassword: isAdmin && !isPasswordVerified,
    sessionTimeRemaining: getSessionTimeRemaining(),
    lockoutInfo: getLockoutInfo()
  };
};