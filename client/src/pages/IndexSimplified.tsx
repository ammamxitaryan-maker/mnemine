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
  Wallet,
  Users
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TouchButton } from '@/components/FullscreenSection';
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
    marketData,
    isLoading: overallLoading,
    hasError: anyError,
    loadingStates
  } = useOptimizedDashboard(user.telegramId);

  const { claim, isClaiming } = useClaimEarnings();
  const { reinvest, isReinvesting } = useReinvest();

  // Simplified navigation items - only essential ones
  const essentialNavItems = useMemo(() => [
    { 
      id: "slots",
      to: "/slots", 
      icon: Server, 
      titleKey: "slots", 
      count: slotsData?.filter((s: any) => s.isActive).length || 0,
      color: "blue"
    },
    { 
      id: "tasks",
      to: "/tasks", 
      icon: CheckSquare, 
      titleKey: "tasks", 
      count: tasksData?.filter((t: any) => !t.isCompleted).length || 0,
      color: "green"
    },
    { 
      id: "swap",
      to: "/swap", 
      icon: ArrowRightLeft, 
      titleKey: "swap.title", 
      count: null,
      color: "purple"
    },
    { 
      id: "lottery",
      to: "/lottery", 
      icon: Ticket, 
      titleKey: "lottery.title", 
      count: lotteryData?.jackpot ? parseFloat(lotteryData.jackpot).toFixed(0) : null,
      color: "orange"
    },
  ], [slotsData, tasksData, lotteryData]);

  // Handle error state
  if (anyError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Data Loading Error</h2>
          <p className="text-red-400 mb-4">{anyError.toString()}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
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

        {/* Essential Actions - Compact Grid */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-8"
        >
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {essentialNavItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <TouchButton
                      onClick={() => window.location.href = item.to}
                      className="w-full p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300/50 dark:hover:border-blue-600/50"
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className={`p-3 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-lg mb-2`}>
                          <item.icon className={`w-6 h-6 text-${item.color}-600 dark:text-${item.color}-400`} />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t(item.titleKey)}
                        </span>
                        {item.count !== null && (
                          <span className={`text-xs font-bold text-${item.color}-600 dark:text-${item.color}-400`}>
                            {item.count}
                          </span>
                        )}
                      </div>
                    </TouchButton>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Detailed Information - Tabs */}
        <motion.section
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="stats">Statistics</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="more">More</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats" className="mt-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                <CardContent className="p-6">
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
                        transition={{ delay: 0.5 + index * 0.1 }}
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="recent-activity">
                      <AccordionTrigger className="text-sm font-medium">
                        Recent Activity (4 items)
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3">
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
                              <div className="text-xl">{activity.icon}</div>
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="more" className="mt-6">
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { to: '/wallet', icon: Wallet, label: 'Wallet', color: 'blue' },
                      { to: '/referrals', icon: Users, label: 'Referrals', color: 'green' },
                      { to: '/boosters', icon: Zap, label: 'Boosters', color: 'purple' },
                      { to: '/achievements', icon: Award, label: 'Achievements', color: 'orange' }
                    ].map((item, index) => (
                      <motion.div
                        key={item.to}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <TouchButton
                          onClick={() => window.location.href = item.to}
                          className="w-full p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-lg hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300"
                        >
                          <div className="flex flex-col items-center text-center">
                            <div className={`p-2 bg-${item.color}-100 dark:bg-${item.color}-900/30 rounded-lg mb-2`}>
                              <item.icon className={`w-5 h-5 text-${item.color}-600 dark:text-${item.color}-400`} />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {item.label}
                            </span>
                          </div>
                        </TouchButton>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.section>
      </div>
    </motion.div>
  );
};

const IndexSimplified = () => {
  return (
    <AuthWrapper>
      {(user) => <IndexContent user={user} />}
    </AuthWrapper>
  );
};

export default IndexSimplified;
