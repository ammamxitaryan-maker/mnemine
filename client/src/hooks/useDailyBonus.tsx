import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface DailyBonusStatus {
  canClaim: boolean;
  nextClaimAt: string | null;
}

const fetchDailyBonusStatus = async (telegramId: string): Promise<DailyBonusStatus> => {
  const { data } = await api.get(`/user/${telegramId}/daily-bonus`);
  return data;
};

const claimDailyBonus = async (telegramId: string) => {
  const { data } = await api.post(`/user/${telegramId}/daily-bonus/claim`);
  return data;
};

export const useDailyBonus = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading, error } = useQuery<DailyBonusStatus, Error>({ // Указан тип для data и error
    queryKey: ['dailyBonusStatus', user?.telegramId],
    queryFn: () => fetchDailyBonusStatus(user!.telegramId),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
    // onError удален из опций useQuery
  });

  // Логирование ошибки, если она есть
  if (error) {
    console.error(`[useDailyBonus] Error fetching status for ${user?.telegramId}:`, error);
  }

  const mutation = useMutation({
    mutationFn: () => claimDailyBonus(user!.telegramId),
    onMutate: async () => {
      const toastId = showLoading('Claiming daily bonus...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Daily bonus claimed!');
      queryClient.invalidateQueries({ queryKey: ['dailyBonusStatus', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
    },
    onError: (err: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = err.response?.data?.error || 'Failed to claim bonus.';
      showError(errorMessage);
      console.error(`[useDailyBonus] Error claiming bonus for ${user?.telegramId}:`, err); // Добавлено логирование ошибок
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