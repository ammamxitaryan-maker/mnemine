"use client";

import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { showError, showSuccess } from '@/utils/toast';
import { CreditCard, DollarSign, Loader2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentModal = ({ isOpen, onClose, onSuccess }: PaymentModalProps) => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (!user?.telegramId) {
      showError(t('payment.userNotFound'));
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showError(t('payment.invalidAmount'));
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('telegram_token')}`
        },
        body: JSON.stringify({
          telegramId: user.telegramId,
          amount: parseFloat(amount),
          currency: 'USD',
          description: description || t('payment.defaultDescription')
        })
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        // Open payment URL in new tab
        window.open(data.paymentUrl, '_blank');
        showSuccess(t('payment.redirecting'));
        onSuccess?.();
        onClose();
      } else {
        showError(data.error || t('payment.creationFailed'));
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      showError(t('payment.networkError'));
    } finally {
      setIsLoading(false);
    }
  };

  const presetAmounts = [10, 25, 50, 100, 250, 500];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {t('payment.title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Amount Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              {t('payment.amount')}
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                min="1"
                step="0.01"
              />
            </div>

            {/* Preset Amounts */}
            <div className="grid grid-cols-3 gap-2">
              {presetAmounts.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  className="px-3 py-2 text-sm bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors"
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              {t('payment.description')}
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('payment.descriptionPlaceholder')}
              className="w-full px-4 py-3 bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          {/* Payment Info */}
          <div className="bg-muted/20 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="w-4 h-4" />
              <span>{t('payment.method')}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('payment.info')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors"
            >
              {t('payment.cancel')}
            </button>
            <button
              onClick={handlePayment}
              disabled={isLoading || !amount}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-muted disabled:text-muted-foreground text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('payment.processing')}
                </>
              ) : (
                t('payment.pay')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
