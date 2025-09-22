"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock } from 'lucide-react';

interface PreciseEarningsAnimationProps {
  investmentAmount: number;
  startTime: Date;
  duration: number; // in milliseconds
  isActive: boolean;
  slotId: string;
}

export const PreciseEarningsAnimation: React.FC<PreciseEarningsAnimationProps> = ({
  investmentAmount,
  startTime,
  duration,
  isActive,
  slotId
}) => {
  const [currentValue, setCurrentValue] = useState(investmentAmount);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);

  const totalProfit = investmentAmount * 0.30; // 30% profit
  const finalValue = investmentAmount + totalProfit; // 130% of investment
  const profitPerSecond = totalProfit / (duration / 1000);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      const elapsed = now.getTime() - startTime.getTime();
      const progress = Math.min(elapsed / duration, 1);
      
      const newValue = investmentAmount + (totalProfit * progress);
      
      // Trigger animation when value changes
      if (Math.abs(newValue - currentValue) > 0.000001) {
        setIsAnimating(true);
        setTimeout(() => setIsAnimating(false), 100);
      }
      
      setCurrentValue(newValue);
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [isActive, startTime, duration, investmentAmount, totalProfit, currentValue]);

  const progress = Math.min((currentTime.getTime() - startTime.getTime()) / duration, 1);
  const timeRemaining = Math.max(duration - (currentTime.getTime() - startTime.getTime()), 0);
  const isCompleted = timeRemaining <= 0;

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'Completed';
    
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <motion.div
      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
        isCompleted 
          ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700' 
          : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'
      }`}
      animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.2 }}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h4 className={`font-semibold ${
            isCompleted 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-blue-800 dark:text-blue-200'
          }`}>
            Slot #{slotId.slice(-4)}
          </h4>
          <p className={`text-sm ${
            isCompleted 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            Investment: {investmentAmount.toFixed(6)} CFM
          </p>
        </div>
        <div className="text-right">
          <p className={`text-sm ${
            isCompleted 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {formatTime(timeRemaining)}
          </p>
        </div>
      </div>

      {/* Animated Value Display */}
      <div className="text-center mb-4">
        <motion.div
          key={currentValue.toFixed(6)}
          initial={{ opacity: 0.7, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className={`text-3xl font-bold ${
            isCompleted 
              ? 'text-green-600 dark:text-green-400' 
              : 'text-blue-600 dark:text-blue-400'
          }`}
        >
          {currentValue.toFixed(6)} CFM
        </motion.div>
        
        <p className={`text-sm mt-1 ${
          isCompleted 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-blue-600 dark:text-blue-400'
        }`}>
          {isCompleted 
            ? `Final: ${finalValue.toFixed(6)} CFM (+${totalProfit.toFixed(6)} profit)`
            : `Target: ${finalValue.toFixed(6)} CFM`
          }
        </p>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
        <motion.div
          className={`h-3 rounded-full relative overflow-hidden ${
            isCompleted 
              ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {/* Shine effect for active slots */}
          {!isCompleted && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>
      </div>

      {/* Progress Info */}
      <div className="flex justify-between items-center text-sm">
        <span className={`font-medium ${
          isCompleted 
            ? 'text-green-600 dark:text-green-400' 
            : 'text-blue-600 dark:text-blue-400'
        }`}>
          {isCompleted 
            ? `+${totalProfit.toFixed(6)} CFM earned!`
            : `+${(currentValue - investmentAmount).toFixed(6)} CFM profit`
          }
        </span>
        <span className={`${
          isCompleted 
            ? 'text-green-500 dark:text-green-400' 
            : 'text-blue-500 dark:text-blue-400'
        }`}>
          {(progress * 100).toFixed(2)}%
        </span>
      </div>

      {/* Growth Rate */}
      {!isCompleted && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Growing at {profitPerSecond.toFixed(8)} CFM/second
          </p>
        </div>
      )}

      {/* Completion Status */}
      {isCompleted && (
        <motion.div
          className="mt-3 text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            🎉 Slot completed! Ready to claim {finalValue.toFixed(6)} CFM
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
