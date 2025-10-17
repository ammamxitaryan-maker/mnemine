/**
 * Улучшенные утилиты аутентификации админ панели
 */

import { ADMIN_CONFIG } from '@/config/adminConfig';

// Типы для аутентификации
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
 * Получить текущее состояние аутентификации
 */
export const getAuthState = (): AuthState => {
  const stored = sessionStorage.getItem('admin_auth_state');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Если данные повреждены, сбрасываем
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
 * Сохранить состояние аутентификации
 */
export const setAuthState = (state: Partial<AuthState>): void => {
  const currentState = getAuthState();
  const newState = { ...currentState, ...state };
  sessionStorage.setItem('admin_auth_state', JSON.stringify(newState));
  console.log('[ADMIN_AUTH] Auth state updated:', newState);
};

/**
 * Проверить, верифицирован ли пароль в текущей сессии
 */
export const isAdminPasswordVerified = (): boolean => {
  const state = getAuthState();
  
  // Проверяем, не истекла ли сессия
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
  
  // Проверяем, не заблокирован ли аккаунт
  if (state.lockedUntil) {
    const lockUntil = new Date(state.lockedUntil);
    const now = new Date();
    
    if (now < lockUntil) {
      console.log('[ADMIN_AUTH] Account is locked until:', state.lockedUntil);
      return false;
    } else {
      // Блокировка истекла, сбрасываем
      setAuthState({ lockedUntil: null, attempts: 0 });
    }
  }
  
  const verified = state.isVerified;
  console.log('[ADMIN_AUTH] Password verified:', verified);
  return verified;
};

/**
 * Установить пароль как верифицированный
 */
export const setAdminPasswordVerified = (): void => {
  setAuthState({
    isVerified: true,
    lastVerified: new Date().toISOString(),
    attempts: 0,
    lockedUntil: null,
  });
  console.log('[ADMIN_AUTH] Password verification set to true');
};

/**
 * Очистить верификацию пароля (выход)
 */
export const clearAdminPasswordVerification = (): void => {
  clearAuthState();
  console.log('[ADMIN_AUTH] Password verification cleared');
};

/**
 * Очистить все данные аутентификации
 */
export const clearAuthState = (): void => {
  sessionStorage.removeItem('admin_auth_state');
  console.log('[ADMIN_AUTH] Auth state cleared');
};

/**
 * Проверить пароль админа
 */
export const verifyAdminPassword = (password: string): boolean => {
  const state = getAuthState();
  
  // Проверяем, не заблокирован ли аккаунт
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
    // Успешная аутентификация
    setAuthState({
      isVerified: true,
      lastVerified: new Date().toISOString(),
      attempts: 0,
      lockedUntil: null,
    });
    console.log('[ADMIN_AUTH] Password verification successful');
  } else {
    // Неудачная попытка
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
 * Получить информацию о блокировке
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
 * Проверить, является ли пользователь админом
 */
export const isAdminUser = (telegramId: string): boolean => {
  return ADMIN_CONFIG.TELEGRAM_IDS.includes(telegramId);
};

/**
 * Получить время до истечения сессии
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
