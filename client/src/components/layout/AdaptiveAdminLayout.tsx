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
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AdminNavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  description?: string;
  subItems?: AdminNavItem[];
}

const adminNavItems: AdminNavItem[] = [
  { path: '/admin', label: 'Dashboard', icon: Home, description: 'Overview and statistics' },
  { 
    path: '/admin/users', 
    label: 'Users', 
    icon: Users, 
    description: 'User management',
    subItems: [
      { path: '/admin/users', label: 'All Users', icon: Users },
      { path: '/admin/users/active', label: 'Active Users', icon: UserCheck },
      { path: '/admin/users/banned', label: 'Banned Users', icon: Ban },
    ]
  },
  { path: '/admin/transactions', label: 'Transactions', icon: CreditCard, description: 'Payment and transaction logs' },
  { path: '/admin/analytics', label: 'Analytics', icon: BarChart3, description: 'Performance metrics' },
  { path: '/admin/lottery', label: 'Lottery', icon: Ticket, description: 'Lottery management' },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell, description: 'Notification management' },
  { path: '/admin/exchange', label: 'Exchange', icon: TrendingUp, description: 'Exchange rate management' },
  { path: '/admin/logs', label: 'Logs', icon: FileText, description: 'System and activity logs' },
  { path: '/admin/settings', label: 'Settings', icon: Settings, description: 'System configuration' },
];

export const AdaptiveAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  const currentPath = location.pathname;

  const handleNavigation = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  };

  const renderNavItem = (item: AdminNavItem, level = 0) => {
    const isActive = currentPath === item.path;
    const isExpanded = expandedItems.includes(item.path);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const Icon = item.icon;

    return (
      <div key={item.path}>
        <button
          onClick={() => {
            if (hasSubItems) {
              toggleExpanded(item.path);
            } else {
              handleNavigation(item.path);
            }
          }}
          className={`
            w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200
            ${isActive 
              ? 'bg-purple-600 text-white' 
              : 'text-gray-300 hover:bg-gray-800 hover:text-white'
            }
            ${level > 0 ? 'ml-4' : ''}
          `}
        >
          <div className="flex items-center space-x-3">
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </div>
          {hasSubItems && (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {hasSubItems && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.subItems?.map(subItem => renderNavItem(subItem, level + 1))}
          </div>
        )}
      </div>
    );
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

        <nav className="mt-6 px-3 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="space-y-1">
            {adminNavItems.map(item => renderNavItem(item))}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-4 left-4 right-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-800"
            onClick={() => {
              localStorage.removeItem('admin-token');
              navigate('/');
            }}
          >
            <LogOut className="h-4 w-4 mr-3" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-700 px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="text-gray-400 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-purple-400" />
              <span className="text-lg font-semibold">Admin</span>
            </div>
            <div className="w-9" /> {/* Spacer */}
          </div>
        </div>

        {/* Page Content */}
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
