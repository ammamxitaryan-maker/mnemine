"use client";

import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { showError } from '@/utils/toast';
import { CheckCircle, Clock, CreditCard, Loader2, RefreshCw, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Payment {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

interface PaymentHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PaymentHistory = ({ isOpen, onClose }: PaymentHistoryProps) => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchPayments = async (pageNum: number = 1, append: boolean = false) => {
    if (!user?.telegramId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/payments/history/${user.telegramId}?page=${pageNum}&limit=10`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('telegram_token')}`
        }
      });

      const data = await response.json();

      if (data.payments) {
        if (append) {
          setPayments(prev => [...prev, ...data.payments]);
        } else {
          setPayments(data.payments);
        }
        setHasMore(data.pagination.page < data.pagination.pages);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      showError(t('payment.historyError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && user?.telegramId) {
      fetchPayments(1, false);
    }
  }, [isOpen, user?.telegramId]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPayments(nextPage, true);
    }
  };

  const refresh = () => {
    setPage(1);
    fetchPayments(1, false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'REFUNDED':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return t('payment.status.completed');
      case 'FAILED':
        return t('payment.status.failed');
      case 'PENDING':
        return t('payment.status.pending');
      case 'REFUNDED':
        return t('payment.status.refunded');
      case 'CANCELLED':
        return t('payment.status.cancelled');
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CreditCard className="w-5 h-5 text-emerald-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {t('payment.history')}
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
        <div className="flex-1 overflow-y-auto p-6">
          {payments.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">{t('payment.noPayments')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="bg-muted/20 rounded-lg p-4 border border-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(payment.status)}
                      <span className="text-sm font-medium text-foreground">
                        {getStatusText(payment.status)}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-500">
                      ${payment.amount} {payment.currency}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">
                    {payment.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>ID: {payment.orderId}</span>
                    <span>{formatDate(payment.createdAt)}</span>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {hasMore && (
                <div className="text-center pt-4">
                  <button
                    onClick={loadMore}
                    disabled={isLoading}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors flex items-center gap-2 mx-auto"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t('payment.loading')}
                      </>
                    ) : (
                      t('payment.loadMore')
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <div className="flex gap-3">
            <button
              onClick={refresh}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-foreground rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('payment.refresh')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
            >
              {t('payment.close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
