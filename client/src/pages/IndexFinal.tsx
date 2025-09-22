"use client";

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClaimEarnings } from '@/hooks/useClaimEarnings';
import { useReinvest } from '@/hooks/useReinvest';
import { useOptimizedDashboard } from '@/hooks/useOptimizedData';
import { motion } from 'framer-motion';

import { AuthWrapper } from '@/components/AuthWrapper';
import { FlippableCard } from '@/components/FlippableCard';
import { MainCardFront } from '@/components/MainCardFront';
import { MainCardBack } from '@/components/MainCardBack';
import { CTAButton } from '@/components/CTAButton';
import { MinimalCard } from '@/components/MinimalCard';
import { AuthenticatedUser } from '@/types/telegram';

import { 
  Zap, 
  Server, 
  CheckSquare, 
  ArrowRightLeft,
  TrendingUp,
  Wallet,
  Users,
  Menu,
  Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
  const { t } = useTranslation();
  
  // Use optimized dashboard hook for all data
  const {
    userData: classicUserData,
    slotsData,
    tasksData,
    lotteryData,
    bonusesData,
    achievementsData,
    isLoading: overallLoading,
    hasError: anyError,
    loadingStates
  } = useOptimizedDashboard(user.telegramId);

  const { claim, isClaiming } = useClaimEarnings();
  const { reinvest, isReinvesting } = useReinvest();

  // Essential actions - only the most important ones
  const essentialActions = useMemo(() => [
    { 
      id: "slots",
      to: "/slots", 
      icon: Server, 
      titleKey: "slots", 
      count: slotsData?.filter((s: any) => s.isActive).length || 0,
      isPrimary: true
    },
    { 
      id: "swap",
      to: "/swap", 
      icon: ArrowRightLeft, 
      titleKey: "swap.title", 
      count: null,
      isPrimary: true
    },
    { 
      id: "tasks",
      to: "/tasks", 
      icon: CheckSquare, 
      titleKey: "tasks", 
      count: tasksData?.filter((t: any) => !t.isCompleted).length || 0,
      isPrimary: false
    },
    { 
      id: "menu",
      to: "/menu", 
      icon: Menu, 
      titleKey: "menu", 
      count: null,
      isPrimary: false
    },
  ], [slotsData, tasksData]);

  // Handle error state
  if (anyError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Data Loading Error</h2>
          <p className="text-red-400 mb-4">{anyError.toString()}</p>
          <CTAButton onClick={() => window.location.reload()} variant="primary">
            Retry
          </CTAButton>
        </div>
      </div>
    );
  }

  // Handle loading state
  if (overallLoading || !classicUserData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading your data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        
        {/* Simplified Header */}
        <motion.header 
          className="text-center mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {user.firstName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your mining dashboard
          </p>
        </motion.header>

        {/* Main Balance Card - Prominent */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="w-full max-w-2xl mx-auto">
            <FlippableCard
              id="main-card"
              frontContent={
                <MainCardFront 
                  userData={classicUserData} 
                  slotsData={slotsData}
                  displayEarnings={classicUserData?.accruedEarnings ?? 0}
                  onClaim={claim}
                  isClaiming={isClaiming}
                  onReinvest={reinvest}
                  isReinvesting={isReinvesting}
                />
              }
              backContent={<MainCardBack user={user} slots={slotsData} isLoading={loadingStates.slotsData} />}
            />
          </div>
        </motion.section>

        {/* Primary Actions - Highlighted */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 gap-4">
            {essentialActions.filter(action => action.isPrimary).map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
              >
                <CTAButton
                  onClick={() => window.location.href = action.to}
                  variant="primary"
                  size="lg"
                  fullWidth
                  icon={<action.icon className="w-6 h-6" />}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{t(action.titleKey)}</span>
                    {action.count !== null && (
                      <span className="text-sm opacity-90">{action.count}</span>
                    )}
                  </div>
                </CTAButton>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Secondary Actions - Minimal */}
        <motion.section
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-2 gap-3">
            {essentialActions.filter(action => !action.isPrimary).map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <MinimalCard
                  onClick={() => window.location.href = action.to}
                  padding="sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <action.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t(action.titleKey)}
                      </span>
                    </div>
                    {action.count !== null && (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full">
                        {action.count}
                      </span>
                    )}
                  </div>
                </MinimalCard>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Detailed Information - Tabs with Accordion */}
        <motion.section
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-6">
              <MinimalCard padding="md">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Mining Power', value: `${((classicUserData?.miningPower ?? 0) * 100).toFixed(1)}%`, icon: Zap, color: 'blue' },
                    { label: 'Active Slots', value: `${slotsData?.filter((s: any) => s.isActive).length || 0}`, icon: Server, color: 'green' },
                    { label: 'Referrals', value: `${classicUserData?.referralCount || 0}`, icon: Users, color: 'purple' },
                    { label: 'Total Invested', value: `${classicUserData?.totalInvested?.toFixed(2) || '0'} CFM`, icon: TrendingUp, color: 'orange' }
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <stat.icon className={`w-4 h-4 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</span>
                      </div>
                      <span className={`font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                        {stat.value}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </MinimalCard>
            </TabsContent>
            
            <TabsContent value="details" className="mt-6">
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="recent-activity" className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50 rounded-xl">
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                        <CheckSquare className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">Recent Activity</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {[
                        { icon: '💰', text: 'Earnings updated', time: '2 min ago', color: 'green' },
                        { icon: '⛏️', text: 'Mining slot active', time: '5 min ago', color: 'blue' },
                        { icon: '🎁', text: 'Referral bonus earned', time: '1 hour ago', color: 'purple' },
                        { icon: '✅', text: 'Investment completed', time: '3 hours ago', color: 'orange' }
                      ].map((activity, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg"
                        >
                          <div className="text-lg">{activity.icon}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{activity.text}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                          </div>
                          <div className={`w-2 h-2 bg-${activity.color}-500 rounded-full animate-pulse`} />
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
          </Tabs>
        </motion.section>
      </div>
    </motion.div>
  );
};

const IndexFinal = () => {
  return (
    <AuthWrapper>
      {(user) => <IndexContent user={user} />}
    </AuthWrapper>
  );
};

export default IndexFinal;
