import { useEffect, useState } from 'react';
import { useExchangeRate } from './useSwap';

interface CachedRateData {
  rate: number;
  lastUpdated: number;
  isStale: boolean;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const STALE_DURATION = 10 * 60 * 1000; // 10 minutes stale

export const useCachedExchangeRate = (telegramId: string) => {
  const { data: rateData, isLoading } = useExchangeRate(telegramId);
  const [cachedRate, setCachedRate] = useState<CachedRateData | null>(null);

  useEffect(() => {
    if (rateData?.rate) {
      const now = Date.now();
      setCachedRate({
        rate: rateData.rate,
        lastUpdated: now,
        isStale: false
      });
    }
  }, [rateData]);

  const getCachedRate = (): CachedRateData | null => {
    if (!cachedRate) return null;

    const now = Date.now();
    const timeSinceUpdate = now - cachedRate.lastUpdated;

    return {
      ...cachedRate,
      isStale: timeSinceUpdate > STALE_DURATION
    };
  };

  const convertNONToUSD = (nonAmount: number): number => {
    const cached = getCachedRate();
    if (!cached) return 0;
    return nonAmount * cached.rate;
  };

  return {
    rate: cachedRate?.rate || 0,
    isLoading,
    isStale: cachedRate ? (Date.now() - cachedRate.lastUpdated) > STALE_DURATION : false,
    convertNONToUSD,
    lastUpdated: cachedRate?.lastUpdated || 0
  };
};
