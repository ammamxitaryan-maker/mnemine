import { useQuery } from '@tanstack/react-query';
import React from 'react';
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
  const [forceRefresh, setForceRefresh] = React.useState(0);

  // Listen for balance update events
  React.useEffect(() => {
    const handleBalanceUpdated = (event: CustomEvent) => {
      console.log(`[useMainBalance] Received balanceUpdated event:`, event.detail);
      if (event.detail?.telegramId === telegramId) {
        console.log(`[useMainBalance] Balance updated for user ${telegramId}, forcing refresh`);
        setForceRefresh(prev => prev + 1);
        refetchUserData();
        refetchSlotsData();
      }
    };

    const handleUserDataRefresh = (event: CustomEvent) => {
      console.log(`[useMainBalance] Received userDataRefresh event:`, event.detail);
      if (event.detail?.telegramId === telegramId) {
        console.log(`[useMainBalance] User data refresh for user ${telegramId}, forcing refresh`);
        setForceRefresh(prev => prev + 1);
        refetchUserData();
        refetchSlotsData();
      }
    };

    const handleGlobalRefresh = () => {
      console.log(`[useMainBalance] Received globalDataRefresh event, forcing refresh for user ${telegramId}`);
      setForceRefresh(prev => prev + 1);
      refetchUserData();
      refetchSlotsData();
    };

    // Listen for WebSocket balance updates
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'BALANCE_UPDATED' && data.data) {
          console.log(`[useMainBalance] WebSocket balance update received:`, data.data);
          if (data.data.telegramId === telegramId) {
            console.log(`[useMainBalance] WebSocket balance update for user ${telegramId}, forcing refresh`);
            setForceRefresh(prev => prev + 1);
            refetchUserData();
            refetchSlotsData();

            // Also dispatch events to ensure all components get updated
            window.dispatchEvent(new CustomEvent('balanceUpdated', {
              detail: {
                telegramId: data.data.telegramId,
                newBalance: data.data.newBalance,
                previousBalance: data.data.previousBalance,
                changeAmount: data.data.changeAmount,
                action: data.data.action,
                timestamp: data.data.timestamp
              }
            }));
          }
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener('balanceUpdated', handleBalanceUpdated as EventListener);
    window.addEventListener('userDataRefresh', handleUserDataRefresh as EventListener);
    window.addEventListener('globalDataRefresh', handleGlobalRefresh);
    window.addEventListener('message', handleWebSocketMessage);

    return () => {
      window.removeEventListener('balanceUpdated', handleBalanceUpdated as EventListener);
      window.removeEventListener('userDataRefresh', handleUserDataRefresh as EventListener);
      window.removeEventListener('globalDataRefresh', handleGlobalRefresh);
      window.removeEventListener('message', handleWebSocketMessage);
    };
  }, [telegramId, refetchUserData, refetchSlotsData]);

  const balanceData = useQuery<MainBalanceData>({
    queryKey: ['mainBalance', telegramId, userData?.nonBalance, slotsData, forceRefresh],
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

      const availableBalance = userData.nonBalance || 0;

      // Calculate total invested in active slots
      const activeSlots = slotsData.filter(slot =>
        slot.isActive && new Date(slot.expiresAt) > new Date()
      );

      const totalInvested = activeSlots.reduce((sum, slot) => sum + (slot.principal || 0), 0);

      // Balance calculation completed

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

      // Available balance = user's actual wallet balance
      // Investments don't reduce available balance - they are separate


      return {
        availableBalance,
        totalInvested,
        activeSlotsCount: activeSlots.length,
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
