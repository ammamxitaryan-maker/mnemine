"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { usePersistentEarnings } from '@/hooks/usePersistentEarnings';

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
  const earnings = usePersistentEarnings(telegramId);

  return (
    <EarningsContext.Provider value={earnings}>
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
