import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface UserStats {
  totalEarnings: number;
  totalSpending: number;
  referralCount: number;
  activeReferralCount: number; // New field
  tasksCompleted: number;
  slotsOwned: number;
  boostersPurchased: number;
  totalInvested: number; // New field
  isEligible: boolean; // NEW: User eligibility status
  isSuspicious: boolean; // NEW: User suspicious status
  rank: string | null; // NEW: User rank
  totalSystemWithdrawals: number; // NEW: Total system withdrawals
}

const fetchStatsData = async (telegramId: string): Promise<UserStats> => {
  const { data } = await api.get(`/user/${telegramId}/stats`);
  return data;
};

export const useStatsData = (telegramId: string | undefined) => {
  return useQuery<UserStats, Error>({
    queryKey: ['stats', telegramId],
    queryFn: () => fetchStatsData(telegramId!),
    enabled: !!telegramId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};