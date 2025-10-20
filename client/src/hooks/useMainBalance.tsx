import { useQuery } from '@tanstack/react-query';
import {
  calculateActiveSlotsCount,
  calculateTotalInvested,
  calculateUserTotalEarnings
} from '../utils/earningsCalculationUtils';
import { useBalanceEventHandlers } from './useBalanceEventHandlers';
import { useCachedExchangeRate } from './useCachedExchangeRate';
import { useSlotsData } from './useSlotsData';
import { useUserData } from './useUserData';

interface MainBalanceData {
  availableBalance: number; // User's actual wallet balance (not affected by investments)
  totalInvested: number; // Total amount invested in active slots
  activeSlotsCount: number;
  totalEarnings: number; // Earnings from slots
  lastUpdate: string;
}

export const useMainBalance = (telegramId: string | undefined) => {
  const { data: userData, refetch: refetchUserData } = useUserData(telegramId);
  const { data: slotsData, refetch: refetchSlotsData } = useSlotsData(telegramId);
  const { convertNONToUSD } = useCachedExchangeRate(telegramId || '');

  // Use centralized balance event handlers
  const { forceRefresh } = useBalanceEventHandlers({
    telegramId,
    onBalanceUpdate: () => {
      console.log(`[useMainBalance] Balance updated for user ${telegramId}, forcing refresh`);
      refetchUserData();
      refetchSlotsData();
    },
    onUserDataRefresh: () => {
      console.log(`[useMainBalance] User data refresh for user ${telegramId}, forcing refresh`);
      refetchUserData();
      refetchSlotsData();
    },
    onGlobalRefresh: () => {
      console.log(`[useMainBalance] Global refresh for user ${telegramId}, forcing refresh`);
      refetchUserData();
      refetchSlotsData();
    },
    onUserDataUpdated: () => {
      console.log(`[useMainBalance] User data updated for user ${telegramId}, forcing refresh`);
      refetchUserData();
      refetchSlotsData();
    }
  });

  const balanceData = useQuery<MainBalanceData>({
    queryKey: ['mainBalance', telegramId, userData?.availableBalance, slotsData, forceRefresh],
    queryFn: () => {
      if (!userData || !slotsData) {
        return {
          availableBalance: 0,
          totalInvested: 0,
          activeSlotsCount: 0,
          totalEarnings: 0,
          lastUpdate: new Date().toISOString(),
        };
      }

      // Use balance field (same as admin panel calculation)
      const availableBalance = userData.balance || 0;

      // Use centralized utilities for calculations
      const totalInvested = calculateTotalInvested(slotsData);
      const activeSlotsCount = calculateActiveSlotsCount(slotsData);
      const totalEarnings = calculateUserTotalEarnings(slotsData);

      return {
        availableBalance,
        totalInvested,
        activeSlotsCount,
        totalEarnings,
        lastUpdate: new Date().toISOString(),
      };
    },
    enabled: !!telegramId && !!userData,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
    staleTime: 1000, // Consider data fresh for 1 second to ensure real-time updates
  });

  // USD equivalents for display only
  const usdEquivalent = convertNONToUSD(balanceData.data?.availableBalance || 0);
  const earningsUsd = convertNONToUSD(balanceData.data?.totalEarnings || 0);

  return {
    ...balanceData.data,
    usdEquivalent, // For display only
    earningsUsd, // For display only
    isLoading: balanceData.isLoading,
    error: balanceData.error,
    refetch: balanceData.refetch,
  };
};
