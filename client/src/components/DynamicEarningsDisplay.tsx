"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Clock, DollarSign } from 'lucide-react';
import { SmartCard } from '@/components/ui/smart-card';
import { PreciseEarningsAnimation } from '@/components/PreciseEarningsAnimation';

interface DynamicEarningsDisplayProps {
  totalInvested: number;
  activeSlots: Array<{
    id: string;
    amount: number;
    startDate: string;
    expiresAt: string;
    isActive: boolean;
  }>;
  currentBalance: number;
}

interface EarningSlot {
  id: string;
  amount: number;
  startDate: Date;
  expiresAt: Date;
  currentEarnings: number;
  totalEarnings: number;
  progress: number;
  timeRemaining: number;
}

export const DynamicEarningsDisplay: React.FC<DynamicEarningsDisplayProps> = ({
  totalInvested,
  activeSlots,
  currentBalance
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate earnings for each slot - each slot earns 30% individually
  const earningSlots = useMemo(() => {
    return activeSlots
      .filter(slot => slot.isActive)
      .map(slot => {
        const startDate = new Date(slot.startDate);
        const expiresAt = new Date(slot.expiresAt);
        const totalDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
        const elapsed = currentTime.getTime() - startDate.getTime();
        const progress = Math.min(elapsed / totalDuration, 1);
        
        // Each slot earns 30% of its own amount over 7 days
        const slotProfit = slot.amount * 0.30; // 30% profit
        const totalSlotValue = slot.amount + slotProfit; // Final value (130% of investment)
        
        // Calculate current value with high precision for smooth animation
        const currentSlotValue = slot.amount + (slotProfit * progress);
        const timeRemaining = Math.max(expiresAt.getTime() - currentTime.getTime(), 0);
        const isCompleted = timeRemaining <= 0;

        return {
          id: slot.id,
          investmentAmount: slot.amount,
          startDate,
          expiresAt,
          currentSlotValue: isCompleted ? totalSlotValue : currentSlotValue,
          totalSlotValue,
          currentProfit: slotProfit * progress,
          totalProfit: slotProfit,
          progress,
          timeRemaining,
          isCompleted
        };
      });
  }, [activeSlots, currentTime]);

  // Calculate total earnings - sum of all slot values
  const totalCurrentSlotValue = useMemo(() => {
    return earningSlots.reduce((sum, slot) => sum + slot.currentSlotValue, 0);
  }, [earningSlots]);

  const totalProjectedSlotValue = useMemo(() => {
    return earningSlots.reduce((sum, slot) => sum + slot.totalSlotValue, 0);
  }, [earningSlots]);

  const totalCurrentProfit = useMemo(() => {
    return earningSlots.reduce((sum, slot) => sum + slot.currentProfit, 0);
  }, [earningSlots]);

  const totalProjectedProfit = useMemo(() => {
    return earningSlots.reduce((sum, slot) => sum + slot.totalProfit, 0);
  }, [earningSlots]);

  // Balance calculations
  const totalFutureBalance = currentBalance + totalCurrentSlotValue;
  const totalProjectedBalance = currentBalance + totalProjectedSlotValue;

  // Format time remaining
  const formatTimeRemaining = (milliseconds: number) => {
    if (milliseconds <= 0) return 'Completed';
    
    const days = Math.floor(milliseconds / (24 * 60 * 60 * 1000));
    const hours = Math.floor((milliseconds % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Trigger animation when earnings change significantly
  useEffect(() => {
    const lastEarnings = localStorage.getItem('lastEarnings');
    const currentEarnings = totalCurrentSlotValue.toFixed(2);
    
    if (lastEarnings && Math.abs(parseFloat(lastEarnings) - parseFloat(currentEarnings)) > 0.01) {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 2000);
    }
    
    localStorage.setItem('lastEarnings', currentEarnings);
  }, [totalCurrentSlotValue]);

  return (
    <div className="space-y-6">
      {/* Main Earnings Overview */}
      <SmartCard
        title="Dynamic Earnings"
        icon={TrendingUp}
        iconColor="from-green-500 to-emerald-600"
        variant="glass"
      >
        <div className="space-y-6">
          {/* Current Balance with Earnings */}
          <motion.div 
            className="text-center p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl"
            animate={isAnimating ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              <span className="text-lg font-medium text-green-800 dark:text-green-200">Current Balance</span>
            </div>
            <motion.p 
              className="text-4xl font-bold text-green-600 dark:text-green-400"
              key={totalFutureBalance.toFixed(4)}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {totalFutureBalance.toFixed(4)} CFM
            </motion.p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Base: {currentBalance.toFixed(4)} + Slots: {totalCurrentSlotValue.toFixed(4)}
            </p>
          </motion.div>

          {/* Earnings Progress */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Total Projected Profit</span>
              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                {totalProjectedProfit.toFixed(4)} CFM
              </span>
            </div>
            
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <motion.div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalCurrentProfit / totalProjectedProfit) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            
            <div className="text-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {((totalCurrentProfit / totalProjectedProfit) * 100).toFixed(1)}% of total profit earned
              </span>
            </div>
          </div>

          {/* Projected Final Balance */}
          <motion.div 
            className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Projected Final Balance</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalProjectedBalance.toFixed(4)} CFM
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              +{totalProjectedProfit.toFixed(4)} CFM profit
            </p>
          </motion.div>
        </div>
      </SmartCard>

      {/* Individual Slot Earnings */}
      {earningSlots.length > 0 && (
        <SmartCard
          title="Active Investments"
          icon={Clock}
          iconColor="from-blue-500 to-indigo-600"
          variant="glass"
        >
          <div className="space-y-4">
            {earningSlots.map((slot, index) => (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <PreciseEarningsAnimation
                  investmentAmount={slot.investmentAmount}
                  startTime={slot.startDate}
                  duration={7 * 24 * 60 * 60 * 1000} // 7 days in milliseconds
                  isActive={!slot.isCompleted}
                  slotId={slot.id}
                />
              </motion.div>
            ))}
          </div>
        </SmartCard>
      )}

      {/* Investment Summary */}
      <SmartCard
        title="Investment Summary"
        icon={DollarSign}
        iconColor="from-purple-500 to-pink-600"
        variant="glass"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalInvested.toFixed(4)}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Invested</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {earningSlots.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Slots</p>
          </div>
        </div>
      </SmartCard>
    </div>
  );
};
