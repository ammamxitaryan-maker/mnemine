import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { getErrorMessage } from '@/types/errors';
import { useNetworkErrorHandler } from './useNetworkErrorHandler';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  reward: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

const fetchAchievements = async (telegramId: string): Promise<Achievement[]> => {
  const { data } = await api.get(`/user/${telegramId}/achievements`);
  return data;
};

const claimAchievement = async ({ telegramId, achievementId }: { telegramId: string, achievementId: string }) => {
  const { data } = await api.post(`/user/${telegramId}/achievements/claim`, { achievementId });
  return data;
};

export const useAchievements = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();
  const { handleNetworkError, networkState } = useNetworkErrorHandler();

  const { data, isLoading, error } = useQuery<Achievement[], Error>({
    queryKey: ['achievements', user?.telegramId],
    queryFn: () => fetchAchievements(user!.telegramId),
    enabled: !!user && networkState.errorCount < 5, // Disable if too many network errors
    refetchInterval: networkState.hasNetworkError ? 300000 : 60000, // Slower refetch on network errors
    retry: (failureCount, error) => {
      // Don't retry on network errors or after 3 attempts
      if (failureCount >= 3) return false;
      if (error && 'code' in error && error.code === 'ERR_NETWORK') return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Handle network errors and log only once
  useEffect(() => {
    if (error) {
      handleNetworkError(error);
      
      // Only log if we haven't seen too many network errors recently
      if (networkState.errorCount < 3) {
        console.error(`[useAchievements] Error fetching achievements for ${user?.telegramId}:`, error);
      }
    }
  }, [error, user?.telegramId, handleNetworkError, networkState.errorCount]);

  const mutation = useMutation({
    mutationFn: claimAchievement,
    onMutate: async () => {
      const toastId = showLoading('Claiming reward...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Reward claimed!');
      queryClient.invalidateQueries({ queryKey: ['achievements', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
    },
    onError: (err: unknown, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = getErrorMessage(err, 'Failed to claim reward.');
      showError(errorMessage);
      console.error(`[useAchievements] Error claiming achievement for ${user?.telegramId}:`, err); // Добавлено логирование ошибок
    },
  });

  return {
    achievements: data,
    isLoading,
    error,
    claim: mutation.mutate,
    isClaiming: mutation.isPending,
  };
};