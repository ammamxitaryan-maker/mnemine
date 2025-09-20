import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ReferredUser {
  id: string;
  firstName: string | null;
  username: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  createdAt: string;
  totalInvested: number;
}

const fetchReferralList = async (telegramId: string): Promise<ReferredUser[]> => {
  const { data } = await api.get(`/user/${telegramId}/referrals/list`);
  return data;
};

export const useReferralList = (telegramId: string | undefined) => {
  return useQuery({
    queryKey: ['referralList', telegramId],
    queryFn: () => fetchReferralList(telegramId!),
    enabled: !!telegramId,
    refetchInterval: 60000, // Refetch every minute
  });
};