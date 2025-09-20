import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface LeaderboardBonusStatus {
  canClaim: boolean;
  nextClaimAt: string | null; // Not directly used by backend yet, but good for future proofing
  isInTop10: boolean;
}

const fetchLeaderboardBonusStatus = async (telegramId: string): Promise<LeaderboardBonusStatus> => {
  // The backend's claimLeaderboardBonus already checks if the user is in top 10 and if claimed recently.
  // For the status, we can make a lightweight call or rely on the claim mutation's error handling.
  // For simplicity, we'll assume if the claim endpoint doesn't error, it's claimable.
  // A dedicated status endpoint would be better, but for now, we'll simulate.
  const { data } = await api.get(`/user/${telegramId}/stats`); // Use stats to check if in top 10
  const topWalletsResponse = await api.get(`/api/leaderboard`);
  const isInTop10 = topWalletsResponse.data.some((u: any) => u.username === data.username || u.firstName === data.firstName);

  // Check if claimed recently (simulated, as backend doesn't expose this status directly yet)
  // In a real scenario, the backend would provide `nextClaimAt` for this bonus.
  // For now, we'll assume it's claimable if in top 10 and no recent claim activity.
  const activityResponse = await api.get(`/user/${telegramId}/activity`);
  const lastClaim = activityResponse.data.find((a: any) => a.type === 'LEADERBOARD_BONUS');
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const claimedRecently = lastClaim && new Date(lastClaim.createdAt) > twentyFourHoursAgo;

  return {
    canClaim: isInTop10 && !claimedRecently,
    nextClaimAt: claimedRecently ? new Date(new Date(lastClaim.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString() : null,
    isInTop10: isInTop10,
  };
};

const claimLeaderboardBonus = async (telegramId: string) => {
  const { data } = await api.post(`/user/${telegramId}/claim-leaderboard-bonus`);
  return data;
};

export const useLeaderboardBonus = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading, error } = useQuery<LeaderboardBonusStatus, Error>({
    queryKey: ['leaderboardBonusStatus', user?.telegramId],
    queryFn: () => fetchLeaderboardBonusStatus(user!.telegramId),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute to update status
  });

  if (error) {
    console.error(`[useLeaderboardBonus] Error fetching status for ${user?.telegramId}:`, error);
  }

  const mutation = useMutation({
    mutationFn: () => claimLeaderboardBonus(user!.telegramId),
    onMutate: async () => {
      const toastId = showLoading('Claiming leaderboard bonus...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Leaderboard bonus claimed!');
      queryClient.invalidateQueries({ queryKey: ['leaderboardBonusStatus', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
    },
    onError: (err: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = err.response?.data?.error || 'Failed to claim leaderboard bonus.';
      showError(errorMessage);
      console.error(`[useLeaderboardBonus] Error claiming bonus for ${user?.telegramId}:`, err);
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