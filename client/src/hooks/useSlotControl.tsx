import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSlotsData } from './useSlotsData';
import { useUserData } from './useUserData';
import { api } from '@/lib/api';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface SlotControlData {
  totalSlots: number;
  activeSlots: number;
  expiredSlots: number;
  totalInvested: number;
  totalEarnings: number;
  averageReturn: number;
  lastUpdate: string;
}

interface SlotAction {
  slotId: string;
  action: 'claim' | 'extend' | 'cancel';
  amount?: number;
}

export const useSlotControl = (telegramId: string | undefined) => {
  const queryClient = useQueryClient();
  const { data: slotsData, refetch: refetchSlots } = useSlotsData(telegramId);
  const { data: userData, refetch: refetchUserData } = useUserData(telegramId);

  // Get slot control data
  const slotControlData = useQuery<SlotControlData>({
    queryKey: ['slotControl', telegramId, slotsData],
    queryFn: () => {
      if (!slotsData) {
        return {
          totalSlots: 0,
          activeSlots: 0,
          expiredSlots: 0,
          totalInvested: 0,
          totalEarnings: 0,
          averageReturn: 0,
          lastUpdate: new Date().toISOString(),
        };
      }

      const now = new Date();
      const activeSlots = slotsData.filter(slot => 
        slot.isActive && new Date(slot.expiresAt) > now
      );
      const expiredSlots = slotsData.filter(slot => 
        !slot.isActive || new Date(slot.expiresAt) <= now
      );

      const totalInvested = activeSlots.reduce((sum, slot) => sum + (slot.principal || 0), 0);
      
      const totalEarnings = activeSlots.reduce((sum, slot) => {
        const lastAccrued = new Date(slot.lastAccruedAt);
        const timeElapsed = (now.getTime() - lastAccrued.getTime()) / 1000;
        
        if (timeElapsed > 0) {
          const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
          const earnings = earningsPerSecond * timeElapsed;
          return sum + earnings;
        }
        return sum;
      }, 0);

      const averageReturn = totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0;

      return {
        totalSlots: slotsData.length,
        activeSlots: activeSlots.length,
        expiredSlots: expiredSlots.length,
        totalInvested,
        totalEarnings,
        averageReturn,
        lastUpdate: new Date().toISOString(),
      };
    },
    enabled: !!telegramId && !!slotsData,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000,
  });

  // Claim earnings from a slot
  const claimEarningsMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { data } = await api.post(`/slots/${slotId}/claim`);
      return data;
    },
    onMutate: async () => {
      const toastId = showLoading('Claiming earnings...');
      return { toastId };
    },
    onSuccess: (data, slotId, context) => {
      if (context?.toastId) {
        dismissToast(context.toastId);
      }
      showSuccess(`Earnings claimed successfully! +${data.amount?.toFixed(3)} MNE`);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userSlots', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['slotControl', telegramId] });
    },
    onError: (error: unknown, slotId, context) => {
      if (context?.toastId) {
        dismissToast(context.toastId);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to claim earnings';
      showError(errorMessage);
    },
  });

  // Extend a slot
  const extendSlotMutation = useMutation({
    mutationFn: async ({ slotId, amount }: { slotId: string; amount: number }) => {
      const { data } = await api.post(`/slots/${slotId}/extend`, { amount });
      return data;
    },
    onMutate: async () => {
      const toastId = showLoading('Extending slot...');
      return { toastId };
    },
    onSuccess: (data, variables, context) => {
      if (context?.toastId) {
        dismissToast(context.toastId);
      }
      showSuccess(`Slot extended successfully! +${variables.amount.toFixed(3)} MNE`);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userSlots', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['slotControl', telegramId] });
    },
    onError: (error: unknown, variables, context) => {
      if (context?.toastId) {
        dismissToast(context.toastId);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to extend slot';
      showError(errorMessage);
    },
  });

  // Cancel a slot (if possible)
  const cancelSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { data } = await api.post(`/slots/${slotId}/cancel`);
      return data;
    },
    onMutate: async () => {
      const toastId = showLoading('Cancelling slot...');
      return { toastId };
    },
    onSuccess: (data, slotId, context) => {
      if (context?.toastId) {
        dismissToast(context.toastId);
      }
      showSuccess(`Slot cancelled successfully! Refunded ${data.refundAmount?.toFixed(3)} MNE`);
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['userSlots', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['slotControl', telegramId] });
    },
    onError: (error: unknown, slotId, context) => {
      if (context?.toastId) {
        dismissToast(context.toastId);
      }
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel slot';
      showError(errorMessage);
    },
  });

  return {
    // Data
    ...slotControlData.data,
    isLoading: slotControlData.isLoading,
    error: slotControlData.error,
    
    // Actions
    claimEarnings: claimEarningsMutation.mutate,
    extendSlot: extendSlotMutation.mutate,
    cancelSlot: cancelSlotMutation.mutate,
    
    // Mutation states
    isClaiming: claimEarningsMutation.isPending,
    isExtending: extendSlotMutation.isPending,
    isCancelling: cancelSlotMutation.isPending,
    
    // Refetch functions
    refetch: () => {
      refetchSlots();
      refetchUserData();
      slotControlData.refetch();
    },
  };
};
