import { useState, useEffect } from 'react';
import { AuthenticatedUser } from '@/types/telegram';
import { TelegramInstructions } from '@/components/TelegramInstructions';

const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';

// Helper function to create a minimal user object for Telegram auth
const createTelegramUser = (user: Record<string, unknown>): AuthenticatedUser => {
  // Check if this is a backend user (has telegramId field) or Telegram WebApp user
  const isBackendUser = user.telegramId !== undefined;
  
  return {
    id: isBackendUser ? String(user.id) : String(user.id),
    telegramId: isBackendUser ? String(user.telegramId) : String(user.id),
    firstName: String(user.first_name || user.firstName || 'User'),
    lastName: String(user.last_name || user.lastName || ''),
    username: String(user.username || ''),
    avatarUrl: user.photo_url ? String(user.photo_url) : user.avatarUrl ? String(user.avatarUrl) : null,
    role: 'USER', // Always set to USER on client side for security
    referralCode: String(user.referralCode || ''),
    referredById: user.referredById ? String(user.referredById) : null,
    wallets: Array.isArray(user.wallets) ? user.wallets : [],
    miningSlots: Array.isArray(user.miningSlots) ? user.miningSlots : [],
    captchaValidated: Boolean(user.captchaValidated ?? true),
    isSuspicious: Boolean(user.isSuspicious ?? false),
    lastSuspiciousPenaltyAppliedAt: user.lastSuspiciousPenaltyAppliedAt ? new Date(String(user.lastSuspiciousPenaltyAppliedAt)) : null,
    lastSeenAt: user.lastSeenAt ? new Date(String(user.lastSeenAt)) : new Date(),
    lastInvestmentGrowthBonusClaimedAt: user.lastInvestmentGrowthBonusClaimedAt ? new Date(String(user.lastInvestmentGrowthBonusClaimedAt)) : null,
    lastReferralZeroPenaltyAppliedAt: user.lastReferralZeroPenaltyAppliedAt ? new Date(String(user.lastReferralZeroPenaltyAppliedAt)) : null,
    rank: user.rank ? String(user.rank) : null
  };
};

// Fallback authentication for development
const fallbackAuth = async (setUser: (user: AuthenticatedUser) => void, setUserAndCache: (user: AuthenticatedUser) => void) => {
  console.log('[AUTH] Using fallback authentication (development mode)');
  
  // Check if we're in local development mode
  const isLocalDev = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('192.168.') ||
                     window.location.hostname.includes('10.0.');
  
  if (!isLocalDev) {
    console.warn('[AUTH] Fallback auth only available in local development');
    throw new Error('Fallback auth only available in local development');
  }

  // Try to get stored test user or create a default one
  const storedUser = localStorage.getItem('testUser');
  let testUserData;
  
  if (storedUser) {
    try {
      testUserData = JSON.parse(storedUser);
    } catch (parseError) {
      console.warn('[AUTH] Failed to parse stored user, creating new one');
      testUserData = null;
    }
  }
  
  if (!testUserData) {
    // Create a default test user with admin ID for development
    testUserData = {
      id: 6760298907, // Use admin ID for development
      first_name: 'Admin',
      last_name: 'User',
      username: 'admin_test'
    };
    localStorage.setItem('testUser', JSON.stringify(testUserData));
  }

  // Create mock initData for fallback mode
  const mockInitData = `user=${encodeURIComponent(JSON.stringify(testUserData))}&auth_date=${Math.floor(Date.now() / 1000)}`;
  localStorage.setItem('telegram_init_data', mockInitData);

  try {
    // Call backend login endpoint to create user in database
    const response = await fetch(`${backendUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        id: testUserData.id, 
        username: testUserData.username,
        first_name: testUserData.first_name,
        last_name: testUserData.last_name
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    if (text) {
      const data = JSON.parse(text);
      console.log('[AUTH] Fallback login response:', data);
      
      if (data.user) {
        setUser(createTelegramUser(data.user));
        return;
      }
    }
    
    // Fallback to test user
    setUserAndCache(createTelegramUser(testUserData));
  } catch (err) {
    console.error('[AUTH] Fallback login failed:', err);
    // Use fallback user for local development even if request fails
    if (testUserData) {
      setUserAndCache(createTelegramUser(testUserData));
    } else {
      console.error('[AUTH] No test user data available');
      throw new Error('No test user data available for fallback auth');
    }
  }
};

// Cache for authentication to prevent multiple calls
let authCache: { user: AuthenticatedUser | null; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useTelegramAuth = () => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authAttempted, setAuthAttempted] = useState(false);
  const [initData, setInitData] = useState<string | null>(null);

  // Helper function to set user and cache
  const setUserAndCache = (userData: AuthenticatedUser | null) => {
    setUser(userData);
    authCache = { user: userData, timestamp: Date.now() };
    
    // Clear cache if user changes
    if (userData && authCache.user && authCache.user.telegramId !== userData.telegramId) {
      console.log('[AUTH] User changed, clearing cache');
      authCache = null;
    }
  };

  useEffect(() => {
    if (authAttempted) return;

    const validateAuth = async () => {
      // Check cache first
      if (authCache && Date.now() - authCache.timestamp < CACHE_DURATION) {
        console.log('[AUTH] Using cached authentication');
        setUserAndCache(authCache.user);
        setLoading(false);
        setAuthAttempted(true);
        return;
      }

      console.log('[AUTH] Starting authentication validation...');
      setLoading(true);
      setError(null);
      
      setAuthAttempted(true);
      
      const tg = window.Telegram?.WebApp;
      
      console.log('[TELEGRAM_AUTH] Telegram WebApp object:', tg);
      console.log('[TELEGRAM_AUTH] initDataUnsafe:', tg?.initDataUnsafe);
      console.log('[TELEGRAM_AUTH] initData:', tg?.initData);
      console.log('[TELEGRAM_AUTH] window.Telegram:', window.Telegram);
      console.log('[TELEGRAM_AUTH] window.location:', window.location);
      console.log('[TELEGRAM_AUTH] User agent:', navigator.userAgent);
      
      // Additional diagnostics
      console.log('[TELEGRAM_AUTH] Has Telegram object:', !!window.Telegram);
      console.log('[TELEGRAM_AUTH] Has WebApp object:', !!tg);
      console.log('[TELEGRAM_AUTH] Has initDataUnsafe:', !!tg?.initDataUnsafe);
      console.log('[TELEGRAM_AUTH] Has user in initDataUnsafe:', !!tg?.initDataUnsafe?.user);
      console.log('[TELEGRAM_AUTH] User ID:', tg?.initDataUnsafe?.user?.id);
      console.log('[TELEGRAM_AUTH] Has initData string:', !!tg?.initData);
      console.log('[TELEGRAM_AUTH] URL parameters:', window.location.search);
      console.log('[TELEGRAM_AUTH] Referrer:', document.referrer);

      // Check if we're in production environment (not localhost)
      const isProduction = !window.location.hostname.includes('localhost') && 
                          !window.location.hostname.includes('127.0.0.1') &&
                          !window.location.hostname.includes('192.168.') &&
                          !window.location.hostname.includes('10.0.') &&
                          window.location.protocol === 'https:';

      console.log('[AUTH] Environment check - isProduction:', isProduction, 'hostname:', window.location.hostname);

      // Check if we're in a Telegram WebApp environment (even without user data)
      const isTelegramWebApp = tg && tg.initDataUnsafe;
      const hasTelegramUser = !!(tg && tg.initDataUnsafe?.user?.id);
      
      console.log('[AUTH] Telegram WebApp detected:', isTelegramWebApp);
      console.log('[AUTH] Has Telegram user data:', hasTelegramUser);
      console.log('[AUTH] User ID from Telegram:', tg?.initDataUnsafe?.user?.id);
      
      // Check if we have URL parameters that might contain Telegram data
      const urlParams = new URLSearchParams(window.location.search);
      const tgWebAppData = urlParams.get('tgWebAppData');
      const tgWebAppStartParam = urlParams.get('tgWebAppStartParam');
      
      console.log('[AUTH] URL parameters - tgWebAppData:', tgWebAppData, 'tgWebAppStartParam:', tgWebAppStartParam);
      
      // In production, we prefer Telegram WebApp data but allow fallback for testing
      if (isProduction && !isTelegramWebApp && !tgWebAppData && !tgWebAppStartParam) {
        console.warn('[AUTH] Production environment - no Telegram WebApp detected');
        console.warn('[AUTH] This may be normal if opening directly in browser');
        console.warn('[AUTH] For proper Telegram WebApp, use the bot button');
        
        // Show a more helpful error message only if no Telegram data at all
        setError('Please open this app through Telegram bot. Use /start command and click the "🚀 Launch App" button.');
        setLoading(false);
        return;
      }

      // URL parameters already checked above
      
      // Check if we have valid Telegram WebApp data
      if (tg && tg.initData && tg.initDataUnsafe?.user?.id) {
        // Real Telegram WebApp environment with user data
        tg.expand();
        
        const user = tg.initDataUnsafe.user;
        console.log('[AUTH] Telegram user:', user);
        
        // Store initData for API calls
        setInitData(tg.initData);
        
        try {
          // Call backend validation endpoint to create/update user in database
          const response = await fetch(`${backendUrl}/api/auth/validate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              initData: tg.initData,
              startParam: tg.initDataUnsafe.start_param
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('[AUTH] Telegram auth response:', data);
          
          if (data.user) {
            // Use the user data from backend
            setUserAndCache(createTelegramUser(data.user));
          } else {
            setError('Authentication failed');
          }
        } catch (err) {
          console.error('[AUTH] Telegram auth failed:', err);
          setError(`Authentication failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        setLoading(false);
      } else if (tg && tg.initDataUnsafe?.user?.id) {
        // Telegram WebApp is available but initData is missing
        // This can happen in some cases, try to use the user data directly
        console.log('[AUTH] Telegram WebApp available but initData missing, using direct login');
        tg.expand();
        
        const user = tg.initDataUnsafe.user;
        
        try {
          // Call backend login endpoint to create user in database
          const response = await fetch(`${backendUrl}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              id: user.id,
              username: user.username,
              first_name: user.first_name,
              last_name: user.last_name
            })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const data = await response.json();
          console.log('[AUTH] Direct Telegram login response:', data);
          
          if (data.user) {
            setUserAndCache(createTelegramUser(data.user));
          } else if (data.success) {
            setUserAndCache(createTelegramUser(user as unknown as Record<string, unknown>));
          } else {
            setError(data.message || 'Direct Telegram login failed');
          }
        } catch (err) {
          console.error('[AUTH] Direct Telegram login failed:', err);
          setError(`Login failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        
        setLoading(false);
      } else {
        // No valid Telegram WebApp data
        if (isProduction) {
          console.error('[AUTH] Production environment requires Telegram WebApp');
          setError('Please open this app through Telegram bot. Use /start command and click the "🚀 Launch App" button.');
          setLoading(false);
          return;
        } else {
          // Fallback to local development mode
          console.log('[AUTH] No Telegram WebApp detected, using fallback auth (development only)');
          try {
            await fallbackAuth(setUser, setUserAndCache);
          } catch (err) {
            console.error('[AUTH] Fallback auth failed:', err);
            setError(`Fallback auth failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          } finally {
            setLoading(false);
          }
        }
      }
    };

    validateAuth();
  }, [authAttempted]);

  const logout = () => {
    setUser(null);
    setAuthAttempted(false);
    setError(null);
    // Clear any cached data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('telegram_auth_cache');
    }
  };

  return { user, loading, error, initData, TelegramInstructions, logout };
};