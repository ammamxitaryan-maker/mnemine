"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserData } from '@/hooks/useUserData';
import { useClaimEarnings } from '@/hooks/useClaimEarnings';
import { useTasksData } from '@/hooks/useTasksData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useAchievements } from '@/hooks/useAchievements';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useBonusesSummary } from '@/hooks/useBonusesSummary';
import { useLocalEarningsCache } from '@/hooks/useLocalEarningsCache';

import { AuthWrapper } from '@/components/AuthWrapper';
import { FlippableCard } from '@/components/FlippableCard';
import { MainCardFront } from '@/components/MainCardFront';
import { MainCardBack } from '@/components/MainCardBack';
import { HomePageHeader } from '@/components/HomePageHeader';
import { DashboardLinkCard } from '@/components/DashboardLinkCard';
import { SwapCard } from '@/components/SwapCard';
import { AuthenticatedUser } from '@/types/telegram';
import { showError } from '@/utils/toast';
import { Link } from 'react-router-dom';

import { Server, Trophy, Gift, CheckSquare, Award, Ticket, Loader2, Settings, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
  const { t } = useTranslation();
  
  // Data fetching hooks - all called at top level for consistency
  const { data: userData, isLoading: userDataLoading, error: userDataError } = useUserData(user.telegramId);
  const { data: slotsData, isLoading: slotsLoading } = useSlotsData(user.telegramId);
  const { claim: originalClaim, isClaiming } = useClaimEarnings();
  const tasksDataResult = useTasksData(user.telegramId);
  // Note: slotsData already fetched above, no need to call useSlotsData again
  const lotteryDataResult = useLotteryData();
  const bonusesSummaryResult = useBonusesSummary();
  const achievementsResult = useAchievements();

  // Local earnings cache with animation - optimized for performance
  const { 
    localEarnings: displayEarnings, 
    isAnimating,
    forceSync 
  } = useLocalEarningsCache({
    serverEarnings: userData?.accruedEarnings || 0,
    serverSlotsData: slotsData || [],
    syncInterval: 60000, // 60 seconds - reduced frequency for better performance
    animationInterval: 200 // 200ms - reduced animation frequency
  });

  // Memoized loading state
  const overallLoading = useMemo(() => 
    userDataLoading || 
    slotsLoading || 
    tasksDataResult.isLoading || 
    lotteryDataResult.isLoading || 
    bonusesSummaryResult.isLoading || 
    achievementsResult.isLoading,
    [userDataLoading, slotsLoading, tasksDataResult.isLoading, lotteryDataResult.isLoading, bonusesSummaryResult.isLoading, achievementsResult.isLoading]
  );

  // Optimized claim function with useCallback
  const claim = useCallback(() => {
    if (userData && userData.balance < 3) {
      showError(t('claim.minBalanceError'));
      return;
    }
    originalClaim();
  }, [userData, t, originalClaim]);

  // Memoized active slots calculation
  const activeSlots = useMemo(() => {
    if (!slotsData) return [];
    return slotsData.filter(slot => slot.isActive && new Date(slot.expiresAt) > new Date());
  }, [slotsData]);

  // REMOVED: Old earnings calculation - now handled by useLocalEarningsCache

  // Memoized navigation data calculations - moved before early returns
  const navigationData = useMemo(() => {
    const tasksCount = Array.isArray(tasksDataResult.data) ? tasksDataResult.data.filter((t: { isCompleted: boolean }) => !t.isCompleted).length : 0;
    const slotsCount = Array.isArray(slotsData) ? slotsData.filter((s: { isActive: boolean }) => s.isActive).length : 0;
    const lotteryJackpot = lotteryDataResult.lottery?.jackpot?.toFixed(4);
    const bonusesCount = bonusesSummaryResult.data?.claimableCount ?? 0;
    const achievementsCount = Array.isArray(achievementsResult.achievements) ? achievementsResult.achievements.filter((a: { isCompleted: boolean; isClaimed: boolean }) => a.isCompleted && !a.isClaimed).length : 0;

    return {
      tasksCount,
      slotsCount,
      lotteryJackpot,
      bonusesCount,
      achievementsCount
    };
  }, [tasksDataResult.data, slotsData, lotteryDataResult.lottery?.jackpot, bonusesSummaryResult.data?.claimableCount, achievementsResult.achievements]);

  // Check if user is admin
  const ADMIN_TELEGRAM_IDS = import.meta.env.VITE_ADMIN_TELEGRAM_IDS 
    ? import.meta.env.VITE_ADMIN_TELEGRAM_IDS.split(',').map((id: string) => id.trim())
    : ['6760298907'];
  
  const isAdmin = user && ADMIN_TELEGRAM_IDS.includes(user.telegramId);

  // Memoized navigation items - moved before early returns
  const navItems = useMemo(() => {
    const baseItems = [
      { 
        to: "/tasks", 
        icon: CheckSquare, 
        titleKey: "tasks", 
        data: navigationData.tasksCount,
        isLoading: tasksDataResult.isLoading,
        error: tasksDataResult.error,
        isNotification: true,
        unit: "available"
      },
      { 
        to: "/slots", 
        icon: Server, 
        titleKey: "slots", 
        data: navigationData.slotsCount,
        isLoading: slotsLoading,
        error: undefined,
        unit: "slots.active"
      },
      { 
        to: "/lottery", 
        icon: Ticket, 
        titleKey: "lottery.title", 
        data: navigationData.lotteryJackpot,
        isLoading: lotteryDataResult.isLoading,
        error: lotteryDataResult.error,
        unit: "USD"
      },
      { 
        to: "/leaderboard", 
        icon: Trophy, 
        titleKey: "leaderboard" 
      },
      { 
        to: "/bonuses", 
        icon: Gift, 
        titleKey: "bonuses",
        data: navigationData.bonusesCount,
        isLoading: bonusesSummaryResult.isLoading,
        error: bonusesSummaryResult.error,
        isNotification: true
      },
      { 
        to: "/achievements", 
        icon: Award, 
        titleKey: "achievements", 
        data: navigationData.achievementsCount,
        isLoading: achievementsResult.isLoading,
        error: achievementsResult.error,
        isNotification: true,
        unit: "available"
      }
    ];

    // Only add admin panel link if user is admin
    if (isAdmin) {
      baseItems.push({
        to: "/admin",
        icon: Settings,
        titleKey: "admin.panel",
        data: 0,
        isLoading: false,
        error: undefined,
        unit: "panel"
      });
    }

    return baseItems;
  }, [navigationData, tasksDataResult.isLoading, tasksDataResult.error, slotsLoading, lotteryDataResult.isLoading, lotteryDataResult.error, bonusesSummaryResult.isLoading, bonusesSummaryResult.error, achievementsResult.isLoading, achievementsResult.error, isAdmin]);

  // REMOVED: Old dynamic earnings effect - now handled by useLocalEarningsCache

  if (userDataError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <p className="text-red-500 text-center">{userDataError.toString()}</p>
      </div>
    );
  }

  // �����, ���� �� ����������� � ������ ������������ ��������, ���������� �������
  if (overallLoading || !userData) { // ���� ��������� ������� userData
    return (
      <div className="flex justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-200 to-slate-800 relative">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-400/9
      80 via-purple-900/60 to-slate-900/55 backdrop-blur-sm pointer-events-none" />
      
      {/* Main Content Container - Fully Responsive with Better Spacing */}
      <div className="relative w-full max-w-7xl mx-auto px-2 py-1 sm:px-1 lg:px-1 z-2">
        <div className="space-y-6 sm:space-y-10">
          {/* Header Section */}
          <header className="relative">
            <HomePageHeader user={user} />
          </header>
          
          {/* Main Content - Responsive Grid Layout */}
          <main className="space-y-10 sm:space-y-4">
            {/* Primary Dashboard Section */}
            <section className="max-w-2xl mx-auto mb-28">
              <FlippableCard
                id="main-card"
                frontContent={
                  <MainCardFront
                    userData={userData}
                    slotsData={slotsData}
                    displayEarnings={displayEarnings}
                    onClaim={claim}
                    isClaiming={isClaiming}
                  />
                }
                backContent={<MainCardBack user={user} slots={slotsData} isLoading={slotsLoading} />}
                enableAccordion={true}
                accordionContent={
                  <div className="space-y-4">
                    {/* Mining Statistics */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/30 border border-cyan-700/60 rounded-lg p-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-medium text-cyan-300">Mining Power</span>
                        </div>
                        <p className="text-lg font-bold text-cyan-400 text-center">{((userData?.miningPower ?? 0) * 100).toFixed(2)}%</p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-800/30 border border-emerald-700/60 rounded-lg p-3">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Server className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-medium text-emerald-300">Active Slots</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-400 text-center">
                          {slotsData?.filter(s => s.isActive && new Date(s.expiresAt) > new Date()).length || 0}
                        </p>
                      </div>
                    </div>

                    {/* Daily Earnings Breakdown */}
                    {activeSlots.length > 0 && (
                      <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/30 border border-purple-700/60 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-purple-300 mb-3 flex items-center gap-2">
                          <BarChart3 className="w-4 h-4" />
                          Daily Earnings Breakdown
                        </h4>
                        <div className="space-y-2">
                          {activeSlots.slice(0, 3).map((slot, index) => {
                            const dailyRate = slot.effectiveWeeklyRate / 7;
                            const dailyEarnings = slot.principal * dailyRate;
                            return (
                              <div key={slot.id || index} className="flex justify-between items-center text-sm">
                                <span className="text-gray-300">Slot {index + 1}:</span>
                                <span className="font-mono text-emerald-400">{dailyEarnings.toFixed(6)} USD</span>
                              </div>
                            );
                          })}
                          {activeSlots.length > 3 && (
                            <div className="text-xs text-gray-400 text-center pt-2">
                              +{activeSlots.length - 3} more slots...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link to="/slots" className="block">
                        <button className="w-full bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-500/90 hover:to-blue-400/90 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2">
                          <Server className="w-4 h-4" />
                          Manage Slots
                        </button>
                      </Link>
                      <Link to="/tasks" className="block">
                        <button className="w-full bg-gradient-to-r from-green-600/80 to-green-500/80 hover:from-green-500/90 hover:to-green-400/90 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2">
                          <CheckSquare className="w-4 h-4" />
                          Tasks
                        </button>
                      </Link>
                    </div>
                  </div>
                }
                showFlipIndicator={true}
              />
            </section>

            {/* Secondary Features Section */}
            <section className="w-full max-w-2xl mx-auto mt-8 sm:mt-2">
              <SwapCard
                telegramId={user.telegramId}
                USDBalance={userData?.balance || 0}
              />
            </section>

            {/* Navigation Grid Section */}
            <section className="w-full max-w-2xl mx-auto px-3 sm:px-2">
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-3 lg:gap-3">
                {navItems.map((item) => (
                  <div key={item.to} className="h28 sm:h-28 lg:h-28">
                    <DashboardLinkCard
                      to={item.to}
                      icon={item.icon}
                      title={t(item.titleKey)}
                      displayData={item.data}
                      isLoading={item.isLoading}
                      error={item.error}
                      unit={item.unit ? t(item.unit) : undefined}
                      isNotification={item.isNotification}
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom Spacing for Mobile Navigation - Reduced */}
            <div className="h-1 sm:h-4" />
          </main>
        </div>
      </div>
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
