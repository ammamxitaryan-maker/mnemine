import { Navigate, Outlet } from 'react-router-dom';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { SplashScreen } from '@/components/SplashScreen';
import { useEffect, useState } from 'react';

export const AdminRoute = () => {
  const { user, loading } = useTelegramAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  if (loading) {
    return <SplashScreen />;
  }

  // Check if user is admin based on Telegram ID
  const ADMIN_TELEGRAM_IDS = ['6760298907', '987654321']; // Admin Telegram IDs
  
  // First check if user exists
  if (!user) {
    console.log('[ADMIN_ROUTE] No user data, redirecting to main app');
    return <Navigate to="/" replace />;
  }

  // Check if user is admin
  const isAdmin = ADMIN_TELEGRAM_IDS.includes(user.telegramId);

  // Debug logging
  console.log('[ADMIN_ROUTE] User:', user);
  console.log('[ADMIN_ROUTE] User Telegram ID:', user.telegramId);
  console.log('[ADMIN_ROUTE] Admin Telegram IDs:', ADMIN_TELEGRAM_IDS);
  console.log('[ADMIN_ROUTE] Is Admin:', isAdmin);

  // If user is NOT admin, show access denied
  if (!isAdmin) {
    if (!hasRedirected) {
      console.log('[ADMIN_ROUTE] User is not admin, showing access denied');
      setHasRedirected(true);
    }
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access the admin panel.</p>
          <p className="text-sm text-gray-500 mt-2">Only authorized administrators can access this area.</p>
        </div>
      </div>
    );
  }

  // Admin users can access admin panel
  console.log('[ADMIN_ROUTE] Admin access granted');

  return <Outlet />;
};