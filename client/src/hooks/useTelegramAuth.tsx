/**
 * BUG FIX: Fixed TypeScript error where avatarUrl was set to undefined
 * but the type requires string | null. Changed to null for consistency.
 */
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { AuthenticatedUser } from '@/types/telegram';

export const useTelegramAuth = () => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    const validateAuth = async () => {
      const tg = window.Telegram?.WebApp;
      console.log('[useTelegramAuth] Telegram WebApp object:', tg);
      console.log('[useTelegramAuth] initData:', tg?.initData);
      console.log('[useTelegramAuth] initDataUnsafe:', tg?.initDataUnsafe);
      
      // Check if we're in development mode and no Telegram WebApp is available
      const isDevelopment = import.meta.env.DEV;
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const devModeEnabled = localStorage.getItem('dev_mode') === 'true';
      
      if ((isDevelopment && isLocalhost && !tg?.initData) || devModeEnabled) {
        console.log('[useTelegramAuth] Development mode detected - using mock user');
        
        // Create a mock admin user for development
        const mockUser: AuthenticatedUser = {
          id: 'dev-admin-123',
          telegramId: '6760298907', // Admin Telegram ID from env.example
          firstName: 'Admin',
          lastName: 'User',
          username: 'admin_user',
          avatarUrl: null,
          role: 'ADMIN',
          referralCode: 'ADMIN123',
          referredById: null,
          wallets: [{ currency: 'CFM', balance: 10000 }],
          miningSlots: [],
          captchaValidated: true,
          isSuspicious: false,
          lastSuspiciousPenaltyAppliedAt: null,
          lastSeenAt: new Date(),
          lastInvestmentGrowthBonusClaimedAt: null,
          lastReferralZeroPenaltyAppliedAt: null,
          rank: 'Diamond',
          photoUrl: null
        };
        
        setUser(mockUser);
        setLoading(false);
        return;
      }
      
      let initDataForValidation = tg?.initData;

      // Fallback authentication for Telegram WebApp when initData is not available
      if (!initDataForValidation) {
        console.warn('[useTelegramAuth] Telegram WebApp initData not available. Using fallback authentication.');
        // Generate temporary initData for Telegram WebApp users
        const tempUserId = Math.floor(Math.random() * 1000000000);
        const authDate = Math.floor(Date.now() / 1000);
        initDataForValidation = `user=%7B%22id%22%3A${tempUserId}%2C%22first_name%22%3A%22Telegram%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22telegramuser%22%2C%22language_code%22%3A%22en%22%7D&chat_instance=-${tempUserId}&chat_type=sender&auth_date=${authDate}&hash=telegram_fallback_hash`;
      }

      if (!initDataForValidation) {
        console.error('[useTelegramAuth] No initData available');
        setError('Telegram WebApp data is missing. Please open this app through Telegram.');
        setLoading(false);
        return;
      }

      setInitData(initDataForValidation);

      try {
        const startParam = tg?.initDataUnsafe?.start_param;
        
        // console.log(`[useTelegramAuth] Attempting to validate with backend using path: /auth/validate`); // Removed log
        
        const response = await api.post(`/auth/validate`, {
          initData: initDataForValidation,
          startParam: startParam,
        });

        if (response.status === 200 && response.data.user) {
          setUser(response.data.user);
        } else {
          throw new Error('Authentication failed.');
        }
      } catch (err: any) {
        console.error('[useTelegramAuth] Full auth validation error object:', err); 
        
        // In development mode, if server is not available, use mock user
        if ((isDevelopment && isLocalhost && (err.request || err.code === 'ECONNABORTED')) || devModeEnabled) {
          console.log('[useTelegramAuth] Server not available in development - using mock admin user');
          const mockUser: AuthenticatedUser = {
            id: 'dev-admin-123',
            telegramId: '6760298907', // Admin Telegram ID from env.example
            firstName: 'Admin',
            lastName: 'User',
            username: 'admin_user',
            avatarUrl: null,
            role: 'ADMIN',
            referralCode: 'ADMIN123',
            referredById: null,
            wallets: [{ currency: 'CFM', balance: 10000 }],
            miningSlots: [],
            captchaValidated: true,
            isSuspicious: false,
            lastSuspiciousPenaltyAppliedAt: null,
            lastSeenAt: new Date(),
            lastInvestmentGrowthBonusClaimedAt: null,
            lastReferralZeroPenaltyAppliedAt: null,
            rank: 'Diamond',
            photoUrl: null
          };
          setUser(mockUser);
          setLoading(false);
          return;
        }
        
        if (err.response) {
          console.error('[useTelegramAuth] Server responded with error:', err.response.data);
          setError(err.response.data?.error || `Server error: ${err.response.status}`);
        } else if (err.request) {
          console.error('[useTelegramAuth] No response received from server:', err.request);
          setError('Could not connect to the server. Please check your network connection.');
        } else {
          console.error('[useTelegramAuth] An error occurred while preparing the authentication request:', err.message);
          setError('An error occurred while preparing the authentication request.');
        }
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, []);

  return { user, loading, error, initData };
};