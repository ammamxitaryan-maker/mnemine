import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingButton } from './LoadingButton';
import { Skeleton } from './SkeletonLoader';
import { useSlotActions } from '../hooks/useSlotActions';
import { useErrorHandler } from './ErrorBoundary';
import { getErrorMessage } from '../types/errors';

interface SlotPurchaseInterfaceProps {
  telegramId: string;
  userBalance: number;
}

export const SlotPurchaseInterface: React.FC<SlotPurchaseInterfaceProps> = ({ 
  telegramId, 
  userBalance 
}) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<{ amount: number; result: unknown } | null>(null);
  
  const { upgrade: buySlot, isUpgrading: slotLoading } = useSlotActions();
  const { captureError } = useErrorHandler();

  // Предустановленные суммы для быстрого выбора
  const presetAmounts = [3, 10, 25, 50, 100, 250, 500];
  
  // Рассчитываем тип слота и доходность
  const slotInfo = useMemo(() => {
    const slotAmount = parseFloat(amount) || 0;
    const isPremium = slotAmount >= 100;
    const rate = isPremium ? 0.35 : 0.30;
    const earnings = slotAmount * rate;
    
    return {
      isPremium,
      rate: rate * 100,
      earnings,
      type: isPremium ? 'Premium' : 'Standard'
    };
  }, [amount]);

  const handleBuySlot = useCallback(async () => {
    const slotAmount = parseFloat(amount);
    
    if (isNaN(slotAmount) || slotAmount < 3) {
      captureError(new Error('Minimum investment is 3 USD'));
      return;
    }
    
    if (slotAmount > userBalance) {
      captureError(new Error('Insufficient balance'));
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await buySlot({ 
        telegramId, 
        slotId: 'new', 
        amount: slotAmount 
      });
      setLastPurchase({ amount: slotAmount, result });
      setAmount(''); // Очищаем поле после успешной покупки
      
      // FIX: Show user-friendly success notification
      alert(t('slotPurchase.success') + '\n\n' + t('slotPurchase.successDetails', { amount: slotAmount.toFixed(2) }));
      console.log('✅ Slot purchased successfully:', result);
      
    } catch (error: unknown) {
      console.error('❌ Slot purchase failed:', error);
      // FIX: Show user-friendly error notification
      const errorMessage = getErrorMessage(error, t('slotPurchase.error'));
      alert(t('slotPurchase.error') + '\n\n' + t('slotPurchase.errorMessage', { message: errorMessage }));
      captureError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [amount, userBalance, buySlot, captureError, t, telegramId]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  }, []);

  const handlePresetClick = useCallback((presetAmount: number) => {
    if (presetAmount <= userBalance) {
      setAmount(presetAmount.toString());
    }
  }, [userBalance]);

  const isPurchaseDisabled = isLoading || slotLoading || !amount || parseFloat(amount) < 3 || parseFloat(amount) > userBalance;

  return (
    <div className="slot-purchase-interface">
      <div className="slot-purchase-interface__header">
        <h3 className="slot-purchase-interface__title">Buy Mining Slot</h3>
        <div className="slot-purchase-interface__balance">
          <span className="slot-purchase-interface__balance-label">Available:</span>
          <span className="slot-purchase-interface__balance-amount">
            {userBalance.toFixed(4)} USD
          </span>
        </div>
      </div>

      <div className="slot-purchase-interface__form">
        <div className="slot-purchase-interface__amount">
          <label className="slot-purchase-interface__amount-label">Investment Amount:</label>
          <div className="slot-purchase-interface__amount-input-group">
            <input
              type="text"
              value={amount}
              onChange={handleAmountChange}
              placeholder="Enter amount (min 3 USD)"
              className="slot-purchase-interface__amount-input"
              disabled={isLoading}
              min="3"
              step="0.01"
            />
            <span className="slot-purchase-interface__amount-currency">USD</span>
          </div>
        </div>

        <div className="slot-purchase-interface__presets">
          <div className="slot-purchase-interface__presets-label">Quick Select:</div>
          <div className="slot-purchase-interface__presets-buttons">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                disabled={preset > userBalance || isLoading}
                className={`slot-purchase-interface__preset-button ${
                  preset > userBalance ? 'disabled' : ''
                }`}
              >
                {preset} USD
              </button>
            ))}
          </div>
        </div>

        {amount && (
          <div className="slot-purchase-interface__preview">
            <div className="slot-purchase-interface__preview-header">
              <div className="slot-purchase-interface__preview-type">
                {slotInfo.type} Slot
              </div>
              <div className="slot-purchase-interface__preview-rate">
                {slotInfo.rate}% weekly
              </div>
            </div>
            <div className="slot-purchase-interface__preview-details">
              <div className="slot-purchase-interface__preview-item">
                <span>Investment:</span>
                <span>{parseFloat(amount).toFixed(4)} USD</span>
              </div>
              <div className="slot-purchase-interface__preview-item">
                <span>Weekly Earnings:</span>
                <span>{slotInfo.earnings.toFixed(4)} USD</span>
              </div>
              <div className="slot-purchase-interface__preview-item">
                <span>Total After 7 Days:</span>
                <span>{(parseFloat(amount) + slotInfo.earnings).toFixed(4)} USD</span>
              </div>
            </div>
          </div>
        )}

        <LoadingButton
          onClick={handleBuySlot}
          loading={isLoading}
          disabled={isPurchaseDisabled}
          variant="success"
          size="lg"
          className="slot-purchase-interface__button"
          loadingText="Purchasing Slot..."
          icon="⛏️"
        >
          Buy {slotInfo.type} Slot
        </LoadingButton>
      </div>

      {lastPurchase && (
        <div className="slot-purchase-interface__result">
          <div className="slot-purchase-interface__result-success">
            ✅ Slot purchased successfully!
          </div>
          <div className="slot-purchase-interface__result-details">
            <div>Amount: {lastPurchase.amount.toFixed(4)} USD</div>
            <div>Type: {lastPurchase.amount >= 100 ? 'Premium' : 'Standard'}</div>
            <div>Rate: {lastPurchase.amount >= 100 ? '35%' : '30%'} weekly</div>
          </div>
        </div>
      )}
    </div>
  );
};

// Стили для SlotPurchaseInterface
export const slotPurchaseInterfaceStyles = `
.slot-purchase-interface {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 24px;
  margin: 20px 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.slot-purchase-interface__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.slot-purchase-interface__title {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0;
}

.slot-purchase-interface__balance {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.slot-purchase-interface__balance-label {
  color: #6c757d;
}

.slot-purchase-interface__balance-amount {
  font-weight: 600;
  color: #28a745;
}

.slot-purchase-interface__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.slot-purchase-interface__amount {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-purchase-interface__amount-label {
  font-weight: 500;
  color: #495057;
}

.slot-purchase-interface__amount-input-group {
  display: flex;
  align-items: center;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: white;
  overflow: hidden;
}

.slot-purchase-interface__amount-input {
  flex: 1;
  padding: 10px 12px;
  border: none;
  outline: none;
  font-size: 16px;
}

.slot-purchase-interface__amount-input:disabled {
  background: #e9ecef;
}

.slot-purchase-interface__amount-currency {
  padding: 10px 12px;
  background: #e9ecef;
  color: #6c757d;
  font-weight: 500;
  border-left: 1px solid #ced4da;
}

.slot-purchase-interface__presets {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-purchase-interface__presets-label {
  font-weight: 500;
  color: #495057;
}

.slot-purchase-interface__presets-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.slot-purchase-interface__preset-button {
  padding: 6px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.slot-purchase-interface__preset-button:hover:not(.disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.slot-purchase-interface__preset-button.disabled {
  background: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
  opacity: 0.6;
}

.slot-purchase-interface__preview {
  background: #e8f5e8;
  border: 1px solid #c3e6c3;
  border-radius: 6px;
  padding: 16px;
}

.slot-purchase-interface__preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.slot-purchase-interface__preview-type {
  font-weight: 600;
  color: #155724;
  font-size: 16px;
}

.slot-purchase-interface__preview-rate {
  color: #155724;
  font-size: 14px;
}

.slot-purchase-interface__preview-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slot-purchase-interface__preview-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #155724;
}

.slot-purchase-interface__button {
  width: 100%;
  margin-top: 8px;
}

.slot-purchase-interface__result {
  margin-top: 20px;
  padding: 16px;
  background: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 6px;
}

.slot-purchase-interface__result-success {
  color: #155724;
  font-weight: 600;
  margin-bottom: 8px;
}

.slot-purchase-interface__result-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 14px;
  color: #155724;
}

@media (max-width: 768px) {
  .slot-purchase-interface {
    padding: 16px;
    margin: 16px 0;
  }
  
  .slot-purchase-interface__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .slot-purchase-interface__presets-buttons {
    justify-content: center;
  }
}
`;

