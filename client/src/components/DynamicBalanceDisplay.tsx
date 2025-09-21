import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';

interface DynamicBalanceDisplayProps {
  balance: number;
  activeSlots: any[];
  className?: string;
}

export const DynamicBalanceDisplay: React.FC<DynamicBalanceDisplayProps> = memo(({ 
  balance, 
  activeSlots, 
  className = '' 
}) => {
  const [displayBalance, setDisplayBalance] = useState(balance);
  const [isAnimating, setIsAnimating] = useState(false);
  const [earningsPerSecond, setEarningsPerSecond] = useState(0);
  const controls = useAnimation();

  // Calculate earnings per second from active slots
  useEffect(() => {
    const calculateEarningsRate = () => {
      const now = new Date();
      let totalEarningsPerSecond = 0;

      activeSlots.forEach(slot => {
        if (slot.isActive && new Date(slot.expiresAt) > now) {
          // 30% return over 7 days = 0.3 / (7 * 24 * 60 * 60) per second
          const earningsPerSecond = (slot.principal * 0.3) / (7 * 24 * 60 * 60);
          totalEarningsPerSecond += earningsPerSecond;
        }
      });

      setEarningsPerSecond(totalEarningsPerSecond);
    };

    calculateEarningsRate();
  }, [activeSlots]);

  // Animate balance changes
  const animateBalanceChange = useCallback((newBalance: number) => {
    if (Math.abs(newBalance - displayBalance) < 0.0001) return;

    setIsAnimating(true);
    controls.start({
      scale: [1, 1.05, 1],
      transition: { duration: 0.3 }
    });

    setDisplayBalance(newBalance);
    
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [displayBalance, controls]);

  // Update display balance with smooth animation
  useEffect(() => {
    animateBalanceChange(balance);
  }, [balance, animateBalanceChange]);

  // Real-time earnings animation (client-side only for visual effect)
  useEffect(() => {
    if (earningsPerSecond <= 0) return;

    const interval = setInterval(() => {
      setDisplayBalance(prev => {
        const newBalance = prev + (earningsPerSecond * 0.1); // Update every 100ms
        return newBalance;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [earningsPerSecond]);

  // Format balance with appropriate precision
  const formatBalance = (value: number) => {
    if (value >= 1000) {
      return value.toFixed(2);
    } else if (value >= 1) {
      return value.toFixed(4);
    } else {
      return value.toFixed(6);
    }
  };

  // Get animation color based on earnings rate
  const getEarningsColor = () => {
    if (earningsPerSecond > 0.01) return 'text-green-500';
    if (earningsPerSecond > 0.001) return 'text-blue-500';
    return 'text-gray-500';
  };

  return (
    <motion.div
      className={`relative ${className}`}
      animate={controls}
    >
      {/* Main Balance Display */}
      <motion.div
        className="flex items-center justify-center space-x-2"
        animate={isAnimating ? { 
          scale: [1, 1.02, 1],
          textShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 10px rgba(59, 130, 246, 0.5)", "0 0 0px rgba(59, 130, 246, 0)"]
        } : {}}
        transition={{ duration: 0.3 }}
      >
        <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {formatBalance(displayBalance)}
        </span>
        <span className="text-sm text-gray-600 dark:text-gray-400">CFM</span>
      </motion.div>

      {/* Earnings Rate Indicator */}
      {earningsPerSecond > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center space-x-1 mt-2"
        >
          <TrendingUp className={`w-4 h-4 ${getEarningsColor()}`} />
          <span className={`text-sm font-medium ${getEarningsColor()}`}>
            +{(earningsPerSecond * 3600).toFixed(4)} CFM/hour
          </span>
          <Activity className={`w-3 h-3 ${getEarningsColor()} animate-pulse`} />
        </motion.div>
      )}

      {/* Active Slots Indicator */}
      {activeSlots.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center space-x-1 mt-1"
        >
          <div className="flex space-x-1">
            {activeSlots.slice(0, 3).map((_, index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-green-400 rounded-full"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.8, 1.2, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: index * 0.3
                }}
              />
            ))}
            {activeSlots.length > 3 && (
              <span className="text-xs text-gray-500 ml-1">
                +{activeSlots.length - 3}
              </span>
            )}
          </div>
        </motion.div>
      )}

      {/* Floating Earnings Particles (visual effect) */}
      {isAnimating && earningsPerSecond > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-green-500 text-xs font-bold"
              initial={{ 
                opacity: 1, 
                y: 0, 
                x: Math.random() * 20 - 10 
              }}
              animate={{ 
                opacity: 0, 
                y: -30, 
                x: Math.random() * 20 - 10 
              }}
              transition={{ 
                duration: 1, 
                delay: i * 0.1,
                ease: "easeOut"
              }}
            >
              +{(earningsPerSecond * 0.1).toFixed(4)}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
});

DynamicBalanceDisplay.displayName = 'DynamicBalanceDisplay';
