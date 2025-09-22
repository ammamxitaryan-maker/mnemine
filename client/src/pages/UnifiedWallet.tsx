"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Loader2, 
  Wallet as WalletIcon, 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  History, 
  TrendingUp 
} from 'lucide-react';

import { TabbedPageLayout } from '@/components/pages/TabbedPageLayout';
import { SmartCard } from '@/components/ui/smart-card';
import { CTAButton } from '@/components/ui/cta-button';
import { EnhancedAccordion, EnhancedAccordionItem, EnhancedAccordionTrigger, EnhancedAccordionContent } from '@/components/ui/enhanced-accordion';
import { usePageData } from '@/hooks/usePageData';
import { useActivityData, Activity } from '@/hooks/useActivityData';
import { ActivityCard } from '@/components/ActivityCard';
import { EarningsChart } from '@/components/EarningsChart';
import { motion } from 'framer-motion';

const UnifiedWallet: React.FC = () => {
  const { t } = useTranslation();
  const { user, userData, isLoading: authLoading } = usePageData();
  const { data: activities, isLoading: activityLoading, error: activityError } = useActivityData(user?.telegramId);

  const isLoading = authLoading || activityLoading;
  const error = activityError;

  if (error) {
    console.error(`[UnifiedWallet] Error fetching data for user ${user?.telegramId}:`, error);
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <SmartCard variant="glass" className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error Loading Wallet</h2>
          <p className="text-red-400 mb-4">Could not load wallet data.</p>
          <CTAButton onClick={() => window.location.reload()}>
            Retry
          </CTAButton>
        </SmartCard>
      </div>
    );
  }

  const handleBack = () => window.history.back();

  const tabs = [
    {
      value: "balance",
      label: "Balance",
      content: (
        <div className="space-y-6">
          {/* Current Balance Card */}
          <SmartCard
            title="Current Balance"
            icon={WalletIcon}
            iconColor="from-green-500 to-emerald-600"
            variant="glass"
          >
            <div className="text-center">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <p className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                    {userData?.balance?.toFixed(4) || '0.0000'} CFM
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <Link to="/deposit">
                      <CTAButton
                        icon={ArrowDownToLine}
                        variant="success"
                        fullWidth
                      >
                        Deposit
                      </CTAButton>
                    </Link>
                    <Link to="/withdraw">
                      <CTAButton
                        icon={ArrowUpFromLine}
                        variant="primary"
                        fullWidth
                      >
                        Withdraw
                      </CTAButton>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </SmartCard>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SmartCard
              title="Total Invested"
              icon={TrendingUp}
              iconColor="from-blue-500 to-indigo-600"
              variant="minimal"
              size="sm"
            >
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {userData?.totalInvested?.toFixed(2) || '0.00'} CFM
              </p>
            </SmartCard>

            <SmartCard
              title="Total Earnings"
              icon={WalletIcon}
              iconColor="from-green-500 to-emerald-600"
              variant="minimal"
              size="sm"
            >
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {userData?.accruedEarnings?.toFixed(2) || '0.00'} CFM
              </p>
            </SmartCard>

            <SmartCard
              title="Active Slots"
              icon={TrendingUp}
              iconColor="from-purple-500 to-pink-600"
              variant="minimal"
              size="sm"
            >
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {userData?.miningSlots?.filter((slot: any) => slot.isActive).length || 0}
              </p>
            </SmartCard>
          </div>
        </div>
      )
    },
    {
      value: "transactions",
      label: "Transactions",
      content: isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : activities && activities.length > 0 ? (
        <EnhancedAccordion type="single" collapsible defaultValue="recent-transactions" className="w-full">
          <EnhancedAccordionItem value="recent-transactions" variant="card">
            <EnhancedAccordionTrigger>
              <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-blue-600" />
                <span>Recent Transactions ({activities.length})</span>
              </div>
            </EnhancedAccordionTrigger>
            <EnhancedAccordionContent>
              <div className="space-y-3">
                {activities.map((tx: Activity) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ActivityCard activity={tx} />
                  </motion.div>
                ))}
              </div>
            </EnhancedAccordionContent>
          </EnhancedAccordionItem>
        </EnhancedAccordion>
      ) : (
        <div className="text-center py-10">
          <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">No recent transactions</p>
        </div>
      )
    },
    {
      value: "analytics",
      label: "Analytics",
      content: isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : activities && activities.length > 0 ? (
        <SmartCard
          title="Balance History"
          icon={TrendingUp}
          iconColor="from-blue-500 to-indigo-600"
          variant="glass"
        >
          <EarningsChart activity={activities} />
        </SmartCard>
      ) : (
        <div className="text-center py-10">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
        </div>
      )
    }
  ];

  if (isLoading && !userData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading wallet...</p>
      </div>
    );
  }

  return (
    <TabbedPageLayout
      title="Wallet"
      subtitle="Manage your CFM balance and transactions"
      icon={WalletIcon}
      iconColor="from-blue-500 to-indigo-600"
      onBack={handleBack}
      tabs={tabs}
      defaultTab="balance"
    />
  );
};

export default UnifiedWallet;
