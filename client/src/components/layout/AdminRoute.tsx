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
  
  // First check if user exists
  if (!user) {
    console.log('[ADMIN_ROUTE] No user data, redirecting to main app');
    return <Navigate to="/" replace />;
  }

  // Check if user is admin
  const isAdmin = user.telegramId === ADMIN_TELEGRAM_ID;

  // Debug logging
  console.log('[ADMIN_ROUTE] User:', user);
  console.log('[ADMIN_ROUTE] User Telegram ID:', user.telegramId);
  console.log('[ADMIN_ROUTE] Admin Telegram ID:', ADMIN_TELEGRAM_ID);
  console.log('[ADMIN_ROUTE] Is Admin:', isAdmin);

  // If user is NOT admin (telegramId !== '6760298907'), redirect to main app
  if (!isAdmin) {
    console.log('[ADMIN_ROUTE] User is not admin, redirecting to main app');
    return <Navigate to="/" replace />;
  }

  // Only admin users (telegramId === '6760298907') can access admin panel
  console.log('[ADMIN_ROUTE] Admin access granted');

  return <Outlet />;
};