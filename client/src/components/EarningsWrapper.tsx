"use client";

import { ReactNode } from 'react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { EarningsProvider } from '@/contexts/EarningsContext';

interface EarningsWrapperProps {
  children: ReactNode;
}

export const EarningsWrapper = ({ children }: EarningsWrapperProps) => {
  const { user } = useTelegramAuth();

  if (!user?.telegramId) {
    return <>{children}</>;
  }

  return (
    <EarningsProvider telegramId={user.telegramId}>
      {children}
    </EarningsProvider>
  );
};
