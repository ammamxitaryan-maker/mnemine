import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

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

  const { data, isLoading, error } = useQuery<Achievement[], Error>({ // Указан тип для data и error
    queryKey: ['achievements', user?.telegramId],
    queryFn: () => fetchAchievements(user!.telegramId),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute
    // onError удален из опций useQuery
  });

  // Логирование ошибки, если она есть
  if (error) {
    console.error(`[useAchievements] Error fetching achievements for ${user?.telegramId}:`, error);
  }

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
    onError: (err: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = err.response?.data?.error || 'Failed to claim reward.';
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