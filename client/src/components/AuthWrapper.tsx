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

  // Always call all hooks first, then handle conditional rendering
  if (loading) {
    return <SplashScreen />;
  }

  if (error) {
    const isDevelopment = import.meta.env.DEV;
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    
    if (isDevelopment && isLocalhost) {
      return (
        <div className="flex items-center justify-center min-h-screen text-white p-4">
          <div className="text-center max-w-md">
            <h2 className="text-xl font-bold text-yellow-500 mb-4">Development Mode</h2>
            <p className="text-yellow-400 mb-4">
              Server is not running. Please start the backend server or continue as admin user.
            </p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mr-2"
              >
                Retry
              </button>
              <button 
                onClick={() => {
                  // Force mock user mode
                  localStorage.setItem('dev_mode', 'true');
                  window.location.reload();
                }} 
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue as Admin
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Authentication Error</h2>
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
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