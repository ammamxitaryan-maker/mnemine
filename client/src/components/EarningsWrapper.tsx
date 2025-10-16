"use client";

import { ReactNode } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { EarningsProvider } from '@/contexts/EarningsContext';

interface EarningsWrapperProps {
  children: ReactNode;
}

export const EarningsWrapper = ({ children }: EarningsWrapperProps) => {
  const { user } = useTelegramAuth();

  // Always provide the EarningsProvider, even if user is not available yet
  // The EarningsProvider will handle the case where telegramId is empty
  return (
    <EarningsProvider telegramId={user?.telegramId || ''}>
      {children}
    </EarningsProvider>
  );
};
