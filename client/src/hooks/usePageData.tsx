import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useOptimizedDashboard, useBackgroundSync } from '@/hooks/useOptimizedData';
import { useClaimEarnings } from '@/hooks/useClaimEarnings';
import { useReinvest } from '@/hooks/useReinvest';

export interface PageDataReturn {
  user: ReturnType<typeof useTelegramAuth>['user'];
  authLoading: boolean;
  userData: any;
  slotsData: any;
  tasksData: any;
  lotteryData: any;
  bonusesData: any;
  achievementsData: any;
  marketData: any;
  isLoading: boolean;
  hasError: any;
  loadingStates: any;
  claim: ReturnType<typeof useClaimEarnings>['claim'];
  isClaiming: boolean;
  reinvest: ReturnType<typeof useReinvest>['reinvest'];
  isReinvesting: boolean;
}

export const usePageData = (): PageDataReturn => {
  const { user, loading: authLoading } = useTelegramAuth();
  
  const {
    userData,
    slotsData,
    tasksData,
    lotteryData,
    bonusesData,
    achievementsData,
    marketData,
    isLoading: overallLoading,
    hasError,
    loadingStates
  } = useOptimizedDashboard(user?.telegramId);

  // Enable background sync
  useBackgroundSync(user?.telegramId);

  const { claim, isClaiming } = useClaimEarnings();
  const { reinvest, isReinvesting } = useReinvest();

  return {
    user,
    authLoading,
    userData,
    slotsData,
    tasksData,
    lotteryData,
    bonusesData,
    achievementsData,
    marketData,
    isLoading: authLoading || overallLoading,
    hasError,
    loadingStates,
    claim,
    isClaiming,
    reinvest,
    isReinvesting
  };
};
