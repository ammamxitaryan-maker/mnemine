"use client";

import React from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  progress: number; // A value between 0 and 100
  className?: string;
  indicatorClassName?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className, indicatorClassName }) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={cn("w-full h-2 bg-gray-700 rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full bg-primary transition-all duration-500 ease-out", indicatorClassName)}
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};

export default ProgressBar;