"use client";

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClaimEarnings } from '@/hooks/useClaimEarnings';
import { useReinvest } from '@/hooks/useReinvest';
import { useOptimizedDashboard, useBackgroundSync } from '@/hooks/useOptimizedData';
import { motion } from 'framer-motion';

import { AuthWrapper } from '@/components/AuthWrapper';
import { SmartCard } from '@/components/ui/smart-card';
import { CTAButton } from '@/components/ui/cta-button';
import { EnhancedTabs, EnhancedTabsList, EnhancedTabsTrigger, EnhancedTabsContent } from '@/components/ui/enhanced-tabs';
import { EnhancedAccordion, EnhancedAccordionItem, EnhancedAccordionTrigger, EnhancedAccordionContent } from '@/components/ui/enhanced-accordion';
import { HomePageHeader } from '@/components/HomePageHeader';
import { RealTimePriceChart } from '@/components/RealTimePriceChart';
import { ExchangeRateModal } from '@/components/ExchangeRateModal';
import { DynamicEarningsDisplay } from '@/components/DynamicEarningsDisplay';
import { AnimatedEarningsCalculator } from '@/components/AnimatedEarningsCalculator';
import { AuthenticatedUser } from '@/types/telegram';

import { 
  Zap, 
  Server, 
  Trophy, 
  Gift, 
  CheckSquare, 
  Award, 
  Ticket, 
  Loader2, 
  ArrowRightLeft,
  TrendingUp,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';

const SimplifiedIndexContent = ({ user }: { user: AuthenticatedUser }) => {
  const { t } = useTranslation();
  
  // State for exchange rate modal
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  
  // Use optimized dashboard hook for all data
  const {
    userData: classicUserData,
    slotsData,
    tasksData,
    lotteryData,
    bonusesData,
    achievementsData,
    marketData,
    isLoading: overallLoading,
    hasError: anyError,
    loadingStates
  } = useOptimizedDashboard(user.telegramId);

  // Enable background sync
  useBackgroundSync(user.telegramId);

  const { claim, isClaiming } = useClaimEarnings();
  const { reinvest, isReinvesting } = useReinvest();

  // Memoize quick actions
  const quickActions = useMemo(() => [
    { 
      id: "tasks",
      to: "/tasks", 
      icon: CheckSquare, 
      titleKey: "tasks", 
      count: tasksData?.filter((t: any) => !t.isCompleted).length ?? 0,
      color: "from-green-500 to-emerald-600"
    },
    { 
      id: "slots",
      to: "/slots", 
      icon: Server, 
      titleKey: "slots", 
      count: slotsData?.filter((s: any) => s.isActive).length ?? 0,
      color: "from-blue-500 to-indigo-600"
    },
    { 
      id: "lottery",
      to: "/lottery", 
      icon: Ticket, 
      titleKey: "lottery.title", 
      count: lotteryData?.jackpot?.toFixed(2) ?? "0",
      color: "from-purple-500 to-pink-600"
    },
    { 
      id: "bonuses",
      to: "/bonuses", 
      icon: Gift, 
      titleKey: "bonuses",
      count: bonusesData?.claimableCount ?? 0,
      color: "from-orange-500 to-red-600"
    },
  ], [tasksData, slotsData, lotteryData, bonusesData]);

  // Handle error state
  if (anyError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Data Loading Error</h2>
          <p className="text-red-400 mb-4">{anyError.toString()}</p>
          <CTAButton onClick={() => window.location.reload()}>
            Retry
          </CTAButton>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (overallLoading || !classicUserData || !marketData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading your data...</p>
      </div>
    );
  }

  return (
    <>
      <motion.div 
        className="min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Design System Container */}
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          
          {/* Header Section */}
          <motion.header 
            className="flex items-center justify-between mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <HomePageHeader user={user} />
            <CTAButton
              onClick={() => window.location.href = '/swap'}
              icon={ArrowRightLeft}
              size="md"
            >
              Swap CFM
            </CTAButton>
          </motion.header>

          {/* Main Dashboard with Tabs */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8"
          >
            <EnhancedTabs defaultValue="overview" className="w-full">
              <EnhancedTabsList variant="pills" className="mb-6">
                <EnhancedTabsTrigger value="overview">Overview</EnhancedTabsTrigger>
                <EnhancedTabsTrigger value="analytics">Analytics</EnhancedTabsTrigger>
                <EnhancedTabsTrigger value="activity">Activity</EnhancedTabsTrigger>
              </EnhancedTabsList>

              {/* Overview Tab */}
              <EnhancedTabsContent value="overview" variant="card">
                <div className="space-y-6">
                  {/* Main Balance Display */}
                  <SmartCard
                    title="Available Balance"
                    icon={DollarSign}
                    iconColor="from-green-500 to-emerald-600"
                    variant="glass"
                  >
                    <div className="text-center">
                      <motion.p 
                        className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                        key={classicUserData?.balance?.toFixed(6)}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {classicUserData?.balance?.toFixed(6) || '0.000000'} CFM
                      </motion.p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Available for investment, lottery, or withdrawal
                      </p>
                      <div className="flex gap-2">
                        <CTAButton
                          onClick={claim}
                          loading={isClaiming}
                          variant="success"
                          size="sm"
                          fullWidth
                        >
                          Claim Earnings
                        </CTAButton>
                        <CTAButton
                          onClick={reinvest}
                          loading={isReinvesting}
                          variant="primary"
                          size="sm"
                          fullWidth
                        >
                          Reinvest
                        </CTAButton>
                      </div>
                    </div>
                  </SmartCard>

                  {/* Dynamic Earnings Display */}
                  <DynamicEarningsDisplay
                    totalInvested={classicUserData?.totalInvested || 0}
                    activeSlots={classicUserData?.miningSlots || []}
                    currentBalance={classicUserData?.balance || 0}
                  />

                  {/* Price Chart */}
                  <SmartCard
                    title="CFM Price"
                    icon={TrendingUp}
                    iconColor="from-blue-500 to-indigo-600"
                    variant="glass"
                  >
                    <RealTimePriceChart />
                    <CTAButton
                      onClick={() => setIsExchangeModalOpen(true)}
                      variant="ghost"
                      size="sm"
                      className="mt-4 w-full"
                    >
                      View Exchange Rate
                    </CTAButton>
                  </SmartCard>
                </div>

                {/* Quick Actions */}
                <SmartCard
                  title="Quick Actions"
                  icon={Zap}
                  iconColor="from-purple-500 to-pink-600"
                  variant="glass"
                >
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {quickActions.map((action, index) => (
                      <motion.div
                        key={action.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <CTAButton
                          onClick={() => window.location.href = action.to}
                          variant="ghost"
                          className="w-full h-24 flex-col gap-2"
                        >
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                            <action.icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">{t(action.titleKey)}</p>
                            <p className="text-xs text-gray-500">{action.count}</p>
                          </div>
                        </CTAButton>
                      </motion.div>
                    ))}
                  </div>
                </SmartCard>
              </EnhancedTabsContent>

              {/* Analytics Tab */}
              <EnhancedTabsContent value="analytics" variant="card">
                <div className="space-y-6">
                  {/* Investment Calculator */}
                  <AnimatedEarningsCalculator
                    currentBalance={classicUserData?.balance || 0}
                    onInvest={(amount) => {
                      // Redirect to slots page with pre-filled amount
                      window.location.href = `/slots?amount=${amount}`;
                    }}
                  />

                  {/* Analytics Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SmartCard
                      title="Total Invested"
                      icon={DollarSign}
                      iconColor="from-blue-500 to-indigo-600"
                      variant="minimal"
                    >
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {classicUserData?.totalInvested?.toFixed(2) || '0.00'} CFM
                      </p>
                    </SmartCard>

                    <SmartCard
                      title="Active Slots"
                      icon={Server}
                      iconColor="from-green-500 to-emerald-600"
                      variant="minimal"
                    >
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {slotsData?.filter((s: any) => s.isActive).length || 0}
                      </p>
                    </SmartCard>

                    <SmartCard
                      title="Referrals"
                      icon={Users}
                      iconColor="from-purple-500 to-pink-600"
                      variant="minimal"
                    >
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {classicUserData?.referralCount || 0}
                      </p>
                    </SmartCard>
                  </div>
                </div>
              </EnhancedTabsContent>

              {/* Activity Tab */}
              <EnhancedTabsContent value="activity" variant="card">
                <EnhancedAccordion type="single" collapsible className="w-full">
                  <EnhancedAccordionItem value="recent-activity" variant="card">
                    <EnhancedAccordionTrigger>
                      <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-blue-600" />
                        <span>Recent Activity</span>
                      </div>
                    </EnhancedAccordionTrigger>
                    <EnhancedAccordionContent>
                      <div className="space-y-3">
                        {[
                          { icon: '💰', text: 'Earnings updated', time: '2 min ago', color: 'green' },
                          { icon: '⛏️', text: 'Mining slot active', time: '5 min ago', color: 'blue' },
                          { icon: '🎁', text: 'Referral bonus earned', time: '1 hour ago', color: 'purple' },
                          { icon: '✅', text: 'Investment completed', time: '3 hours ago', color: 'orange' }
                        ].map((activity, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                          >
                            <div className="text-2xl">{activity.icon}</div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{activity.text}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                            </div>
                            <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full animate-pulse`} />
                          </motion.div>
                        ))}
                      </div>
                    </EnhancedAccordionContent>
                  </EnhancedAccordionItem>
                </EnhancedAccordion>
              </EnhancedTabsContent>
            </EnhancedTabs>
          </motion.section>
        </div>
      </motion.div>

      {/* Exchange Rate Modal */}
      <ExchangeRateModal 
        isOpen={isExchangeModalOpen} 
        onClose={() => setIsExchangeModalOpen(false)} 
      />
    </>
  );
};

const SimplifiedIndex = () => {
  return (
    <AuthWrapper>
      {(user) => <SimplifiedIndexContent user={user} />}
    </AuthWrapper>
  );
};

export default SimplifiedIndex;
