"use client";

import React, { useEffect } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { SplashScreen } from './SplashScreen';
import { AuthenticatedUser } from '@/types/telegram';

interface AuthWrapperProps {
  children: (user: AuthenticatedUser) => React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { user, loading, error } = useTelegramAuth();

  useEffect(() => {
    console.log('[AuthWrapper] Rendered. Loading:', loading, 'User:', user ? user.telegramId : 'null', 'Error:', error);
  }, [loading, user, error]);

  if (loading) {
    return <SplashScreen />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <p className="text-red-500 text-center">Authentication Error: {error}</p>
      </div>
    );
  }

  if (!user) {
    // This case should ideally not be reached if loading is false and there's no error,
    // but as a fallback, we can show a generic error or redirect.
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <p className="text-red-500 text-center">User data not available after authentication.</p>
      </div>
    );
  }

  return <>{children(user)}</>;
};