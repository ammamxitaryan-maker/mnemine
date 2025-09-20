import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';

interface InvestmentGrowthBonusStatus {
  canClaim: boolean;
  nextClaimAt: string | null;
  hasRecentInvestmentActivity: boolean;
}

const fetchInvestmentGrowthBonusStatus = async (telegramId: string): Promise<InvestmentGrowthBonusStatus> => {
  // The backend's claimInvestmentGrowthBonus already checks for recent activity and last claim.
  // For the status, we can make a lightweight call to the stats endpoint and check activity logs.
  const { data: stats } = await api.get(`/user/${telegramId}/stats`);
  
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const hasRecentInvestmentActivity = stats.totalInvested > 0 && (stats.lastDepositAt && new Date(stats.lastDepositAt) > sevenDaysAgo || stats.lastSlotPurchaseAt && new Date(stats.lastSlotPurchaseAt) > sevenDaysAgo); // Simplified check

  const lastClaimTimestamp = stats.lastInvestmentGrowthBonusClaimedAt ? new Date(stats.lastInvestmentGrowthBonusClaimedAt) : null;
  const claimedRecently = lastClaimTimestamp && (new Date().getTime() - lastClaimTimestamp.getTime() < 7 * 24 * 60 * 60 * 1000);

  return {
    canClaim: hasRecentInvestmentActivity && !claimedRecently,
    nextClaimAt: claimedRecently ? new Date(lastClaimTimestamp!.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
    hasRecentInvestmentActivity: hasRecentInvestmentActivity,
  };
};

const claimInvestmentGrowthBonus = async (telegramId: string) => {
  const { data } = await api.post(`/user/${telegramId}/claim-investment-growth-bonus`);
  return data;
};

export const useInvestmentGrowthBonus = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();

  const { data: status, isLoading, error } = useQuery<InvestmentGrowthBonusStatus, Error>({
    queryKey: ['investmentGrowthBonusStatus', user?.telegramId],
    queryFn: () => fetchInvestmentGrowthBonusStatus(user!.telegramId),
    enabled: !!user,
    refetchInterval: 60000, // Refetch every minute to update status
  });

  if (error) {
    console.error(`[useInvestmentGrowthBonus] Error fetching status for ${user?.telegramId}:`, error);
  }

  const mutation = useMutation({
    mutationFn: () => claimInvestmentGrowthBonus(user!.telegramId),
    onMutate: async () => {
      const toastId = showLoading('Claiming investment growth bonus...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Investment growth bonus claimed!');
      queryClient.invalidateQueries({ queryKey: ['investmentGrowthBonusStatus', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['stats', user?.telegramId] }); // Invalidate stats to update lastInvestmentGrowthBonusClaimedAt
    },
    onError: (err: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = err.response?.data?.error || 'Failed to claim investment growth bonus.';
      showError(errorMessage);
      console.error(`[useInvestmentGrowthBonus] Error claiming bonus for ${user?.telegramId}:`, err);
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