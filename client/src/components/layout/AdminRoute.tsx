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
  const isAdmin = user?.telegramId === ADMIN_TELEGRAM_ID || user?.role === 'ADMIN';

  // Redirect to main app if not admin
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};