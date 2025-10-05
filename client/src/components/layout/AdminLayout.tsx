"use client";

import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Ticket, 
  Shield, 
  DollarSign, 
  FileText, 
  Activity,
  Menu,
  X,
  Home,
  UserCheck,
  Ban,
  History,
  CreditCard,
  Gift,
  TrendingUp,
  Bell,
  Database,
  Cog,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdminNavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  description?: string;
}

const adminNavItems: AdminNavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: Home, description: 'Overview and statistics' },
  { path: '/admin/users', label: 'Users', icon: Users, description: 'User management' },
  { path: '/admin/transactions', label: 'Transactions', icon: CreditCard, description: 'Payment and transaction logs' },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, description: 'Performance metrics' },
  { path: '/admin/custom-reports', label: 'Custom Reports', icon: BarChart3, description: 'Detailed analytics and insights' },
  { path: '/admin/system-monitoring', label: 'System Monitor', icon: Database, description: 'Real-time system monitoring' },
  { path: '/admin/queue-management', label: 'Queue Manager', icon: Cog, description: 'Queue management and monitoring' },
  { path: '/admin/lottery', label: 'Lottery', icon: Ticket, description: 'Lottery management' },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell, description: 'Notification management' },
  { path: '/admin/processing', label: 'Processing', icon: Cog, description: 'Slot processing and automation' },
  { path: '/admin/exchange', label: 'Exchange', icon: TrendingUp, description: 'Exchange rate management' },
  { path: '/admin/logs', label: 'Logs', icon: FileText, description: 'System and activity logs' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, description: 'System configuration' },
];

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-purple-400" />
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path || 
                (item.path !== '/admin' && currentPath.startsWith(item.path));
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActive 
                      ? 'bg-purple-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }
                  `}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  <div className="flex-1 text-left">
                    <div>{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Quick Stats */}
        <div className="absolute bottom-4 left-4 right-4">
          <Card className="bg-gray-800 border-gray-700 p-3">
            <div className="text-xs text-gray-400 mb-2">Quick Stats</div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-300">System Status</span>
                <span className="text-green-400">● Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Active Users</span>
                <span className="text-blue-400">--</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden text-gray-400 hover:text-white"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {adminNavItems.find(item => 
                    currentPath === item.path || 
                    (item.path !== '/admin' && currentPath.startsWith(item.path))
                  )?.label || 'Admin Panel'}
                </h2>
                <p className="text-sm text-gray-400">
                  {adminNavItems.find(item => 
                    currentPath === item.path || 
                    (item.path !== '/admin' && currentPath.startsWith(item.path))
                  )?.description || 'System administration'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                Back to App
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('admin_token');
                  navigate('/admin-login');
                }}
                className="border-red-600 text-red-400 hover:bg-red-600/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
