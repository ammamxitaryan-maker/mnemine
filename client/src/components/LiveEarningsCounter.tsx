"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

interface LiveEarningsCounterProps {
  investmentAmount: number;
  currentSlotValue: number;
  totalSlotValue: number;
  isActive: boolean;
}

export const LiveEarningsCounter: React.FC<LiveEarningsCounterProps> = ({
  investmentAmount,
  currentSlotValue,
  totalSlotValue,
  isActive
}) => {
  const [displayValue, setDisplayValue] = useState(currentSlotValue);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      // Calculate value increase per second (30% profit over 7 days)
      const totalProfit = investmentAmount * 0.30; // 30% profit
      const totalSeconds = 7 * 24 * 60 * 60; // 604800 seconds
      const valueIncreasePerSecond = totalProfit / totalSeconds;
      
      setDisplayValue(prev => {
        const newValue = Math.min(prev + valueIncreasePerSecond, totalSlotValue);
        
        // Trigger animation when value increases significantly
        if (newValue - prev > 0.001) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 500);
        }
        
        return newValue;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [investmentAmount, totalSlotValue, isActive]);

  // Reset when values change
  useEffect(() => {
    setDisplayValue(currentSlotValue);
  }, [currentSlotValue, totalSlotValue]);

  const progress = Math.min(((displayValue - investmentAmount) / (totalSlotValue - investmentAmount)) * 100, 100);
  const currentProfit = displayValue - investmentAmount;

  return (
    <motion.div
      className="relative p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700"
      animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <motion.div
          className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg"
          animate={isActive ? { rotate: [0, 360] } : {}}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: "linear" }}
        >
          <DollarSign className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <p className="font-semibold text-green-800 dark:text-green-200">
            Live Earnings
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            {isActive ? 'Growing...' : 'Completed'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Current slot value display */}
        <motion.div
          className="text-center"
          key={displayValue.toFixed(4)}
          initial={{ scale: 1.1, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {displayValue.toFixed(4)} CFM
          </p>
          <p className="text-sm text-green-700 dark:text-green-300">
            from {investmentAmount.toFixed(4)} → {totalSlotValue.toFixed(4)} CFM
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            +{currentProfit.toFixed(4)} CFM profit
          </p>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full relative overflow-hidden"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            {/* Animated shine effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>

        {/* Progress percentage */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-green-600 dark:text-green-400 font-medium">
            {progress.toFixed(1)}%
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {isActive ? 'In Progress' : 'Complete'}
          </span>
        </div>

        {/* Earnings rate */}
        {isActive && (
          <motion.div
            className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-xs text-green-700 dark:text-green-300">
              Growing ~{(((investmentAmount * 0.30) / (7 * 24 * 60 * 60)) * 1000).toFixed(4)} CFM per 1000 seconds
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
