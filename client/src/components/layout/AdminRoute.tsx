import { AdminPasswordModal } from '@/components/AdminPasswordModal';
import { SplashScreen } from '@/components/SplashScreen';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { isAdminPasswordVerified } from '@/utils/adminAuth';
import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// Get admin IDs from environment variable, fallback to default for development
const ADMIN_TELEGRAM_IDS = import.meta.env.VITE_ADMIN_TELEGRAM_IDS
  ? import.meta.env.VITE_ADMIN_TELEGRAM_IDS.split(',').map((id: string) => id.trim())
  : ['6760298907'];

export const AdminRoute = () => {
  const { user, loading } = useTelegramAuth();
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check if password was already verified in this session
  useEffect(() => {
    const passwordVerified = isAdminPasswordVerified();
    setIsPasswordVerified(passwordVerified);
    setIsInitialized(true);
  }, []);

  if (loading || !isInitialized) {
    return <SplashScreen />;
  }

  if (!user) {
    console.log('[ADMIN_ROUTE] No user data, redirecting to main app');
    return <Navigate to="/" replace />;
  }

  // First check password for everyone trying to access admin panel
  if (!isPasswordVerified) {
    return (
      <AdminPasswordModal
        onPasswordCorrect={() => {
          setIsPasswordVerified(true);
        }}
      />
    );
  }

  // After password verification, check if user is admin
  const isAdmin = ADMIN_TELEGRAM_IDS.includes(user.telegramId);

  if (!isAdmin) {
    console.log('[ADMIN_ROUTE] User is not admin, access denied');
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-400">You don't have permission to access the admin panel.</p>
        </div>
      </div>
    );
  }

  console.log('[ADMIN_ROUTE] Admin access granted with password verification');
  return <Outlet />;
};