"use client";

import { ActivityCard } from '@/components/common/ActivityCard';
import { EarningsChart } from '@/components/common/EarningsChart';
import { Button } from '@/components/ui/button';
import { Activity, useActivityData } from '@/hooks/useActivityData';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData } from '@/hooks/useUserData';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
  History,
  TrendingUp,
  Wallet as WalletIcon
} from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BackButton } from './BackButton';
import { PaymentHistory } from './PaymentHistory';
import { PaymentModal } from './PaymentModal';
import { SimpleBalance } from './SimpleBalance';

export const MinimalistWalletPage = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { isLoading: userDataLoading } = useUserData(user?.telegramId);
  const { data: activities, isLoading: activityLoading } = useActivityData(user?.telegramId);
  const { hapticLight } = useHapticFeedback();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isPaymentHistoryOpen, setIsPaymentHistoryOpen] = useState(false);

  const isLoading = userDataLoading || activityLoading;

  const quickActions = [
    {
      action: () => setIsPaymentModalOpen(true),
      icon: ArrowDownToLine,
      label: t('payment.title'),
      subtitle: t('payment.method'),
      color: 'text-primary'
    },
    {
      to: '/withdraw',
      icon: ArrowUpFromLine,
      label: t('withdraw'),
      subtitle: 'Cash out',
      color: 'text-secondary'
    },
    {
      to: '/withdraw/usdt',
      icon: DollarSign,
      label: 'USDT Withdraw',
      subtitle: 'TRC20 USDT',
      color: 'text-green-500'
    },
    {
      action: () => setIsPaymentHistoryOpen(true),
      icon: History,
      label: t('payment.history'),
      subtitle: 'Transactions',
      color: 'text-accent'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading wallet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <WalletIcon className="w-5 h-5 text-primary" />
          <div>
            <h1 className="text-xl font-medium text-foreground">Wallet</h1>
            <p className="text-sm text-muted-foreground">
              Manage your funds and transactions
            </p>
          </div>
        </div>
      </header>

      {/* Balance */}
      <div className="px-6 mb-6">
        <SimpleBalance telegramId={user?.telegramId || ''} />
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            action.to ? (
              <Link
                key={action.to}
                to={action.to}
                className="minimal-card p-3 text-center"
                onClick={() => hapticLight()}
              >
                <action.icon className={`w-5 h-5 mx-auto mb-2 ${action.color}`} />
                <h3 className="font-medium text-foreground text-sm">
                  {action.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {action.subtitle}
                </p>
              </Link>
            ) : (
              <button
                key={index}
                onClick={() => {
                  hapticLight();
                  action.action?.();
                }}
                className="minimal-card p-3 text-center w-full"
              >
                <action.icon className={`w-5 h-5 mx-auto mb-2 ${action.color}`} />
                <h3 className="font-medium text-foreground text-sm">
                  {action.label}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {action.subtitle}
                </p>
              </button>
            )
          ))}
        </div>
      </div>

      {/* Balance History Chart */}
      {activities && activities.length > 0 && (
        <div className="px-6 mb-6">
          <div className="minimal-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-secondary" />
              <h3 className="font-medium text-foreground">Balance History</h3>
            </div>
            <EarningsChart activity={activities} />
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-accent/10 rounded-xl">
            <History className="w-5 h-5 text-accent" />
          </div>
          <h3 className="font-medium text-foreground">Recent Activity</h3>
        </div>

        {activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 5).map((activity: Activity) => (
              <div key={activity.id} className="minimal-card">
                <ActivityCard activity={activity} />
              </div>
            ))}
            {activities.length > 5 && (
              <div className="text-center">
                <Link to="/wallet">
                  <Button variant="outline" size="sm" className="border-border">
                    View All Transactions
                  </Button>
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="minimal-card text-center py-8">
            <div className="p-4 bg-muted/20 rounded-2xl w-fit mx-auto mb-4">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No Transactions Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your transaction history will appear here
            </p>
          </div>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />

      {/* Payment Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          // Refresh user data after successful payment
          window.location.reload();
        }}
      />

      <PaymentHistory
        isOpen={isPaymentHistoryOpen}
        onClose={() => setIsPaymentHistoryOpen(false)}
      />
    </div>
  );
};
