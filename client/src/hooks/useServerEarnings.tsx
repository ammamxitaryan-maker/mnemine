import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

interface ServerEarningsData {
  totalEarnings: number;
  perSecondRate: number;
  lastUpdate: string;
  slotsCount: number;
}

const fetchServerEarnings = async (telegramId: string): Promise<ServerEarningsData> => {
  const { data } = await api.get(`/user/${telegramId}/real-time-income`);
  return {
    totalEarnings: data.totalRealTimeEarnings || 0,
    perSecondRate: 0, // Will be calculated from slots
    lastUpdate: data.lastUpdated || new Date().toISOString(),
    slotsCount: data.activeSlots || 0,
  };
};

export const useServerEarnings = (telegramId: string | undefined) => {
  return useQuery<ServerEarningsData, Error>({
    queryKey: ['serverEarnings', telegramId],
    queryFn: () => fetchServerEarnings(telegramId!),
    enabled: !!telegramId,
    refetchInterval: 180000, // Refetch every 3 minutes (optimized)
    retry: 3,
    retryDelay: 1000,
    staleTime: 60000, // Consider data fresh for 1 minute
  });
};
