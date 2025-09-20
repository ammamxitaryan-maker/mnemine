import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';

interface BonusesSummary {
  claimableCount: number;
}

const fetchBonusesSummary = async (telegramId: string): Promise<BonusesSummary> => {
  const { data } = await api.get(`/user/${telegramId}/bonuses/summary`);
  return data;
};

export const useBonusesSummary = () => {
  const { user } = useTelegramAuth();

  return useQuery<BonusesSummary, Error>({
    queryKey: ['bonusesSummary', user?.telegramId],
    queryFn: () => fetchBonusesSummary(user!.telegramId),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
  });
};