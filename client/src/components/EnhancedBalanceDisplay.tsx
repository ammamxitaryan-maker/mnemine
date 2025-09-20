import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedProfitDisplay from './AnimatedProfitDisplay';

interface EnhancedBalanceDisplayProps {
  balance: number;
  currency?: string;
  dailyChange?: number;
  weeklyChange?: number;
  monthlyChange?: number;
  isLoading?: boolean;
  showDetails?: boolean;
}

export const EnhancedBalanceDisplay: React.FC<EnhancedBalanceDisplayProps> = ({
  balance,
  currency = 'CFM',
  dailyChange = 0,
  weeklyChange = 0,
  monthlyChange = 0,
  isLoading = false,
  showDetails = true
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [animatedBalance, setAnimatedBalance] = useState(0);

  // Animate balance changes
  useEffect(() => {
    if (isLoading) return;
    
    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;
    const increment = balance / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setAnimatedBalance(Math.min(increment * currentStep, balance));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedBalance(balance);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [balance, isLoading]);

  const formatBalance = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${(amount / 1000).toFixed(1)}K`;
    }
    return amount.toFixed(2);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4" />;
    if (change < 0) return <TrendingDown className="w-4 h-4" />;
    return null;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Total Balance
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            {isVisible ? (
              <Eye className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <EyeOff className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {isVisible ? (
                <AnimatedProfitDisplay
                  baseValue={animatedBalance}
                  weeklyGrowthRate={0}
                  currencySymbol={currency}
                />
              ) : (
                <span className="text-4xl font-bold">••••••</span>
              )}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {isVisible ? 'Available Balance' : 'Balance Hidden'}
            </p>
          </div>

          {showDetails && isVisible && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <div className={`flex items-center justify-center space-x-1 ${getChangeColor(dailyChange)}`}>
                  {getChangeIcon(dailyChange)}
                  <span className="text-sm font-medium">
                    {dailyChange > 0 ? '+' : ''}{dailyChange.toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">24h</p>
              </div>
              
              <div className="text-center">
                <div className={`flex items-center justify-center space-x-1 ${getChangeColor(weeklyChange)}`}>
                  {getChangeIcon(weeklyChange)}
                  <span className="text-sm font-medium">
                    {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">7d</p>
              </div>
              
              <div className="text-center">
                <div className={`flex items-center justify-center space-x-1 ${getChangeColor(monthlyChange)}`}>
                  {getChangeIcon(monthlyChange)}
                  <span className="text-sm font-medium">
                    {monthlyChange > 0 ? '+' : ''}{monthlyChange.toFixed(2)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">30d</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const MiniBalanceCard: React.FC<{
  balance: number;
  currency?: string;
  change?: number;
  isLoading?: boolean;
}> = ({ balance, currency = 'CFM', change = 0, isLoading = false }) => {
  const [animatedBalance, setAnimatedBalance] = useState(0);

  useEffect(() => {
    if (isLoading) return;
    
    const duration = 800;
    const steps = 40;
    const stepDuration = duration / steps;
    const increment = balance / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setAnimatedBalance(Math.min(increment * currentStep, balance));
      
      if (currentStep >= steps) {
        clearInterval(timer);
        setAnimatedBalance(balance);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [balance, isLoading]);

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
        <div className="h-6 bg-white/20 rounded w-1/2"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-4 text-white">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">Balance</p>
          <p className="text-xl font-bold">
            <AnimatedProfitDisplay
              baseValue={animatedBalance}
              weeklyGrowthRate={0}
              currencySymbol={currency}
            />
          </p>
        </div>
        {change !== 0 && (
          <div className={`flex items-center space-x-1 ${change > 0 ? 'text-green-200' : 'text-red-200'}`}>
            {change > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {change > 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
