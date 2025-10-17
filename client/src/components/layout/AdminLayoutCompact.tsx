"use client";

import { ErrorBoundary } from '@/components/admin/ErrorBoundary';
import { Button } from '@/components/ui/button';
import { clearAdminPasswordVerification } from '@/utils/adminAuth';
import {
  ArrowLeft,
  LogOut
} from 'lucide-react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

export const AdminLayoutCompact = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Compact Top Bar */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-700">
        <div className="flex items-center justify-between h-10 px-3">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-gray-300 hover:text-white h-7 w-7 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {currentPath !== '/admin' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className="text-gray-300 hover:text-white h-7 px-2 text-xs"
              >
                ← Dashboard
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-white truncate">
                {currentPath === '/admin' ? 'Admin Panel' :
                  currentPath.includes('/users') ? 'Users' :
                    currentPath.includes('/transactions') ? 'Transactions' :
                      currentPath.includes('/analytics') ? 'Analytics' :
                        currentPath.includes('/lottery') ? 'Lottery' :
                          currentPath.includes('/notifications') ? 'Notifications' :
                            currentPath.includes('/processing') ? 'Processing' :
                              currentPath.includes('/exchange') ? 'Exchange' :
                                currentPath.includes('/logs') ? 'Logs' :
                                  currentPath.includes('/settings') ? 'Settings' :
                                    currentPath.includes('/staff') ? 'Staff' :
                                      'Admin Panel'}
              </h2>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Clear password verification
              clearAdminPasswordVerification();
              console.log('[ADMIN_LOGOUT] Password verification cleared');
              // Navigate to main page
              navigate('/');
            }}
            className="border-red-600 text-red-400 hover:bg-red-600/10 h-7 px-2 text-xs"
          >
            <LogOut className="h-3 w-3 mr-1" />
            Выйти
          </Button>
        </div>
      </div>

      {/* Full-width Page content */}
      <main className="p-1 pb-12">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};
