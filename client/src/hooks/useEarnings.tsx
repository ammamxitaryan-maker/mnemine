import { useContext } from 'react';
import { EarningsContext } from '@/contexts/EarningsContext';

export const useEarnings = () => {
  const context = useContext(EarningsContext);
  if (context === undefined) {
    throw new Error('useEarnings must be used within an EarningsProvider');
  }
  
  // Debug logging
  console.log('[useEarnings] Current state:', {
    totalEarnings: context.totalEarnings,
    perSecondRate: context.perSecondRate,
    isActive: context.isActive
  });
  
  return context;
};