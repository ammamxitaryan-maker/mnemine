"use client";

import { useServerEarnings } from '@/hooks/useServerEarnings';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useUserData } from '@/hooks/useUserData';
import { useWebSocketEarnings } from '@/hooks/useWebSocketEarnings';
import { globalEarningsManager } from '@/utils/globalEarningsManager';
import { createContext, ReactNode, useEffect, useState } from 'react';

interface PersistentEarningsState {
  totalEarnings: number;
  perSecondRate: number;
  lastUpdateTime: number;
  isActive: boolean;
  telegramId: string;
}

interface EarningsContextType {
  totalEarnings: number;
  perSecondRate: number;
  isActive: boolean;
  resetEarnings: () => void;
}

export const EarningsContext = createContext<EarningsContextType | undefined>(undefined);

interface EarningsProviderProps {
  children: ReactNode;
  telegramId: string;
}

export const EarningsProvider = ({ children, telegramId }: EarningsProviderProps) => {
  const [earnings, setEarnings] = useState<PersistentEarningsState>({
    totalEarnings: 0,
    perSecondRate: 0,
    lastUpdateTime: Date.now(),
    isActive: false,
    telegramId: '',
  });

  // Only fetch data if we have a valid telegramId
  const { data: slotsData, refetch: refetchSlots } = useSlotsData(telegramId || undefined);
  const { data: userData, refetch: refetchUserData } = useUserData(telegramId || undefined);
  const { data: serverEarnings, refetch: refetchServerEarnings } = useServerEarnings(telegramId || undefined);

  // Connect to WebSocket for real-time earnings updates
  const { isConnected: isWebSocketConnected, lastUpdate: wsLastUpdate } = useWebSocketEarnings(telegramId || undefined);

  // Subscribe to global earnings manager
  useEffect(() => {
    const unsubscribe = globalEarningsManager.subscribe((state) => {
      setEarnings(state);
    });

    return unsubscribe;
  }, []);

  // Update global manager when slots data or server earnings change
  useEffect(() => {
    console.log('[EarningsContext] Update effect triggered:', {
      telegramId,
      hasSlotsData: !!slotsData,
      slotsCount: slotsData?.length || 0,
      serverEarnings: serverEarnings?.totalEarnings,
      userEarnings: userData?.accruedEarnings
    });

    if (slotsData && telegramId && telegramId.trim() !== '') {
      // Use server earnings if available, otherwise fall back to user data
      const earnings = serverEarnings?.totalEarnings || userData?.accruedEarnings || 0;
      console.log('[EarningsContext] Updating global manager with:', {
        telegramId,
        slotsCount: slotsData.length,
        earnings
      });
      globalEarningsManager.updateSlotsData(telegramId, slotsData, earnings);
    } else {
      console.log('[EarningsContext] Skipping update - missing data:', {
        hasSlotsData: !!slotsData,
        hasTelegramId: !!telegramId,
        telegramIdLength: telegramId?.length || 0
      });
    }
  }, [slotsData, telegramId, serverEarnings?.totalEarnings, userData?.accruedEarnings]);

  // Start sync timer
  useEffect(() => {
    if (!telegramId || telegramId.trim() === '') {
      console.log('[EarningsContext] Skipping sync timer - no valid telegramId');
      return;
    }

    const syncFunction = () => {
      refetchSlots();
      refetchUserData();
      refetchServerEarnings();
    };

    globalEarningsManager.startSyncTimer(syncFunction, syncFunction);

    return () => {
      globalEarningsManager.stopSyncTimer();
    };
  }, [telegramId, refetchSlots, refetchUserData, refetchServerEarnings]);

  const resetEarnings = () => {
    globalEarningsManager.resetEarnings();
  };

  const contextValue: EarningsContextType = {
    totalEarnings: earnings.totalEarnings,
    perSecondRate: earnings.perSecondRate,
    isActive: earnings.isActive,
    resetEarnings,
  };

  return (
    <EarningsContext.Provider value={contextValue}>
      {children}
    </EarningsContext.Provider>
  );
};

