import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const reinvestEarnings = async (telegramId: string) => {
  const { data } = await api.post(`/user/${telegramId}/reinvest`);
  return data;
};

export const useReinvest = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => reinvestEarnings(user!.telegramId),
    onMutate: async () => {
      const toastId = showLoading('Reinvesting earnings...');
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess(data.message || 'Reinvestment successful!');
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['slotsData', user?.telegramId] });
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Failed to reinvest.';
      showError(errorMessage);
    },
  });

  return {
    reinvest: mutation.mutate,
    isReinvesting: mutation.isPending,
  };
};