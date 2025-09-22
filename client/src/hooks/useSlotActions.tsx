/**
 * BUG FIX: Fixed dismissToast calls to properly handle undefined context
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

const upgradeSlot = async ({ telegramId, slotId, amount }: { telegramId: string, slotId: string, amount: number }) => {
  const { data } = await api.post(`/user/${telegramId}/slots/${slotId}/upgrade`, { amount });
  return data;
};

const extendSlot = async ({ telegramId, slotId }: { telegramId: string, slotId: string }) => {
  const { data } = await api.post(`/user/${telegramId}/slots/${slotId}/extend`);
  return data;
};

export const useSlotActions = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();

  const onActionSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['slotsData', user?.telegramId] });
    queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
    queryClient.invalidateQueries({ queryKey: ['stats', user?.telegramId] });
    queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
  };

  const upgradeMutation = useMutation({
    mutationFn: upgradeSlot,
    onMutate: () => showLoading('Upgrading slot...'),
    onSuccess: (data, _variables, context) => {
      dismissToast(context as any);
      showSuccess(data.message || 'Slot upgraded successfully!');
      onActionSuccess();
    },
    onError: (error: any, _variables, context) => {
      dismissToast(context as any);
      showError(error.response?.data?.error || 'Failed to upgrade slot.');
    },
  });

  const extendMutation = useMutation({
    mutationFn: extendSlot,
    onMutate: () => showLoading('Extending slot...'),
    onSuccess: (data, _variables, context) => {
      dismissToast(context as any);
      showSuccess(data.message || 'Slot extended successfully!');
      onActionSuccess();
    },
    onError: (error: any, _variables, context) => {
      dismissToast(context as any);
      showError(error.response?.data?.error || 'Failed to extend slot.');
    },
  });

  return {
    upgrade: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
    extend: extendMutation.mutate,
    isExtending: extendMutation.isPending,
  };
};