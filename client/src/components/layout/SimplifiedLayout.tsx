"use client";

import { Outlet } from 'react-router-dom';
import { SimplifiedBottomNav } from '../SimplifiedBottomNav';
import { motion } from 'framer-motion';

export const SimplifiedLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30">
      <motion.main 
        className="flex-grow overflow-y-auto pb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Outlet />
      </motion.main>
      <SimplifiedBottomNav />
    </div>
  );
};
