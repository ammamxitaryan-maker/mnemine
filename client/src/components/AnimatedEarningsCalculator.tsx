"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, TrendingUp, Clock, DollarSign } from 'lucide-react';
import { SmartCard } from '@/components/ui/smart-card';
import { Input } from '@/components/ui/input';

interface AnimatedEarningsCalculatorProps {
  currentBalance: number;
  onInvest?: (amount: number) => void;
}

export const AnimatedEarningsCalculator: React.FC<AnimatedEarningsCalculatorProps> = ({
  currentBalance,
  onInvest
}) => {
  const [investmentAmount, setInvestmentAmount] = useState<string>('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const amount = parseFloat(investmentAmount) || 0;
  const isValidAmount = amount > 0 && amount <= currentBalance;
  const weeklyReturn = 0.30; // 30% return
  const totalReturn = amount * weeklyReturn;
  const finalAmount = amount + totalReturn;

  // Animate when amount changes significantly
  useEffect(() => {
    if (amount > 0) {
      setIsAnimating(true);
      setShowResults(true);
      setTimeout(() => setIsAnimating(false), 1000);
    } else {
      setShowResults(false);
    }
  }, [amount]);

  const handleInvest = () => {
    if (isValidAmount && onInvest) {
      onInvest(amount);
      setInvestmentAmount('');
      setShowResults(false);
    }
  };

  const setMaxAmount = () => {
    setInvestmentAmount(currentBalance.toFixed(4));
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(4);
  };

  return (
    <SmartCard
      title="Earnings Calculator"
      icon={Calculator}
      iconColor="from-blue-500 to-indigo-600"
      variant="glass"
    >
      <div className="space-y-6">
        {/* Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Investment Amount (CFM)
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Enter amount"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="flex-1"
                min="0"
                max={currentBalance}
                step="0.0001"
              />
              <motion.button
                onClick={setMaxAmount}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Max
              </motion.button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Available: {formatCurrency(currentBalance)} CFM
            </p>
          </div>

          {/* Investment Button */}
          <motion.button
            onClick={handleInvest}
            disabled={!isValidAmount}
            className={`w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 ${
              isValidAmount
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
            }`}
            whileHover={isValidAmount ? { scale: 1.02 } : {}}
            whileTap={isValidAmount ? { scale: 0.98 } : {}}
          >
            {isValidAmount ? 'Invest Now' : 'Enter Valid Amount'}
          </motion.button>
        </div>

        {/* Results Section */}
        <AnimatePresence>
          {showResults && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              {/* Investment Timeline */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Investment Timeline (7 days)
                </h4>
                
                <div className="space-y-3">
                  {/* Day 0 - Investment */}
                  <motion.div
                    className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium">Day 0 - Investment</span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      -{formatCurrency(amount)} CFM
                    </span>
                  </motion.div>

                  {/* Day 7 - Return */}
                  <motion.div
                    className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium">Day 7 - Return</span>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      +{formatCurrency(finalAmount)} CFM
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Earnings Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <motion.div
                  className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(amount)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Initial Investment</p>
                </motion.div>

                <motion.div
                  className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalReturn)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Profit (30%)</p>
                </motion.div>

                <motion.div
                  className="text-center p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(finalAmount)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Final Amount</p>
                </motion.div>
              </div>

              {/* Animated Progress Bar */}
              <motion.div
                className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                    Return Progress
                  </span>
                  <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                    30% Fixed Return
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <motion.div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 2, delay: 1.3, ease: "easeOut" }}
                  />
                </div>
                
                <div className="text-center mt-2">
                  <span className="text-xs text-purple-600 dark:text-purple-400">
                    Guaranteed 30% return over 7 days
                  </span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SmartCard>
  );
};
