"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useClaimEarnings } from '@/hooks/useClaimEarnings';
import { useReinvest } from '@/hooks/useReinvest';
import { useOptimizedDashboard, useBackgroundSync } from '@/hooks/useOptimizedData';

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

import { Zap, Server, Trophy, Gift, CheckSquare, Award, Ticket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button for Pro View
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    refetchAll,
    loadingStates
  } = useOptimizedDashboard(user.telegramId);

  // Enable background sync
  useBackgroundSync(user.telegramId);

  const { claim, isClaiming } = useClaimEarnings();
  const { reinvest, isReinvesting } = useReinvest();

  const [viewMode, setViewMode] = useState<'classic' | 'professional'>('classic'); // Default to classic

  // For professional view, use the same data but with different presentation
  const realTimeUserData = classicUserData;
  const realTimeMarketData = marketData;


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

  const navItems = [
    { 
      to: "/tasks", 
      icon: CheckSquare, 
      titleKey: "tasks", 
      dataHook: () => ({ data: tasksData, isLoading: loadingStates.tasksData, error: null }), 
      processData: (data: any) => Array.isArray(data) ? data.filter((t: any) => !t.isCompleted).length ?? 0 : 0, 
      isNotification: true,
      unit: "available"
    },
    { 
      to: "/slots", 
      icon: Server, 
      titleKey: "slots", 
      dataHook: () => ({ data: slotsData, isLoading: loadingStates.slotsData, error: null }), 
      processData: (data: any) => Array.isArray(data) ? data.filter((s: any) => s.isActive).length ?? 0 : 0, 
      unit: "slots.active" 
    },
    { to: "/boosters", icon: Zap, titleKey: "boosters" },
    { 
      to: "/lottery", 
      icon: Ticket, 
      titleKey: "lottery.title", 
      dataHook: () => ({ data: lotteryData, isLoading: loadingStates.lotteryData, error: null }), 
      processData: (data: any) => data?.jackpot?.toFixed(4), 
      unit: "CFM"
    },
    { to: "/leaderboard", icon: Trophy, titleKey: "leaderboard" },
    { 
      to: "/bonuses", 
      icon: Gift, 
      titleKey: "bonuses",
      dataHook: () => ({ data: bonusesData, isLoading: loadingStates.bonusesData, error: null }),
      processData: (data: any) => data?.claimableCount ?? 0,
      isNotification: true
    },
    { 
      to: "/achievements", 
      icon: Award, 
      titleKey: "achievements", 
      dataHook: () => ({ data: achievementsData, isLoading: loadingStates.achievementsData, error: null }), 
      processData: (data: any) => Array.isArray(data) ? data.filter((a: any) => a.isCompleted && !a.isClaimed).length ?? 0 : 0, 
      isNotification: true,
      unit: "available"
    },
  ];

  // Professional Dashboard View
  if (viewMode === 'professional') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {user.firstName}!
              </h1>
            </div>
            <Button
              onClick={() => setViewMode('classic')}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Classic View
            </Button>
          </div>
          
          <ProfessionalDashboard
            userData={{
              balance: realTimeUserData.balance,
              totalInvested: realTimeUserData.totalInvested,
              totalEarnings: realTimeUserData.accruedEarnings, // Use real-time accrued earnings
              activeSlots: realTimeUserData.miningSlots?.filter(slot => slot.isActive).length || 0,
              referrals: realTimeUserData.referralCount || 0,
              rank: realTimeUserData.rank || 'Bronze'
            }}
            marketData={{
              dailyChange: marketData.dailyChange,
              weeklyChange: marketData.weeklyChange,
              monthlyChange: marketData.monthlyChange,
              totalUsers: marketData.totalUsers,
              totalVolume: marketData.totalVolume
            }}
            displayEarnings={realTimeUserData.accruedEarnings} // Pass real-time accrued earnings
            isLoading={loadingStates.userData || loadingStates.marketData}
          />

          {/* Exchange Rate Chart */}
          <div className="mt-6">
            <ExchangeRateChart />
          </div>
        </div>
      </div>
    );
  }

  // Enhanced Classic View with better content visibility
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-6xl mx-auto p-2 sm:p-4">
        {/* Header Section - Mobile Optimized */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <HomePageHeader user={user} />
          <Button
            onClick={() => setViewMode('professional')}
            className="px-2 py-1 sm:px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">Pro View</span>
            <span className="sm:hidden">Pro</span>
          </Button>
        </div>

        {/* Main Content Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
          
          {/* Left Column - Main Card */}
          <div className="lg:col-span-1">
            <div className="h-[250px] sm:h-[300px] mb-4 sm:mb-6">
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

            {/* Quick Stats Card - Mobile Optimized */}
            <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mining Power</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {((classicUserData?.miningPower ?? 0) * 100).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Slots</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {slotsData?.filter(s => s.isActive).length || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Referrals</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {classicUserData?.referralCount || 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Navigation and Content */}
          <div className="lg:col-span-2">
            {/* Navigation Grid - Mobile Optimized */}
            <Card className="mb-4 sm:mb-6 bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Quick Access</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {navItems.map((item) => (
                    <div key={item.to} className="h-20 sm:h-24">
                      <DashboardLinkCard
                        to={item.to}
                        icon={item.icon}
                        title={t(item.titleKey)}
                        dataHook={item.dataHook as any}
                        processData={item.processData}
                        unit={item.isNotification && item.processData && item.processData({} as any) > 0 ? t(item.unit!) : undefined}
                        isNotification={item.isNotification}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Content Section - Always Visible */}
            <div className="space-y-4 sm:space-y-6">
              {/* Market Overview - Mobile Optimized */}
              <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                    <div className="text-center p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {marketData?.totalUsers?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Users</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                        {marketData?.dailyChange > 0 ? '+' : ''}{marketData?.dailyChange?.toFixed(2) || '0'}%
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">24h Change</div>
                    </div>
                    <div className="text-center p-3 sm:p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                        ${(marketData?.totalVolume / 1000000)?.toFixed(1) || '0'}M
                      </div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Volume</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Exchange Rate Chart - Mobile Optimized */}
              <Card className="bg-white/90 backdrop-blur-sm border-blue-200 dark:bg-gray-800/90 dark:border-gray-600">
                <CardHeader className="pb-2 sm:pb-3">
                  <CardTitle className="text-base sm:text-lg text-gray-800 dark:text-white">Exchange Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <ExchangeRateChart />
                </CardContent>
              </Card>

              {/* Recent Activity - Mobile Optimized */}
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
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Earth />
      
      {/* Cache Stats - Only show in development */}
      <CacheStats isVisible={import.meta.env.DEV} />
    </div>
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