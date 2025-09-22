"use client";

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Wallet, Users, User as ProfileIcon, Zap, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { to: '/', icon: Home, labelKey: 'home' },
  { to: '/wallet', icon: Wallet, labelKey: 'wallet' },
  { to: '/slots', icon: Zap, labelKey: 'slots' },
  { to: '/tasks', icon: CheckSquare, labelKey: 'tasks' },
  { to: '/referrals', icon: Users, labelKey: 'referrals.title' },
];

export const SimplifiedBottomNav = () => {
  const { t } = useTranslation();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 w-full h-full py-2",
      isActive 
        ? "text-blue-600 dark:text-blue-400" 
        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
    );

  return (
    <motion.nav 
      className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 z-50"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-4">
        {navItems.map(({ to, icon: Icon, labelKey }, index) => (
          <NavLink key={to} to={to} className={navLinkClasses} end>
            {({ isActive }) => (
              <motion.div
                className="flex flex-col items-center gap-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
              >
                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"
                    layoutId="activeIndicator"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
                
                {/* Icon container */}
                <motion.div
                  className={cn(
                    "p-2 rounded-xl transition-all duration-300",
                    isActive 
                      ? "bg-blue-100 dark:bg-blue-900/30" 
                      : "hover:bg-gray-100 dark:hover:bg-gray-800/50"
                  )}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "scale-110"
                  )} />
                </motion.div>
                
                {/* Label */}
                <span className={cn(
                  "font-medium transition-all duration-300",
                  isActive && "font-semibold"
                )}>
                  {t(labelKey)}
                </span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </div>
    </motion.nav>
  );
};
