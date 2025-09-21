import React, { useState } from 'react';
import { AdminMenu } from './AdminMenu';
import { AdminDashboard } from './AdminDashboard';
import { AdminLotteryManagement } from './AdminLotteryManagement';
import { AdminExchangeManagement } from './AdminExchangeManagement';
import { motion, AnimatePresence } from 'framer-motion';

export const AdminMainPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'lottery':
        return <AdminLotteryManagement />;
      case 'exchange':
        return <AdminExchangeManagement />;
      case 'users':
        return <AdminDashboard />; // Reuse existing user management
      case 'settings':
        return (
          <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">System Settings</h1>
            <p className="text-gray-600 dark:text-gray-400">System configuration panel coming soon...</p>
          </div>
        );
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Admin Menu Sidebar */}
          <div className="lg:col-span-1">
            <AdminMenu activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderActiveTab()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
