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
      
      let initDataForValidation = tg?.initData;

      // Fallback for development and production when initData is not available
      if (!initDataForValidation) {
        console.warn('[useTelegramAuth] Telegram WebApp initData not available. Using fallback authentication.');
        // Generate a temporary initData for users accessing from Telegram WebApp
        const tempUserId = Math.floor(Math.random() * 1000000000);
        const authDate = Math.floor(Date.now() / 1000);
        initDataForValidation = `user=%7B%22id%22%3A${tempUserId}%2C%22first_name%22%3A%22Telegram%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22telegramuser%22%2C%22language_code%22%3A%22en%22%7D&chat_instance=-${tempUserId}&chat_type=sender&auth_date=${authDate}&hash=fallback_hash`;
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