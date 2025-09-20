import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ReferralData {
  referralCode: string;
  referralCount: number;
}

const fetchReferralData = async (telegramId: string): Promise<ReferralData> => {
  const { data } = await api.get(`/user/${telegramId}/referrals`);
  return data;
};

export const useReferralData = (telegramId: string | undefined) => {
  return useQuery<ReferralData, Error>({
    queryKey: ['referralData', telegramId],
    queryFn: () => fetchReferralData(telegramId!),
    enabled: !!telegramId,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
};