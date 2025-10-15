import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwapMNEoMNE, useSwapMNEToUSD, useExchangeRate } from './useSwap';
import { showSuccess, showError } from '@/utils/toast';
import { getErrorMessage } from '@/types/errors';

export interface SwapLogicProps {
  telegramId: string;
  USDBalance?: number;
}

export interface SwapLogicReturn {
  // State
  amount: string;
  direction: 'USD-to-MNE' | 'MNE-to-USD';
  setAmount: (amount: string) => void;
  setDirection: (direction: 'USD-to-MNE' | 'MNE-to-USD') => void;
  
  // Data
  rateData: { rate: number; baseRate: number; variation: number; lastUpdated: string } | undefined;
  rateLoading: boolean;
  swapLoading: boolean;
  
  // Computed values
  previewAmount: string | null;
  
  // Actions
  handleSwap: () => Promise<void>;
  handleAmountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  
  // Validation
  isSwapDisabled: boolean;
}

export const useSwapLogic = ({ telegramId, USDBalance = 0 }: SwapLogicProps): SwapLogicReturn => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'USD-to-MNE' | 'MNE-to-USD'>('USD-to-MNE');
  
  const swapMNEoMNEMutation = useSwapMNEoMNE(telegramId);
  const swapMNEToUSDMutation = useSwapMNEToUSD(telegramId);
  const { data: rateData, isLoading: rateLoading } = useExchangeRate(telegramId);

  const swapLoading = swapMNEoMNEMutation.isPending || swapMNEToUSDMutation.isPending;

  const calculatePreview = useCallback(() => {
    if (!amount || !rateData) return null;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return null;

    if (direction === 'USD-to-MNE') {
      return (numAmount * rateData.rate).toFixed(4);
    } else {
      return (numAmount / rateData.rate).toFixed(4);
    }
  }, [amount, rateData, direction]);

  const previewAmount = calculatePreview();

  const handleSwap = useCallback(async () => {
    const swapAmount = parseFloat(amount);
    
    if (isNaN(swapAmount) || swapAmount <= 0) {
      showError(t('swap.invalidAmount'));
      return;
    }

    if (swapAmount < 0.001) {
      showError(t('swap.minAmount'));
      return;
    }

    try {
      if (direction === 'USD-to-MNE') {
        if (swapAmount > USDBalance) {
          showError(t('swap.insufficientBalance'));
          return;
        }
        const result = await swapMNEoMNEMutation.mutateAsync(swapAmount);
        showSuccess(t('swap.successMessage', { 
          amount1: swapAmount.toFixed(2), 
          currency1: 'USD',
          amount2: result.MNEAmount.toFixed(2), 
          currency2: 'MNE'
        }));
      } else {
        const result = await swapMNEToUSDMutation.mutateAsync(swapAmount);
        showSuccess(t('swap.successMessage', { 
          amount1: swapAmount.toFixed(2), 
          currency1: 'MNE',
          amount2: result.USDAmount.toFixed(2), 
          currency2: 'USD'
        }));
      }
      
      setAmount('');
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, t('swap.error'));
      showError(errorMessage);
    }
  }, [amount, direction, USDBalance, swapMNEoMNEMutation, swapMNEToUSDMutation, t]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and decimal point
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const isSwapDisabled = swapLoading || !amount || parseFloat(amount) < 1;

  return {
    // State
    amount,
    direction,
    setAmount,
    setDirection,
    
    // Data
    rateData,
    rateLoading,
    swapLoading,
    
    // Computed values
    previewAmount,
    
    // Actions
    handleSwap,
    handleAmountChange,
    
    // Validation
    isSwapDisabled,
  };
};
