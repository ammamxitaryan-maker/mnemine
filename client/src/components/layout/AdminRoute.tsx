import { Navigate, Outlet } from 'react-router-dom';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { SplashScreen } from '@/components/SplashScreen';

export const AdminRoute = () => {
  const { user, loading } = useTelegramAuth();

  if (loading) {
    return <SplashScreen />;
  }

  // Check if user is admin based on Telegram ID
  const ADMIN_TELEGRAM_ID = '6760298907'; // Admin Telegram ID
  const isAdmin = user?.telegramId === ADMIN_TELEGRAM_ID;

  // Debug logging
  console.log('[ADMIN_ROUTE] User:', user);
  console.log('[ADMIN_ROUTE] User Telegram ID:', user?.telegramId);
  console.log('[ADMIN_ROUTE] Admin Telegram ID:', ADMIN_TELEGRAM_ID);
  console.log('[ADMIN_ROUTE] Is Admin:', isAdmin);

  // Redirect to main app if not admin
  if (!isAdmin) {
    console.log('[ADMIN_ROUTE] Redirecting non-admin user to main app');
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};