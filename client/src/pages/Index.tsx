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

import { AuthWrapper } from '@/components/AuthWrapper';
import { FlippableCard } from '@/components/FlippableCard';
import { MainCardFront } from '@/components/MainCardFront';
import { MainCardBack } from '@/components/MainCardBack';
import { HomePageHeader } from '@/components/HomePageHeader';
import { DashboardLinkCard } from '@/components/DashboardLinkCard';
import { SwapCard } from '@/components/SwapCard';
import { AuthenticatedUser } from '@/types/telegram';
import { showError } from '@/utils/toast';

import { Server, Trophy, Gift, CheckSquare, Award, Ticket, Loader2, Settings } from 'lucide-react';
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

  // Local state
  const [displayEarnings, setDisplayEarnings] = useState(0);

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

  // Memoized earnings calculation
  const earningsPerSecond = useMemo(() => {
    if (!userData || activeSlots.length === 0) return 0;
    return activeSlots.reduce((total, slot) => {
      const earningsPerSecondForSlot = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
      return total + earningsPerSecondForSlot;
    }, 0) * 10; // Aggressive multiplier for visual effect
  }, [userData, activeSlots]);

  // Initialize display earnings when userData changes
  useEffect(() => {
    if (userData) {
      setDisplayEarnings(userData.accruedEarnings);
    }
  }, [userData, userData?.accruedEarnings]);

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
        isNotification: false
      });
    }

    return baseItems;
  }, [navigationData, tasksDataResult.isLoading, tasksDataResult.error, slotsLoading, lotteryDataResult.isLoading, lotteryDataResult.error, bonusesSummaryResult.isLoading, bonusesSummaryResult.error, achievementsResult.isLoading, achievementsResult.error, isAdmin]);

  // Dynamic earnings update effect
  useEffect(() => {
    if (earningsPerSecond === 0) return;

    const interval = setInterval(() => {
      setDisplayEarnings(prev => prev + earningsPerSecond);
    }, 100);

    return () => clearInterval(interval);
  }, [earningsPerSecond]);

  if (userDataError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <p className="text-red-500 text-center">{userDataError.toString()}</p>
      </div>
    );
  }

  // Затем, если не загружается и данные пользователя доступны, отображаем контент
  if (overallLoading || !userData) { // Явно проверяем наличие userData
    return (
      <div className="flex justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-purple-900/90 to-slate-900/95 backdrop-blur-sm pointer-events-none" />
      
      {/* Main Content Container - Fully Responsive */}
      <div className="relative w-full max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 z-10">
        <div className="space-y-8">
          {/* Header Section */}
          <header className="relative">
            <HomePageHeader user={user} />
          </header>
          
          {/* Main Content - Responsive Grid Layout */}
          <main className="space-y-8">
            {/* Primary Dashboard Section */}
            <section className="w-full max-w-4xl mx-auto">
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
                enableAccordion={false}
                showFlipIndicator={true}
              />
            </section>

            {/* Secondary Features Section */}
            <section className="w-full max-w-4xl mx-auto">
              <SwapCard
                telegramId={user.telegramId}
                USDBalance={userData?.balance || 0}
              />
            </section>

            {/* Navigation Grid Section */}
            <section className="w-full max-w-4xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                {navItems.map((item) => (
                  <div key={item.to} className="h-24 sm:h-28">
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

            {/* Bottom Spacing for Mobile Navigation */}
            <div className="h-32 sm:h-36" />
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
