"use client";

import { useMemo, useState, useCallback } from 'react';
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
import { DashboardLinkCard } from '@/components/DashboardLinkCard';
import { ProfessionalDashboard } from '@/components/ProfessionalDashboard';
import { ExchangeRateChart } from '@/components/ExchangeRateChart';
import Earth from '@/components/Earth';
import { CacheStats } from '@/components/CacheStats';
import { AuthenticatedUser } from '@/types/telegram';

import { Zap, Server, Trophy, Gift, CheckSquare, Award, Ticket, Loader2, ArrowLeft, Menu } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FullscreenSection, MobileContainer, TouchButton } from '@/components/FullscreenSection';

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
  const { t } = useTranslation();
  
  // State for fullscreen sections
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
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

  // Section management functions
  const openSection = useCallback((sectionId: string) => {
    setActiveSection(sectionId);
  }, []);

  const closeSection = useCallback(() => {
    setActiveSection(null);
  }, []);

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
        className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-full max-w-7xl mx-auto p-2 sm:p-4">
          {/* Header Section */}
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <HomePageHeader user={user} />
            <TouchButton
              onClick={() => openSection('menu')}
              className="md:hidden p-2 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg"
            >
              <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </TouchButton>
          </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
          
          {/* Left Column - Main Card & Stats */}
          <div className="xl:col-span-1 space-y-4">
            {/* Main Card */}
            <div className="h-[280px] sm:h-[320px]">
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

            {/* Quick Stats */}
            <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mining Power</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {((classicUserData?.miningPower ?? 0) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Slots</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {slotsData?.filter((s: any) => s.isActive).length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Referrals</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {classicUserData?.referralCount || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Invested</span>
                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                    {classicUserData?.totalInvested?.toFixed(4) || '0'} CFM
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Market Overview */}
            <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Market Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                    {marketData?.totalUsers?.toLocaleString() || '0'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Users</div>
                </div>
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">
                    {marketData?.dailyChange > 0 ? '+' : ''}{marketData?.dailyChange?.toFixed(2) || '0'}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">24h Change</div>
                </div>
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    ${(marketData?.totalVolume / 1000000)?.toFixed(1) || '0'}M
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Volume</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Navigation and Charts */}
          <div className="xl:col-span-3 space-y-4 sm:space-y-6">
            {/* Navigation Grid */}
            <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {navItems.map((item) => (
                    <motion.div 
                      key={item.to} 
                      className="h-20 sm:h-24"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.1 }}
                    >
                      <TouchButton
                        onClick={() => openSection(item.id)}
                        className="w-full h-full"
                      >
                        <DashboardLinkCard
                          to={item.to}
                          icon={item.icon}
                          title={t(item.titleKey)}
                          dataHook={item.dataHook as any}
                          processData={item.processData || (() => 0)}
                          unit={item.isNotification && item.processData && item.processData({} as any) > 0 ? t(item.unit || '') : ''}
                          isNotification={item.isNotification}
                        />
                      </TouchButton>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Exchange Rate Chart */}
              <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Exchange Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExchangeRateChart />
                </CardContent>
              </Card>

              {/* Professional Dashboard */}
              <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Performance</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40 sm:h-48">
                  <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Earnings updated</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">2 min ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Mining slot active</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">5 min ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Referral bonus earned</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">1 hour ago</span>
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Investment completed</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">3 hours ago</span>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Earth />
      
      {/* Cache Stats - Only show in development */}
      <CacheStats isVisible={import.meta.env.DEV} />
      </motion.div>

      {/* Fullscreen Sections */}
      <FullscreenSection
        isActive={activeSection === 'menu'}
        onSwipeDown={closeSection}
        className="flex items-center justify-center"
      >
        <MobileContainer>
          <div className="text-center">
            <TouchButton
              onClick={closeSection}
              className="mb-6 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </TouchButton>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-8">Quick Access</h2>
            <div className="grid grid-cols-2 gap-4">
              {navItems.map((item) => (
                <TouchButton
                  key={item.id}
                  onClick={() => {
                    closeSection();
                    openSection(item.id);
                  }}
                  className="p-4 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg"
                >
                  <item.icon className="w-8 h-8 mx-auto mb-2 text-blue-600 dark:text-blue-400" />
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t(item.titleKey)}
                  </div>
                </TouchButton>
              ))}
            </div>
          </div>
        </MobileContainer>
      </FullscreenSection>

      {/* Tasks Section */}
      <FullscreenSection
        isActive={activeSection === 'tasks'}
        onSwipeDown={closeSection}
      >
        <MobileContainer>
          <div className="flex items-center justify-between mb-6">
            <TouchButton
              onClick={closeSection}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </TouchButton>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Tasks</h2>
            <div></div>
          </div>
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
            <CardContent className="p-6">
              <div className="text-center">
                <CheckSquare className="w-16 h-16 mx-auto mb-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {t('tasks')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Complete tasks to earn rewards
                </p>
                <TouchButton
                  onClick={() => window.location.href = '/tasks'}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium"
                >
                  View All Tasks
                </TouchButton>
              </div>
            </CardContent>
          </Card>
        </MobileContainer>
      </FullscreenSection>

      {/* Slots Section */}
      <FullscreenSection
        isActive={activeSection === 'slots'}
        onSwipeDown={closeSection}
      >
        <MobileContainer>
          <div className="flex items-center justify-between mb-6">
            <TouchButton
              onClick={closeSection}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </TouchButton>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Mining Slots</h2>
            <div></div>
          </div>
          <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
            <CardContent className="p-6">
              <div className="text-center">
                <Server className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">
                  {t('slots')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Active slots: {slotsData?.filter((s: any) => s.isActive).length || 0}
                </p>
                <TouchButton
                  onClick={() => window.location.href = '/slots'}
                  className="w-full py-3 bg-green-600 text-white rounded-lg font-medium"
                >
                  Manage Slots
                </TouchButton>
              </div>
            </CardContent>
          </Card>
        </MobileContainer>
      </FullscreenSection>

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