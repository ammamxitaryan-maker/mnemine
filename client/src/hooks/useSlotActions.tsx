import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { getErrorMessage } from '@/types/errors';

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
      if (context) {
        dismissToast(context);
      }
      showSuccess(data.message || 'Slot upgraded successfully!');
      onActionSuccess();
    },
    onError: (error: unknown, _variables, context) => {
      if (context) {
        dismissToast(context);
      }
      const errorMessage = getErrorMessage(error, 'Failed to upgrade slot.');
      showError(errorMessage);
    },
  });

  const extendMutation = useMutation({
    mutationFn: extendSlot,
    onMutate: () => showLoading('Extending slot...'),
    onSuccess: (data, _variables, context) => {
      if (context) {
        dismissToast(context);
      }
      showSuccess(data.message || 'Slot extended successfully!');
      onActionSuccess();
    },
    onError: (error: unknown, _variables, context) => {
      if (context) {
        dismissToast(context);
      }
      const errorMessage = getErrorMessage(error, 'Failed to extend slot.');
      showError(errorMessage);
    },
  });

  return {
    upgrade: upgradeMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
    extend: extendMutation.mutate,
    isExtending: extendMutation.isPending,
  };
};