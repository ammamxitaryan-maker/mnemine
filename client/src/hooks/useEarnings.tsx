import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useWebSocketEarnings } from './useWebSocketEarnings';

export interface EarningsData {
  totalAccruedEarnings: number;
  hasEarningsToClaim: boolean;
  lastUpdated: string;
}

export interface ClaimEarningsResult {
  success: boolean;
  claimedAmount: number;
  message: string;
  lastUpdated: string;
}

const fetchEarningsData = async (telegramId?: string): Promise<EarningsData> => {
  if (!telegramId) {
    return {
      totalAccruedEarnings: 0,
      hasEarningsToClaim: false,
      lastUpdated: new Date().toISOString()
    };
  }

  const { data } = await api.get(`/user/${telegramId}/slots/earnings`);
  return data;
};

const claimEarnings = async (telegramId?: string, slotIds?: string[]): Promise<ClaimEarningsResult> => {
  if (!telegramId) {
    throw new Error('Telegram ID is required');
  }

  const { data } = await api.post(`/user/${telegramId}/slots/claim`, { slotIds });
  return data;
};

export const useEarnings = (telegramId?: string) => {
  const queryClient = useQueryClient();

  // Query for earnings data
  const earningsQuery = useQuery<EarningsData, Error>({
    queryKey: ['earnings', telegramId],
    queryFn: () => fetchEarningsData(telegramId),
    enabled: !!telegramId,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Mutation for claiming earnings
  const claimMutation = useMutation<ClaimEarningsResult, Error, { slotIds?: string[] }>({
    mutationFn: ({ slotIds }) => claimEarnings(telegramId, slotIds),
    onSuccess: (data) => {
      if (data.success) {
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['earnings', telegramId] });
        queryClient.invalidateQueries({ queryKey: ['slotsData', telegramId] });
        queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });

        console.log(`Successfully claimed ${data.claimedAmount} MNE`);
      }
    },
    onError: (error) => {
      console.error('Error claiming earnings:', error);
    }
  });

  // WebSocket integration for real-time updates
  useWebSocketEarnings(telegramId, {
    onEarningsUpdate: (data) => {
      // Update earnings data in cache
      queryClient.setQueryData(['earnings', telegramId], (oldData: EarningsData | undefined) => {
        if (oldData) {
          return {
            ...oldData,
            totalAccruedEarnings: data.totalAccruedEarnings || oldData.totalAccruedEarnings,
            lastUpdated: new Date().toISOString()
          };
        }
        return oldData;
      });
    },
    onEarningsClaimed: (data) => {
      // Refresh all related queries when earnings are claimed
      queryClient.invalidateQueries({ queryKey: ['earnings', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['slotsData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
    }
  });

  return {
    earnings: earningsQuery.data,
    isLoading: earningsQuery.isLoading,
    error: earningsQuery.error,
    refetch: earningsQuery.refetch,
    claimEarnings: claimMutation.mutate,
    isClaiming: claimMutation.isPending,
    claimResult: claimMutation.data,
    claimError: claimMutation.error
  };
};
