import { useQuery } from '@tanstack/react-query';
import { useUserData } from './useUserData';
import { useSlotsData } from './useSlotsData';
import { useCachedExchangeRate } from './useCachedExchangeRate';

interface MainBalanceData {
  availableBalance: number; // Available balance not invested in slots
  totalInvested: number; // Total amount invested in active slots
  totalBalance: number; // Total balance (available + invested)
  activeSlotsCount: number;
  totalEarnings: number; // Earnings from slots
  lastUpdate: string;
}

export const useMainBalance = (telegramId: string | undefined) => {
  const { data: userData } = useUserData(telegramId);
  const { data: slotsData } = useSlotsData(telegramId);
  const { convertMNEToUSD } = useCachedExchangeRate(telegramId || '');

  const balanceData = useQuery<MainBalanceData>({
    queryKey: ['mainBalance', telegramId, userData?.mneBalance, slotsData],
    queryFn: () => {
      if (!userData || !slotsData) {
        return {
          availableBalance: 0,
          totalInvested: 0,
          totalBalance: 0,
          activeSlotsCount: 0,
          totalEarnings: 0,
          lastUpdate: new Date().toISOString(),
        };
      }

      const totalBalance = userData.mneBalance || 0;
      
      // Calculate total invested in active slots
      const activeSlots = slotsData.filter(slot => 
        slot.isActive && new Date(slot.expiresAt) > new Date()
      );
      
      const totalInvested = activeSlots.reduce((sum, slot) => sum + (slot.principal || 0), 0);
      
      // Calculate total earnings from slots
      const totalEarnings = activeSlots.reduce((sum, slot) => {
        const now = new Date();
        const lastAccrued = new Date(slot.lastAccruedAt);
        const timeElapsed = (now.getTime() - lastAccrued.getTime()) / 1000; // seconds
        
        if (timeElapsed > 0) {
          const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
          const earnings = earningsPerSecond * timeElapsed;
          return sum + earnings;
        }
        return sum;
      }, 0);

      // Available balance = total balance - invested amount
      const availableBalance = Math.max(0, totalBalance - totalInvested);

      return {
        availableBalance,
        totalInvested,
        totalBalance,
        activeSlotsCount: activeSlots.length,
        totalEarnings,
        lastUpdate: new Date().toISOString(),
      };
    },
    enabled: !!telegramId && !!userData,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 15000, // Consider data stale after 15 seconds
  });

  const usdEquivalent = convertMNEToUSD(balanceData.data?.availableBalance || 0);
  const totalUsdEquivalent = convertMNEToUSD(balanceData.data?.totalBalance || 0);
  const earningsUsd = convertMNEToUSD(balanceData.data?.totalEarnings || 0);

  return {
    ...balanceData.data,
    usdEquivalent,
    totalUsdEquivalent,
    earningsUsd,
    isLoading: balanceData.isLoading,
    error: balanceData.error,
    refetch: balanceData.refetch,
  };
};
