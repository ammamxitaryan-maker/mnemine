import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export const useCountdown = (targetDate: string | null) => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
      return;
    }

    const calculateTimeLeft = () => {
      const target = new Date(targetDate);
      const now = new Date();
      const totalSeconds = differenceInSeconds(target, now);

      if (totalSeconds <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 });
        return;
      }

      const days = Math.floor(totalSeconds / (60 * 60 * 24));
      const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = totalSeconds % 60;

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        totalSeconds,
      });
    };

    calculateTimeLeft(); // Initial calculation
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};