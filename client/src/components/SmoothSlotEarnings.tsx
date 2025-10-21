"use client";

import { useSmoothEarnings } from '@/hooks/useSmoothNumber';

interface SmoothSlotEarningsProps {
  earnings: number;
  className?: string;
  showPlus?: boolean;
}

export const SmoothSlotEarnings = ({ 
  earnings, 
  className = '', 
  showPlus = true 
}: SmoothSlotEarningsProps) => {
  const smoothEarnings = useSmoothEarnings(earnings);

  return (
    <span className={`transition-all duration-200 ${
      smoothEarnings.isAnimating ? 'scale-105' : 'scale-100'
    } ${className}`}>
      {showPlus && '+'}{smoothEarnings.formatted} NON
    </span>
  );
};
