"use client";

import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const PaymentSuccess = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [_paymentData, setPaymentData] = useState<any>(null);

  const orderId = searchParams.get('orderId');

  useEffect(() => {
    if (orderId) {
      checkPaymentStatus(orderId);
    } else {
      setPaymentStatus('failed');
    }
  }, [orderId]);

  const checkPaymentStatus = async (orderId: string) => {
    try {
      const response = await fetch(`/api/payments/status/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telegram_token')}`
        }
      });

      const data = await response.json();

      if (data.status) {
        setPaymentData(data);
        setPaymentStatus(data.status === 'COMPLETED' ? 'success' : 'failed');
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
      setPaymentStatus('failed');
    }
  };

  const handleBackToApp = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-8 text-center">
        {paymentStatus === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t('payment.checking')}
            </h1>
            <p className="text-muted-foreground">
              {t('payment.checkingDescription')}
            </p>
          </>
        )}

        {paymentStatus === 'success' && (
          <>
            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t('payment.success')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('payment.successDescription')}
            </p>

            {_paymentData && (
              <div className="bg-muted/20 rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">{t('payment.amount')}</span>
                  <span className="font-semibold text-emerald-500">
                    ${_paymentData.amount} {_paymentData.currency}
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">{t('payment.orderId')}</span>
                  <span className="text-sm font-mono">{_paymentData.orderId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('payment.status')}</span>
                  <span className="text-sm text-emerald-500 font-medium">
                    {t('payment.status.completed')}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={handleBackToApp}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('payment.backToApp')}
            </button>
          </>
        )}

        {paymentStatus === 'failed' && (
          <>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {t('payment.failed')}
            </h1>
            <p className="text-muted-foreground mb-6">
              {t('payment.failedDescription')}
            </p>

            <button
              onClick={handleBackToApp}
              className="w-full bg-muted hover:bg-muted/80 text-foreground py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('payment.backToApp')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};
