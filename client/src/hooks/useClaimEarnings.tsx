import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const claimEarnings = async (telegramId: string) => {
  const { data } = await api.post(`/user/${telegramId}/claim`);
  return data;
};

export const useClaimEarnings = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => claimEarnings(user!.telegramId),
    onMutate: async () => {
      const toastId = showLoading('Claiming earnings...');
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess(`Claimed ${data.claimedAmount.toFixed(6)} CFM!`);
      
      // Invalidate optimized queries for better performance
      queryClient.invalidateQueries({ queryKey: ['optimized-user', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Failed to claim earnings.';
      showError(errorMessage);
    },
  });

  return {
    claim: mutation.mutate,
    isClaiming: mutation.isPending,
  };
};