import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { getErrorMessage } from '@/types/errors';

interface DividendsStatus {
  canClaim: boolean;
  nextClaimAt: string | null;
  estimatedAmount: string;
}

const fetchDividendsStatus = async (telegramId: string): Promise<DividendsStatus> => {
  const { data } = await api.get(`/user/${telegramId}/dividends-status`);
  return data;
};

const claimDividends = async (telegramId: string) => {
  const { data } = await api.post(`/user/${telegramId}/claim-dividends`);
  return data;
};

export const useDividendsBonus = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading, error } = useQuery<DividendsStatus, Error>({
    queryKey: ['dividendsStatus', user?.telegramId],
    queryFn: () => fetchDividendsStatus(user!.telegramId),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute to update status
  });

  if (error) {
    console.error(`[useDividendsBonus] Error fetching status for ${user?.telegramId}:`, error);
  }

  const mutation = useMutation({
    mutationFn: () => claimDividends(user!.telegramId),
    onMutate: async () => {
      const toastId = showLoading('Claiming dividends...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Dividends claimed!');
      queryClient.invalidateQueries({ queryKey: ['dividendsStatus', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
    },
    onError: (err: unknown, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = getErrorMessage(err, 'Failed to claim dividends.');
      showError(errorMessage);
      console.error(`[useDividendsBonus] Error claiming dividends for ${user?.telegramId}:`, err);
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