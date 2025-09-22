"use client";

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, History, TrendingUp } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useActivityData, Activity } from '@/hooks/useActivityData';
import { useUserData, UserData } from '@/hooks/useUserData';
import { ActivityCard } from '@/components/ActivityCard';
import { EarningsChart } from '@/components/EarningsChart';
import { SmartCard } from '@/components/ui/smart-card';
import { CTAButton } from '@/components/ui/cta-button';
import { EnhancedTabs, EnhancedTabsList, EnhancedTabsTrigger, EnhancedTabsContent } from '@/components/ui/enhanced-tabs';
import { EnhancedAccordion, EnhancedAccordionItem, EnhancedAccordionTrigger, EnhancedAccordionContent } from '@/components/ui/enhanced-accordion';
import { motion } from 'framer-motion';

const SimplifiedWallet = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: activities, isLoading: activityLoading, error: activityError } = useActivityData(user?.telegramId);
  const { data: userData, isLoading: userDataLoading, error: userDataError } = useUserData(user?.telegramId);
  const { t } = useTranslation();

  const isLoading = authLoading || activityLoading || userDataLoading;
  const error = activityError || userDataError;

  if (error) {
    console.error(`[SimplifiedWallet] Error fetching data for user ${user?.telegramId}:`, error);
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

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <motion.header 
          className="flex items-center gap-4 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <WalletIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Wallet</h1>
            <p className="text-gray-600 dark:text-gray-400">Manage your CFM balance and transactions</p>
          </div>
        </motion.header>

        {/* Main Content with Tabs */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <EnhancedTabs defaultValue="balance" className="w-full">
            <EnhancedTabsList variant="pills" className="mb-6">
              <EnhancedTabsTrigger value="balance">Balance</EnhancedTabsTrigger>
              <EnhancedTabsTrigger value="transactions">Transactions</EnhancedTabsTrigger>
              <EnhancedTabsTrigger value="analytics">Analytics</EnhancedTabsTrigger>
            </EnhancedTabsList>

            {/* Balance Tab */}
            <EnhancedTabsContent value="balance" variant="card">
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
                          {(userData as UserData)?.balance?.toFixed(4) || '0.0000'} CFM
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
                      {(userData as UserData)?.totalInvested?.toFixed(2) || '0.00'} CFM
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
                      {(userData as UserData)?.accruedEarnings?.toFixed(2) || '0.00'} CFM
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
                      {(userData as UserData)?.miningSlots?.filter((slot: any) => slot.isActive).length || 0}
                    </p>
                  </SmartCard>
                </div>
              </div>
            </EnhancedTabsContent>

            {/* Transactions Tab */}
            <EnhancedTabsContent value="transactions" variant="card">
              {isLoading ? (
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
              )}
            </EnhancedTabsContent>

            {/* Analytics Tab */}
            <EnhancedTabsContent value="analytics" variant="card">
              {isLoading ? (
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
              )}
            </EnhancedTabsContent>
          </EnhancedTabs>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default SimplifiedWallet;
