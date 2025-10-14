"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

interface AnimatedProfitDisplayProps {
  baseValue: number;
  weeklyGrowthRate: number; // e.g., 0.3 for 30%
  currencySymbol?: string;
}

const AnimatedProfitDisplay: React.FC<AnimatedProfitDisplayProps> = ({
  baseValue,
  weeklyGrowthRate,
  currencySymbol = '',
}) => {
  const [displayValue, setDisplayValue] = useState(baseValue);
  const lastBaseValue = useRef(baseValue);
  const animationFrameId = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // If the baseValue changes, reset the animation start time and current display value
    if (baseValue !== lastBaseValue.current) {
      setDisplayValue(baseValue);
      startTimeRef.current = Date.now();
      lastBaseValue.current = baseValue;
    }

    const animate = () => {
      const now = Date.now();
      const elapsedTime = now - startTimeRef.current; // milliseconds since last baseValue update
      const elapsedSeconds = elapsedTime / 1000;

      // Calculate the current projected value based on the base and elapsed time
      // Weekly growth rate needs to be converted to per-second growth
      const secondsInWeek = 7 * 24 * 60 * 60; // 604800 seconds
      const currentProjectedValue = baseValue * (1 + weeklyGrowthRate * (elapsedSeconds / secondsInWeek));

      setDisplayValue(currentProjectedValue);

      animationFrameId.current = requestAnimationFrame(animate);
    };

    // Start animation only if baseValue is a valid number
    if (typeof baseValue === 'number' && !isNaN(baseValue)) {
      animationFrameId.current = requestAnimationFrame(animate);
    }


    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [baseValue, weeklyGrowthRate]);

  return (
    <div className="flex items-baseline gap-2">
      <span className="font-bold text-2xl md:text-3xl text-primary">
        {currencySymbol}{currencySymbol ? ' ' : ''}{displayValue.toFixed(4)}
      </span>
      {/* You can uncomment the Info icon below if you want to add a tooltip or explanation */}
      {/* <Info className="w-4 h-4 text-gray-400 cursor-pointer" title="Projected profit based on weekly growth rate" /> */}
    </div>
  );
};

export default AnimatedProfitDisplay;