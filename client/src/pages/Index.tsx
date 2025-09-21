"use client";

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClaimEarnings } from '@/hooks/useClaimEarnings';
import { useReinvest } from '@/hooks/useReinvest';
import { useOptimizedDashboard, useBackgroundSync } from '@/hooks/useOptimizedData';
import { motion } from 'framer-motion';

import { AuthWrapper } from '@/components/AuthWrapper';
import { FlippableCard } from '@/components/FlippableCard';
import { MainCardFront } from '@/components/MainCardFront';
import { MainCardBack } from '@/components/MainCardBack';
import { HomePageHeader } from '@/components/HomePageHeader';
import { ProfessionalDashboard } from '@/components/ProfessionalDashboard';
import { ExchangeRateModal } from '@/components/ExchangeRateModal';
import { RealTimePriceChart } from '@/components/RealTimePriceChart';
import Earth from '@/components/Earth';
import { CacheStats } from '@/components/CacheStats';
import { AuthenticatedUser } from '@/types/telegram';

import { Zap, Server, Trophy, Gift, CheckSquare, Award, Ticket, Loader2, ArrowRightLeft } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { TouchButton } from '@/components/FullscreenSection';

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
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
    refetchAll: _refetchAll,
    loadingStates
  } = useOptimizedDashboard(user.telegramId);

  // Enable background sync
  useBackgroundSync(user.telegramId);

  const { claim, isClaiming } = useClaimEarnings();
  const { reinvest, isReinvesting } = useReinvest();

  // For professional view, use the same data but with different presentation
  const realTimeUserData = classicUserData;


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


  if (overallLoading || !classicUserData || !realTimeUserData || !marketData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading your data...</p>
      </div>
    );
  }

  // Memoize navigation items to prevent unnecessary re-renders
  const navItems = useMemo(() => [
    { 
      id: "tasks",
      to: "/tasks", 
      icon: CheckSquare, 
      titleKey: "tasks", 
      dataHook: () => ({ data: tasksData, isLoading: loadingStates.tasksData, error: null }), 
      processData: (data: any) => Array.isArray(data) ? data.filter((t: any) => !t.isCompleted).length ?? 0 : 0, 
      isNotification: true,
      unit: "available"
    },
    { 
      id: "slots",
      to: "/slots", 
      icon: Server, 
      titleKey: "slots", 
      dataHook: () => ({ data: slotsData, isLoading: loadingStates.slotsData, error: null }), 
      processData: (data: any) => Array.isArray(data) ? data.filter((s: any) => s.isActive).length ?? 0 : 0, 
      unit: "slots.active",
      isNotification: false
    },
    { id: "boosters", to: "/boosters", icon: Zap, titleKey: "boosters", processData: () => 0, unit: "", isNotification: false },
    { 
      id: "lottery",
      to: "/lottery", 
      icon: Ticket, 
      titleKey: "lottery.title", 
      dataHook: () => ({ data: lotteryData, isLoading: loadingStates.lotteryData, error: null }), 
      processData: (data: any) => data?.jackpot?.toFixed(4), 
      unit: "CFM",
      isNotification: false
    },
    { id: "leaderboard", to: "/leaderboard", icon: Trophy, titleKey: "leaderboard", processData: () => 0, unit: "", isNotification: false },
    { 
      id: "bonuses",
      to: "/bonuses", 
      icon: Gift, 
      titleKey: "bonuses",
      dataHook: () => ({ data: bonusesData, isLoading: loadingStates.bonusesData, error: null }),
      processData: (data: any) => data?.claimableCount ?? 0,
      isNotification: true,
      unit: ""
    },
    { 
      id: "achievements",
      to: "/achievements", 
      icon: Award, 
      titleKey: "achievements", 
      dataHook: () => ({ data: achievementsData, isLoading: loadingStates.achievementsData, error: null }), 
      processData: (data: any) => Array.isArray(data) ? data.filter((a: any) => a.isCompleted && !a.isClaimed).length ?? 0 : 0, 
      isNotification: true,
      unit: "available"
    },
  ], [tasksData, slotsData, lotteryData, bonusesData, achievementsData, loadingStates]);

  // Unified Fast & Complete Dashboard View
  return (
    <>
      <motion.div 
        className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Design System Container */}
        <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section - Perfectly Centered */}
          <motion.header 
            className="flex items-center justify-between py-6 mb-8"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <HomePageHeader user={user} />
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <TouchButton
                onClick={() => window.location.href = '/swap'}
                className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl border border-blue-500/20"
              >
                <ArrowRightLeft className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-medium">Swap CFM</span>
                <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </TouchButton>
            </motion.div>
          </motion.header>

          {/* Main Content Grid - Perfectly Symmetric */}
          <div className="space-y-8">
            
            {/* Top Section - Analytics Cards */}
            <motion.section 
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {/* Price Chart Card */}
              <motion.div 
                className="relative group"
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <RealTimePriceChart />
                <motion.button
                  onClick={() => setIsExchangeModalOpen(true)}
                  className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-sm border border-blue-200/50 dark:border-blue-700/50"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  View Rate
                </motion.button>
              </motion.div>

              {/* Performance Dashboard Card */}
              <motion.div
                whileHover={{ y: -2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <ProfessionalDashboard
                  userData={{
                    balance: realTimeUserData?.balance || 0,
                    totalInvested: realTimeUserData?.totalInvested || 0,
                    totalEarnings: realTimeUserData?.accruedEarnings || 0,
                    activeSlots: realTimeUserData?.miningSlots?.filter((slot: any) => slot.isActive).length || 0,
                    referrals: realTimeUserData?.referralCount || 0,
                    rank: realTimeUserData?.rank || 'Bronze'
                  }}
                  marketData={{
                    dailyChange: marketData?.dailyChange || 0,
                    weeklyChange: marketData?.weeklyChange || 0,
                    monthlyChange: marketData?.monthlyChange || 0,
                    totalUsers: marketData?.totalUsers || 0,
                    totalVolume: marketData?.totalVolume || 0
                  }}
                  displayEarnings={realTimeUserData?.accruedEarnings || 0}
                  isLoading={loadingStates.userData || loadingStates.marketData}
                />
              </motion.div>
            </motion.section>

            {/* Main Dashboard Card - Centered and Prominent */}
            <motion.section
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex justify-center"
            >
              <div className="w-full max-w-4xl">
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

            {/* Interactive Dashboard Sections - Perfectly Balanced */}
            <motion.section
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Quick Access Panel */}
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                          <CheckSquare className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Quick Access</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        {navItems.map((item, index) => (
                          <motion.div
                            key={item.to}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="group"
                          >
                            <TouchButton
                              onClick={() => window.location.href = item.to}
                              className="w-full h-24 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl hover:from-blue-50 hover:to-indigo-50 dark:hover:from-blue-900/20 dark:hover:to-indigo-900/20 transition-all duration-300 border border-gray-200/50 dark:border-gray-600/50 hover:border-blue-300/50 dark:hover:border-blue-600/50"
                            >
                              <div className="flex flex-col items-center justify-center h-full">
                                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg mb-2 group-hover:scale-110 transition-transform duration-300">
                                  <item.icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                                  {t(item.titleKey)}
                                </span>
                              </div>
                            </TouchButton>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Stats Panel */}
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                    <div className="p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                          <Server className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Statistics</h3>
                      </div>
                      <div className="space-y-4">
                        {[
                          { label: 'Mining Power', value: `${((classicUserData?.miningPower ?? 0) * 100).toFixed(1)}%`, color: 'blue', icon: Zap },
                          { label: 'Active Slots', value: `${slotsData?.filter((s: any) => s.isActive).length || 0}`, color: 'green', icon: Server },
                          { label: 'Referrals', value: `${classicUserData?.referralCount || 0}`, color: 'purple', icon: Trophy },
                          { label: 'Total Invested', value: `${classicUserData?.totalInvested?.toFixed(2) || '0'} CFM`, color: 'orange', icon: Gift }
                        ].map((stat, index) => (
                          <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 + index * 0.1 }}
                            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-lg`}>
                                <stat.icon className={`w-4 h-4 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{stat.label}</span>
                            </div>
                            <span className={`font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}>
                              {stat.value}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </motion.section>

            {/* Activity Feed - Full Width */}
            <motion.section
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
                      <CheckSquare className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { icon: '💰', text: 'Earnings updated', time: '2 min ago', color: 'green' },
                      { icon: '⛏️', text: 'Mining slot active', time: '5 min ago', color: 'blue' },
                      { icon: '🎁', text: 'Referral bonus earned', time: '1 hour ago', color: 'purple' },
                      { icon: '✅', text: 'Investment completed', time: '3 hours ago', color: 'orange' }
                    ].map((activity, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 + index * 0.1 }}
                        className="flex items-center gap-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl hover:shadow-md transition-all duration-300"
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
                </div>
              </Card>
            </motion.section>
        </div>
      </div>
      <Earth />
      
      {/* Cache Stats - Only show in development */}
      <CacheStats isVisible={import.meta.env.DEV} />
      </motion.div>

      {/* Exchange Rate Modal */}
      <ExchangeRateModal 
        isOpen={isExchangeModalOpen} 
        onClose={() => setIsExchangeModalOpen(false)} 
      />


    </>
  );
};

const Index = () => {
  return (
    <AuthWrapper>
      {(user) => <IndexContent user={user} />}
    </AuthWrapper>
  );
};

export default Index;