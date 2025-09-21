"use client";

import { useEffect, useState, memo } from 'react';
import { Coins } from 'lucide-react';

interface AnimatedEarningsDisplayProps {
  earnings: number;
  isAnimating?: boolean;
}

export const AnimatedEarningsDisplay = memo(({ earnings, isAnimating = true }: AnimatedEarningsDisplayProps) => {
  const [displayValue, setDisplayValue] = useState(earnings);
  const [isIncreasing, setIsIncreasing] = useState(false);

  useEffect(() => {
    if (earnings > displayValue) {
      setIsIncreasing(true);
      const timer = setTimeout(() => {
        setDisplayValue(earnings);
        setIsIncreasing(false);
      }, 200);
      return () => clearTimeout(timer);
    } else {
      setDisplayValue(earnings);
    }
  }, [earnings, displayValue]);

  return (
    <div className="flex items-center justify-center">
      <Coins className={`w-6 h-6 mr-2 text-green-600 transition-colors duration-200 ${
        isIncreasing ? 'text-green-500 scale-110' : ''
      }`} />
      <p className={`text-2xl font-bold text-gray-800 transition-all duration-200 ${
        isIncreasing ? 'text-green-600 scale-105' : ''
      }`}>
        {displayValue.toFixed(8)}
      </p>
      {isAnimating && isIncreasing && (
        <span className="ml-2 text-green-500 text-sm animate-pulse">
          ↗
        </span>
      )}
    </div>
  );
});
