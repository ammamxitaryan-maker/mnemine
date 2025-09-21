import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCallback, useEffect, useRef } from 'react';

// Cache keys for localStorage
const CACHE_KEYS = {
  USER_DATA: 'mnemine_user_data',
  SLOTS_DATA: 'mnemine_slots_data',
  TASKS_DATA: 'mnemine_tasks_data',
  LOTTERY_DATA: 'mnemine_lottery_data',
  BONUSES_DATA: 'mnemine_bonuses_data',
  ACHIEVEMENTS_DATA: 'mnemine_achievements_data',
  MARKET_DATA: 'mnemine_market_data',
} as const;

// Cache expiration time (10 minutes)
const CACHE_EXPIRY = 10 * 60 * 1000;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

// Cache utilities
const getCachedData = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;
    
    const item: CacheItem<T> = JSON.parse(cached);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - item.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }
    
    return item.data;
  } catch (error) {
    console.warn(`Failed to parse cached data for ${key}:`, error);
    localStorage.removeItem(key);
    return null;
  }
};

const setCachedData = <T>(key: string, data: T): void => {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      version: '1.0'
    };
    localStorage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.warn(`Failed to cache data for ${key}:`, error);
  }
};

// Optimized user data hook with instant cache loading
export const useOptimizedUserData = (telegramId: string | undefined) => {
  const queryClient = useQueryClient();
  const cacheKey = `${CACHE_KEYS.USER_DATA}_${telegramId}`;
  
  // Get cached data immediately
  const cachedData = getCachedData(cacheKey);
  
  const query = useQuery({
    queryKey: ['optimized-user', telegramId],
    queryFn: async () => {
      const { data } = await api.get(`/user/${telegramId}/data`);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: !!telegramId,
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 5000, // 5 seconds
    gcTime: 60000, // 1 minute
    initialData: cachedData || undefined,
    initialDataUpdatedAt: cachedData ? Date.now() - 1000 : undefined,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !cachedData,
    error: query.error,
    refetch: query.refetch,
    isStale: query.isStale,
  };
};

// Optimized slots data hook
export const useOptimizedSlotsData = (telegramId: string | undefined) => {
  const cacheKey = `${CACHE_KEYS.SLOTS_DATA}_${telegramId}`;
  const cachedData = getCachedData(cacheKey);
  
  const query = useQuery({
    queryKey: ['optimized-slots', telegramId],
    queryFn: async () => {
      if (!telegramId) return [];
      const { data } = await api.get(`/user/${telegramId}/slots`);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: !!telegramId,
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 5000,
    gcTime: 60000,
    initialData: cachedData || undefined,
    initialDataUpdatedAt: cachedData ? Date.now() - 1000 : undefined,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading && !cachedData,
    error: query.error,
    refetch: query.refetch,
  };
};

// Optimized tasks data hook
export const useOptimizedTasksData = (telegramId: string | undefined) => {
  const cacheKey = `${CACHE_KEYS.TASKS_DATA}_${telegramId}`;
  const cachedData = getCachedData(cacheKey);
  
  const query = useQuery({
    queryKey: ['optimized-tasks', telegramId],
    queryFn: async () => {
      if (!telegramId) return [];
      const { data } = await api.get(`/tasks/${telegramId}`);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: !!telegramId,
    refetchInterval: 30000, // 30 seconds (tasks change less frequently)
    refetchIntervalInBackground: true,
    staleTime: 15000,
    gcTime: 120000, // 2 minutes
    initialData: cachedData || undefined,
    initialDataUpdatedAt: cachedData ? Date.now() - 1000 : undefined,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading && !cachedData,
    error: query.error,
    refetch: query.refetch,
  };
};

// Optimized lottery data hook
export const useOptimizedLotteryData = () => {
  const cacheKey = CACHE_KEYS.LOTTERY_DATA;
  const cachedData = getCachedData(cacheKey);
  
  const query = useQuery({
    queryKey: ['optimized-lottery'],
    queryFn: async () => {
      const { data } = await api.get('/lottery/status');
      setCachedData(cacheKey, data);
      return data;
    },
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 15000,
    gcTime: 120000,
    initialData: cachedData || undefined,
    initialDataUpdatedAt: cachedData ? Date.now() - 1000 : undefined,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !cachedData,
    error: query.error,
    refetch: query.refetch,
  };
};

// Optimized bonuses summary hook
export const useOptimizedBonusesSummary = (telegramId: string | undefined) => {
  const cacheKey = `${CACHE_KEYS.BONUSES_DATA}_${telegramId}`;
  const cachedData = getCachedData(cacheKey);
  
  const query = useQuery({
    queryKey: ['optimized-bonuses', telegramId],
    queryFn: async () => {
      if (!telegramId) return { claimableCount: 0 };
      const { data } = await api.get(`/user/${telegramId}/bonuses/summary`);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: !!telegramId,
    refetchInterval: 30000, // 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 15000,
    gcTime: 120000,
    initialData: cachedData || undefined,
    initialDataUpdatedAt: cachedData ? Date.now() - 1000 : undefined,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !cachedData,
    error: query.error,
    refetch: query.refetch,
  };
};

// Optimized achievements hook
export const useOptimizedAchievements = (telegramId: string | undefined) => {
  const cacheKey = `${CACHE_KEYS.ACHIEVEMENTS_DATA}_${telegramId}`;
  const cachedData = getCachedData(cacheKey);
  
  const query = useQuery({
    queryKey: ['optimized-achievements', telegramId],
    queryFn: async () => {
      if (!telegramId) return [];
      const { data } = await api.get(`/user/${telegramId}/achievements`);
      setCachedData(cacheKey, data);
      return data;
    },
    enabled: !!telegramId,
    refetchInterval: 60000, // 1 minute (achievements change rarely)
    refetchIntervalInBackground: true,
    staleTime: 30000,
    gcTime: 300000, // 5 minutes
    initialData: cachedData || undefined,
    initialDataUpdatedAt: cachedData ? Date.now() - 1000 : undefined,
  });

  return {
    data: query.data || [],
    isLoading: query.isLoading && !cachedData,
    error: query.error,
    refetch: query.refetch,
  };
};

// Optimized market data hook
export const useOptimizedMarketData = () => {
  const cacheKey = CACHE_KEYS.MARKET_DATA;
  const cachedData = getCachedData(cacheKey);
  
  const query = useQuery({
    queryKey: ['optimized-market'],
    queryFn: async () => {
      const { data } = await api.get('/realtime/market');
      setCachedData(cacheKey, data);
      return data;
    },
    refetchInterval: 10000, // 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 5000,
    gcTime: 60000,
    initialData: cachedData || undefined,
    initialDataUpdatedAt: cachedData ? Date.now() - 1000 : undefined,
  });

  return {
    data: query.data,
    isLoading: query.isLoading && !cachedData,
    error: query.error,
    refetch: query.refetch,
  };
};

// Combined optimized dashboard hook
export const useOptimizedDashboard = (telegramId: string | undefined) => {
  const userData = useOptimizedUserData(telegramId);
  const slotsData = useOptimizedSlotsData(telegramId);
  const tasksData = useOptimizedTasksData(telegramId);
  const lotteryData = useOptimizedLotteryData();
  const bonusesData = useOptimizedBonusesSummary(telegramId);
  const achievementsData = useOptimizedAchievements(telegramId);
  const marketData = useOptimizedMarketData();

  // Only show loading if we don't have any cached data
  const hasAnyCachedData = userData.data || slotsData.data || tasksData.data || 
                          lotteryData.data || bonusesData.data || achievementsData.data || marketData.data;
  
  const isLoading = !hasAnyCachedData && (
    userData.isLoading || slotsData.isLoading || tasksData.isLoading || 
    lotteryData.isLoading || bonusesData.isLoading || achievementsData.isLoading || marketData.isLoading
  );

  const hasError = userData.error || slotsData.error || tasksData.error || 
                  lotteryData.error || bonusesData.error || achievementsData.error || marketData.error;

  const refetchAll = useCallback(() => {
    userData.refetch();
    slotsData.refetch();
    tasksData.refetch();
    lotteryData.refetch();
    bonusesData.refetch();
    achievementsData.refetch();
    marketData.refetch();
  }, [userData, slotsData, tasksData, lotteryData, bonusesData, achievementsData, marketData]);

  return {
    userData: userData.data,
    slotsData: slotsData.data,
    tasksData: tasksData.data,
    lotteryData: lotteryData.data,
    bonusesData: bonusesData.data,
    achievementsData: achievementsData.data,
    marketData: marketData.data,
    isLoading,
    hasError,
    refetchAll,
    // Individual loading states for fine-grained control
    loadingStates: {
      userData: userData.isLoading,
      slotsData: slotsData.isLoading,
      tasksData: tasksData.isLoading,
      lotteryData: lotteryData.isLoading,
      bonusesData: bonusesData.isLoading,
      achievementsData: achievementsData.isLoading,
      marketData: marketData.isLoading,
    }
  };
};

// Background sync hook for periodic updates
export const useBackgroundSync = (telegramId: string | undefined) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!telegramId) return;

    // Start background sync every 10 seconds
    intervalRef.current = setInterval(() => {
      // Invalidate and refetch all queries
      queryClient.invalidateQueries({ queryKey: ['optimized-user', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['optimized-slots', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['optimized-tasks', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['optimized-bonuses', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['optimized-achievements', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['optimized-lottery'] });
      queryClient.invalidateQueries({ queryKey: ['optimized-market'] });
    }, 10000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [telegramId, queryClient]);
};
