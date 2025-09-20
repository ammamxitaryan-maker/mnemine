import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface ReferralStreakBonusStatus {
  canClaim: boolean;
  referralCountIn3Days: number;
}

const fetchReferralStreakBonusStatus = async (telegramId: string): Promise<ReferralStreakBonusStatus> => {
  const { data } = await api.get(`/user/${telegramId}/referrals/streak-bonus-status`);
  return data;
};

const claimReferralStreakBonus = async (telegramId: string) => {
  const { data } = await api.post(`/user/${telegramId}/referrals/claim-streak-bonus`);
  return data;
};

export const useReferralStreakBonus = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading, error } = useQuery<ReferralStreakBonusStatus, Error>({
    queryKey: ['referralStreakBonusStatus', user?.telegramId],
    queryFn: () => fetchReferralStreakBonusStatus(user!.telegramId),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute to update status
  });

  if (error) {
    console.error(`[useReferralStreakBonus] Error fetching status for ${user?.telegramId}:`, error);
  }

  const mutation = useMutation({
    mutationFn: () => claimReferralStreakBonus(user!.telegramId),
    onMutate: async () => {
      const toastId = showLoading('Claiming referral streak bonus...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Referral streak bonus claimed!');
      queryClient.invalidateQueries({ queryKey: ['referralStreakBonusStatus', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
    },
    onError: (err: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = err.response?.data?.error || 'Failed to claim referral streak bonus.';
      showError(errorMessage);
      console.error(`[useReferralStreakBonus] Error claiming bonus for ${user?.telegramId}:`, err);
    },
  });

  return {
    status,
    isLoading,
    error,
    claim: mutation.mutate,
    isClaiming: mutation.isPending,
  };
};