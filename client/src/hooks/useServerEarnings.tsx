import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

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
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: 3,
    retryDelay: 1000,
    staleTime: 15000, // Consider data stale after 15 seconds
  });
};
