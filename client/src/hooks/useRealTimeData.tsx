import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Real-time user data hook
export const useRealTimeUserData = (telegramId: string) => {
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['realtime-user', telegramId],
    queryFn: async () => {
      const response = await api.get(`/realtime/user/${telegramId}`);
      return response.data;
    },
    refetchInterval: 30000, // Reduced to 30 seconds for better performance
    refetchIntervalInBackground: false, // Don't refetch when tab is not active
    staleTime: 20000, // Consider data stale after 20 seconds
    gcTime: 60000, // Keep in cache for 1 minute
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });


  return {
    userData: data,
    isLoading,
    error,
    refetch,
    lastUpdated: data?.lastUpdated,
    dataVersion: data?.dataVersion
  };
};

// Real-time market data hook
export const useRealTimeMarketData = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['realtime-market'],
    queryFn: async () => {
      const response = await api.get('/realtime/market');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
    refetchIntervalInBackground: true,
    staleTime: 20000, // Consider data stale after 20 seconds
    gcTime: 60000, // Keep in cache for 1 minute
  });


  return {
    marketData: data,
    isLoading,
    error,
    refetch,
    lastUpdated: data?.lastUpdated,
    dataVersion: data?.dataVersion
  };
};

// Real-time slots data hook
export const useRealTimeSlotsData = (telegramId: string) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['realtime-slots', telegramId],
    queryFn: async () => {
      const response = await api.get(`/realtime/slots/${telegramId}`);
      return response.data;
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    refetchIntervalInBackground: true,
    staleTime: 5000, // Consider data stale after 5 seconds
    gcTime: 20000, // Keep in cache for 20 seconds
  });


  return {
    slotsData: data?.slots || [],
    isLoading,
    error,
    refetch,
    lastUpdated: data?.lastUpdated,
    dataVersion: data?.dataVersion
  };
};

// Real-time activity feed hook
export const useRealTimeActivityFeed = (telegramId: string, limit = 20) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['realtime-activity', telegramId, limit],
    queryFn: async () => {
      const response = await api.get(`/realtime/activity/${telegramId}?limit=${limit}`);
      return response.data;
    },
    refetchInterval: 20000, // Refetch every 20 seconds
    refetchIntervalInBackground: true,
    staleTime: 15000, // Consider data stale after 15 seconds
    gcTime: 30000, // Keep in cache for 30 seconds
  });


  return {
    activities: data?.activities || [],
    isLoading,
    error,
    refetch,
    lastUpdated: data?.lastUpdated,
    dataVersion: data?.dataVersion
  };
};

// Real-time health check hook
export const useRealTimeHealthCheck = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['realtime-health'],
    queryFn: async () => {
      const response = await api.get('/realtime/health');
      return response.data;
    },
    refetchInterval: 60000, // Check every minute
    refetchIntervalInBackground: true,
    staleTime: 30000,
    gcTime: 120000,
  });

  return {
    healthStatus: data,
    isLoading,
    error,
    isHealthy: data?.status === 'healthy'
  };
};

// Combined real-time dashboard data hook
export const useRealTimeDashboard = (telegramId: string) => {
  const userData = useRealTimeUserData(telegramId);
  const marketData = useRealTimeMarketData();
  const slotsData = useRealTimeSlotsData(telegramId);
  const activityFeed = useRealTimeActivityFeed(telegramId, 10);
  const healthCheck = useRealTimeHealthCheck();

  const isLoading = userData.isLoading || marketData.isLoading || slotsData.isLoading;
  const hasError = userData.error || marketData.error || slotsData.error;

  return {
    userData: userData.userData,
    marketData: marketData.marketData,
    slotsData: slotsData.slotsData,
    activities: activityFeed.activities,
    healthStatus: healthCheck.healthStatus,
    isLoading,
    hasError,
    isHealthy: healthCheck.isHealthy,
    lastUpdated: Math.max(
      new Date(userData.lastUpdated || 0).getTime(),
      new Date(marketData.lastUpdated || 0).getTime(),
      new Date(slotsData.lastUpdated || 0).getTime()
    ),
    refetchAll: () => {
      userData.refetch();
      marketData.refetch();
      slotsData.refetch();
      activityFeed.refetch();
    }
  };
};