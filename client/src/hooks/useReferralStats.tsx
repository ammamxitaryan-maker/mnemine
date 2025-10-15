import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ReferralStats {
  totalReferralEarnings: number;
  activeReferralsCount: number;
  referralsByLevel: {
    l1: number;
    l2: number;
  };
}

const fetchReferralStats = async (telegramId: string): Promise<ReferralStats> => {
  const { data } = await api.get(`/user/${telegramId}/referrals/stats`);
  return data;
};

export const useReferralStats = (telegramId: string | undefined) => {
  return useQuery<ReferralStats, Error>({
    queryKey: ['referralStats', telegramId],
    queryFn: () => fetchReferralStats(telegramId!),
    enabled: !!telegramId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};