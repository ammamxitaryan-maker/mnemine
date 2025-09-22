"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, DollarSign, Clock } from 'lucide-react';
import { SmartCard } from '@/components/ui/smart-card';

interface EarningsNotificationProps {
  currentEarnings: number;
  previousEarnings: number;
  isVisible: boolean;
  onClose: () => void;
}

export const EarningsNotification: React.FC<EarningsNotificationProps> = ({
  currentEarnings,
  previousEarnings,
  isVisible,
  onClose
}) => {
  const [showNotification, setShowNotification] = useState(false);
  const earningsIncrease = currentEarnings - previousEarnings;

  useEffect(() => {
    if (isVisible && earningsIncrease > 0.001) {
      setShowNotification(true);
      const timer = setTimeout(() => {
        setShowNotification(false);
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [currentEarnings, previousEarnings, isVisible, earningsIncrease, onClose]);

  if (!showNotification || earningsIncrease <= 0.001) return null;

  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          className="fixed top-4 right-4 z-50 max-w-sm"
          initial={{ opacity: 0, x: 300, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 300, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <SmartCard
            variant="glass"
            className="border-green-200 dark:border-green-700 bg-green-50/90 dark:bg-green-900/20"
          >
            <div className="flex items-center gap-3">
              <motion.div
                className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
              >
                <TrendingUp className="w-5 h-5 text-white" />
              </motion.div>
              
              <div className="flex-1">
                <p className="font-semibold text-green-800 dark:text-green-200">
                  Earnings Updated!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  +{earningsIncrease.toFixed(4)} CFM earned
                </p>
              </div>

              <motion.button
                onClick={() => setShowNotification(false)}
                className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-800 rounded"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ×
              </motion.button>
            </div>

            {/* Progress indicator */}
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-b-lg"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 4, ease: "linear" }}
            />
          </SmartCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
