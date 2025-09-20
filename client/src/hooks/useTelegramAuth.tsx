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
      let initDataForValidation = tg?.initData;

      // Fallback for local development when not in Telegram WebApp
      if (!initDataForValidation && import.meta.env.DEV) { // Only in development mode
        console.warn('[useTelegramAuth] Telegram WebApp not detected. Using mock initData for development.');
        initDataForValidation = import.meta.env.VITE_MOCK_TELEGRAM_INIT_DATA || 'user=%7B%22id%22%3A123456789%2C%22first_name%22%3A%22Test%22%2C%22last_name%22%3A%22User%22%2C%22username%22%3A%22testuser%22%2C%22language_code%22%3A%22en%22%7D&chat_instance=-123456789&chat_type=sender&auth_date=1234567890&hash=test_hash';
      }

      if (!initDataForValidation) {
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