import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Trophy, 
  DollarSign, 
  Settings,
  BarChart3,
  TrendingUp,
  Shield,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AdminMenuProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    description: 'Overview and statistics',
    color: 'bg-blue-500'
  },
  {
    id: 'lottery',
    label: 'Lottery Management',
    icon: Trophy,
    description: 'Manage lottery participants and winners',
    color: 'bg-purple-500'
  },
  {
    id: 'exchange',
    label: 'Exchange Rate',
    icon: TrendingUp,
    description: 'Control CFM to CFMT exchange rates',
    color: 'bg-green-500'
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    description: 'View and manage all users',
    color: 'bg-orange-500'
  },
  {
    id: 'settings',
    label: 'System Settings',
    icon: Settings,
    description: 'Configure system parameters',
    color: 'bg-gray-500'
  }
];

export const AdminMenu: React.FC<AdminMenuProps> = ({ 
  activeTab, 
  onTabChange, 
  className = '' 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`${className}`}>
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden mb-4">
        <Button
          variant="outline"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full"
        >
          {isCollapsed ? (
            <>
              <Menu className="w-4 h-4 mr-2" />
              Show Admin Menu
            </>
          ) : (
            <>
              <X className="w-4 h-4 mr-2" />
              Hide Admin Menu
            </>
          )}
        </Button>
      </div>

      {/* Admin Menu */}
      <AnimatePresence>
        {(!isCollapsed || window.innerWidth >= 1024) && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-red-600" />
                  <CardTitle className="text-lg">Admin Panel</CardTitle>
                </div>
                <Badge variant="destructive" className="w-fit">
                  Administrator Access
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    return (
                      <motion.button
                        key={item.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onTabChange(item.id)}
                        className={`w-full text-left p-4 rounded-none border-0 transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-900/20 border-r-2 border-blue-600'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${isActive ? item.color : 'bg-gray-100 dark:bg-gray-700'}`}>
                            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                              {item.label}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {item.description}
                            </p>
                          </div>
                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-blue-600 rounded-full"
                            />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Admin Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-4"
      >
        <Card className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Administrator Mode
                </p>
                <p className="text-xs text-red-600 dark:text-red-300">
                  Full system access enabled
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
