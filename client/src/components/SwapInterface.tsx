import React, { useState, useCallback } from 'react';
import { LoadingButton } from './LoadingButton';
import { Skeleton } from './SkeletonLoader';
import { useSwapMNEoMNE, useSwapMNEToUSD, useExchangeRate } from '../hooks/useSwap';
import { useErrorHandler } from './ErrorBoundary';
import { getErrorMessage } from '../types/errors';

interface SwapInterfaceProps {
  telegramId: string;
}

export const SwapInterface: React.FC<SwapInterfaceProps> = ({ telegramId }) => {
  const [amount, setAmount] = useState('');
  const [swapDirection, setSwapDirection] = useState<'USD-to-MNE' | 'MNE-to-USD'>('USD-to-MNE');
  const [lastSwap, setLastSwap] = useState<{ MNEAmount?: number; USDAmount?: number; rate?: number } | null>(null);
  
  // FIX: Use real API hooks instead of mocks
  const swapMNEoMNEMutation = useSwapMNEoMNE(telegramId);
  const swapMNEToUSDMutation = useSwapMNEToUSD(telegramId);
  const { data: rateData, isLoading: rateLoading } = useExchangeRate(telegramId);
  
  const swapLoading = swapMNEoMNEMutation.isPending || swapMNEToUSDMutation.isPending;
  const { captureError } = useErrorHandler();

  const handleSwap = useCallback(async () => {
    const swapAmount = parseFloat(amount);
    
    if (isNaN(swapAmount) || swapAmount <= 0) {
      alert('❌ Please enter a valid amount');
      return;
    }

    if (swapAmount < 1) {
      alert('❌ Minimum swap amount is 1.0');
      return;
    }
    
    try {
      // FIX: Use real API mutations
      if (swapDirection === 'USD-to-MNE') {
        const result = await swapMNEoMNEMutation.mutateAsync(swapAmount);
        setLastSwap(result);
        alert(`✅ Swap Successful!\n\n${swapAmount.toFixed(4)} USD → ${result.MNEAmount.toFixed(4)} MNE\nRate: ${result.rate.toFixed(4)}`);
      } else {
        const result = await swapMNEToUSDMutation.mutateAsync(swapAmount);
        setLastSwap(result);
        alert(`✅ Swap Successful!\n\n${swapAmount.toFixed(4)} MNE → ${result.USDAmount.toFixed(4)} USD\nRate: ${result.rate.toFixed(4)}`);
      }
      
      setAmount(''); // Clear input after successful swap
      console.log('✅ Swap successful');
      
    } catch (error: unknown) {
      console.error('❌ Swap failed:', error);
      const errorMessage = getErrorMessage(error, 'Swap failed');
      alert(`❌ Swap Failed\n\n${errorMessage}`);
    }
  }, [amount, swapDirection, swapMNEoMNEMutation, swapMNEToUSDMutation]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Разрешаем только числа и точку
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const isSwapDisabled = swapLoading || !amount || parseFloat(amount) <= 0 || parseFloat(amount) < 1;

  return (
    <div className="swap-interface">
      <div className="swap-interface__header">
        <h3 className="swap-interface__title">Currency Swap (USD ⇄ MNE)</h3>
        {rateLoading ? (
          <Skeleton width={120} height={20} />
        ) : rateData ? (
          <div className="swap-interface__rate">
            <span className="swap-interface__rate-label">Current Rate:</span>
            <span className="swap-interface__rate-value">{rateData.rate.toFixed(4)}</span>
          </div>
        ) : (
          <div className="swap-interface__rate-error">Rate unavailable</div>
        )}
      </div>

      <div className="swap-interface__form">
        <div className="swap-interface__direction">
          <label className="swap-interface__direction-label">Direction:</label>
          <select 
            value={swapDirection} 
            onChange={(e) => setSwapDirection(e.target.value as 'USD-to-MNE' | 'MNE-to-USD')}
            className="swap-interface__direction-select"
            disabled={swapLoading}
          >
            <option value="USD-to-MNE">USD → MNE</option>
            <option value="MNE-to-USD">MNE → USD</option>
          </select>
        </div>

        <div className="swap-interface__amount">
          <label className="swap-interface__amount-label">Amount:</label>
          <div className="swap-interface__amount-input-group">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount (min 1.0)"
              className="swap-interface__amount-input"
              disabled={swapLoading}
              min="1"
              step="0.01"
            />
            <span className="swap-interface__amount-currency">
              {swapDirection === 'USD-to-MNE' ? 'USD' : 'MNE'}
            </span>
          </div>
        </div>

        {amount && rateData && (
          <div className="swap-interface__preview">
            <div className="swap-interface__preview-label">You will receive:</div>
            <div className="swap-interface__preview-amount">
              {swapDirection === 'USD-to-MNE' 
                ? `${(parseFloat(amount) * rateData.rate).toFixed(4)} MNE`
                : `${(parseFloat(amount) / rateData.rate).toFixed(4)} USD`
              }
            </div>
          </div>
        )}

        <LoadingButton
          onClick={handleSwap}
          loading={swapLoading}
          disabled={isSwapDisabled}
          variant="primary"
          size="lg"
          className="swap-interface__button"
          loadingText="Swapping..."
        >
          {swapDirection === 'USD-to-MNE' ? 'Swap to MNE' : 'Swap to USD'}
        </LoadingButton>
      </div>

      {lastSwap && (
        <div className="swap-interface__result">
          <div className="swap-interface__result-success">
            ✅ Swap completed successfully!
          </div>
          <div className="swap-interface__result-details">
            <div>USD: {lastSwap.USDAmount?.toFixed(4) || '0.0000'}</div>
            <div>MNE: {lastSwap.MNEAmount?.toFixed(4) || '0.0000'}</div>
            <div>Rate: {lastSwap.rate?.toFixed(4) || '0.0000'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Стили для SwapInterface
export const swapInterfaceStyles = `
.swap-interface {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.swap-interface__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.swap-interface__title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.swap-interface__rate {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.swap-interface__rate-label {
  color: #6c757d;
}

.swap-interface__rate-value {
  font-weight: 600;
  color: #28a745;
}


.swap-interface__rate-error {
  color: #dc3545;
  font-size: 14px;
}

.swap-interface__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.swap-interface__direction,
.swap-interface__amount {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.swap-interface__direction-label,
.swap-interface__amount-label {
  font-weight: 500;
  color: #495057;
}

.swap-interface__direction-select {
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  font-size: 16px;
  cursor: pointer;
}

.swap-interface__direction-select:disabled {
  background: #e9ecef;
  cursor: not-allowed;
}

.swap-interface__amount-input-group {
  display: flex;
  align-items: center;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}

.swap-interface__amount-input {
  flex: 1;
  padding: 10px 12px;
  border: none;
  outline: none;
  font-size: 16px;
}

.swap-interface__amount-input:disabled {
  background: #e9ecef;
}

.swap-interface__amount-currency {
  padding: 10px 12px;
  background: #e9ecef;
  color: #6c757d;
  font-weight: 500;
  border-left: 1px solid #ced4da;
}

.swap-interface__preview {
  background: #e8f5e8;
  border: 1px solid #c3e6c3;
  border-radius: 6px;
  padding: 12px;
  text-align: center;
}

.swap-interface__preview-label {
  color: #155724;
  font-size: 14px;
  margin-bottom: 4px;
}

.swap-interface__preview-amount {
  color: #155724;
  font-size: 18px;
  font-weight: 600;
}

.swap-interface__button {
  width: 100%;
  margin-top: 8px;
}

.swap-interface__result {
  margin-top: 20px;
  padding: 16px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
}

.swap-interface__result-success {
  color: #155724;
  font-weight: 600;
  margin-bottom: 8px;
}

.swap-interface__result-details {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #155724;
}

@media (max-width: 768px) {
  .swap-interface {
    padding: 16px;
    margin: 16px 0;
  }
  
  .swap-interface__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .swap-interface__result-details {
    flex-direction: column;
    gap: 4px;
  }
}
`;

