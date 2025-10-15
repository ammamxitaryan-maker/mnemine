"use client";

import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { globalEarningsManager } from '@/utils/globalEarningsManager';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useUserData } from '@/hooks/useUserData';

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

const EarningsContext = createContext<EarningsContextType | undefined>(undefined);

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

  const { data: slotsData, refetch: refetchSlots } = useSlotsData(telegramId);
  const { refetch: refetchUserData } = useUserData(telegramId);

  // Subscribe to global earnings manager
  useEffect(() => {
    const unsubscribe = globalEarningsManager.subscribe((state) => {
      setEarnings(state);
    });

    return unsubscribe;
  }, []);

  // Update global manager when slots data changes
  useEffect(() => {
    if (slotsData) {
      globalEarningsManager.updateSlotsData(telegramId, slotsData);
    }
  }, [slotsData, telegramId]);

  // Start sync timer
  useEffect(() => {
    globalEarningsManager.startSyncTimer(refetchSlots, refetchUserData);
    
    return () => {
      globalEarningsManager.stopSyncTimer();
    };
  }, [refetchSlots, refetchUserData]);

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

export const useEarnings = () => {
  const context = useContext(EarningsContext);
  if (context === undefined) {
    throw new Error('useEarnings must be used within an EarningsProvider');
  }
  return context;
};
