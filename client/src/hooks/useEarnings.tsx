import { useContext } from 'react';
import { EarningsContext } from '@/contexts/EarningsContext';

export const useEarnings = () => {
  const context = useContext(EarningsContext);
  if (context === undefined) {
    throw new Error('useEarnings must be used within an EarningsProvider');
  }
  
  
  return context;
};