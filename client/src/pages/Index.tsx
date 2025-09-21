"use client";

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserData } from '@/hooks/useUserData'; // Still needed for classic view, but useRealTimeUserData for professional
import { useClaimEarnings } from '@/hooks/useClaimEarnings';
import { useReinvest } from '@/hooks/useReinvest';
import { useTasksData } from '@/hooks/useTasksData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useAchievements } from '@/hooks/useAchievements';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useBonusesSummary } from '@/hooks/useBonusesSummary';
import { useRealTimeUserData, useRealTimeMarketData } from '@/hooks/useRealTimeData'; // Import real-time hooks

import { AuthWrapper } from '@/components/AuthWrapper';
import { FlippableCard } from '@/components/FlippableCard';
import { MainCardFront } from '@/components/MainCardFront';
import { MainCardBack } from '@/components/MainCardBack';
import { HomePageHeader } from '@/components/HomePageHeader';
import { DashboardLinkCard } from '@/components/DashboardLinkCard';
import { ProfessionalDashboard } from '@/components/ProfessionalDashboard';
import { ExchangeRateChart } from '@/components/ExchangeRateChart';
import Earth from '@/components/Earth';
import { GreetingOverlay } from '@/components/GreetingOverlay';
import { AuthenticatedUser } from '@/types/telegram';

import { Zap, Server, Trophy, Gift, CheckSquare, Award, Ticket, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button'; // Import Button for Pro View

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
  const { t } = useTranslation();
  
  // Data for Classic View
  const { data: classicUserData, isLoading: classicUserDataLoading, error: classicUserDataError } = useUserData(user.telegramId);
  const { data: slotsData, isLoading: slotsLoading } = useSlotsData(user.telegramId);

  // Data for Professional View (real-time)
  const { userData: realTimeUserData, isLoading: realTimeUserDataLoading, error: realTimeUserDataError } = useRealTimeUserData(user.telegramId);
  const { marketData, isLoading: realTimeMarketDataLoading, error: realTimeMarketDataError } = useRealTimeMarketData();

  const { claim, isClaiming } = useClaimEarnings();
  const { reinvest, isReinvesting } = useReinvest();

  // Data hooks for DashboardLinkCards
  const { isLoading: tasksLoading } = useTasksData(user.telegramId);
  const { isLoading: lotteryLoading } = useLotteryData();
  const { isLoading: bonusesSummaryLoading } = useBonusesSummary();
  const { isLoading: achievementsLoading } = useAchievements();

  const [showGreetingOverlay, setShowGreetingOverlay] = useState(true);
  const [viewMode, setViewMode] = useState<'classic' | 'professional'>('classic'); // Default to classic

  // Combine all loading states
  const overallLoading = classicUserDataLoading || slotsLoading || tasksLoading || lotteryLoading || bonusesSummaryLoading || achievementsLoading || realTimeUserDataLoading || realTimeMarketDataLoading;
  const anyError = classicUserDataError || realTimeUserDataError || realTimeMarketDataError;

  // Effect to show greeting only once when component mounts
  useEffect(() => {
    const hasShownGreeting = sessionStorage.getItem('greetingShown');
    if (hasShownGreeting) {
      setShowGreetingOverlay(false);
    }
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

  // Show greeting overlay if enabled and user data is loaded
  if (showGreetingOverlay && classicUserData) {
    return (
      <GreetingOverlay 
        user={user} 
        onFadeOutComplete={() => {
          setShowGreetingOverlay(false);
          sessionStorage.setItem('greetingShown', 'true');
        }} 
      />
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
      dataHook: () => useTasksData(user.telegramId), 
      processData: (data: any) => Array.isArray(data) ? data.filter((t: any) => !t.isCompleted).length ?? 0 : 0, 
      isNotification: true,
      unit: "available"
    },
    { to: "/slots", icon: Server, titleKey: "slots", dataHook: () => useSlotsData(user.telegramId), processData: (data: any) => Array.isArray(data) ? data.filter((s: any) => s.isActive).length ?? 0 : 0, unit: "slots.active" },
    { to: "/boosters", icon: Zap, titleKey: "boosters" },
    { 
      to: "/lottery", 
      icon: Ticket, 
      titleKey: "lottery.title", 
      dataHook: () => {
        const { lottery, isLoading, error } = useLotteryData();
        return { data: lottery, isLoading, error };
      }, 
      processData: (data: any) => data?.jackpot?.toFixed(4), 
      unit: "CFM"
    },
    { to: "/leaderboard", icon: Trophy, titleKey: "leaderboard" },
    { 
      to: "/bonuses", 
      icon: Gift, 
      titleKey: "bonuses",
      dataHook: useBonusesSummary,
      processData: (data: any) => data?.claimableCount ?? 0,
      isNotification: true
    },
    { 
      to: "/achievements", 
      icon: Award, 
      titleKey: "achievements", 
      dataHook: () => {
        const { achievements, isLoading, error } = useAchievements();
        return { data: achievements, isLoading, error };
      }, 
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
            isLoading={realTimeUserDataLoading || realTimeMarketDataLoading}
          />

          {/* Exchange Rate Chart */}
          <div className="mt-6">
            <ExchangeRateChart />
          </div>
        </div>
      </div>
    );
  }

  // Classic View
  return (
    <div className="flex flex-col min-h-screen text-gray-800 p-4">
      <div className="w-full max-w-md mx-auto z-10">
        <div className="flex items-center justify-between mb-4">
          <HomePageHeader user={user} />
          <Button
            onClick={() => setViewMode('professional')}
            className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Pro View
          </Button>
        </div>
        <main className="flex flex-col items-center gap-4 w-full px-2 sm:px-4">
          
          <section className="w-full h-[250px] sm:h-[280px]">
            <FlippableCard
              id="main-card"
              frontContent={
                <MainCardFront 
                  userData={classicUserData} 
                  slotsData={slotsData}
                  displayEarnings={classicUserData?.accruedEarnings ?? 0} // Use classicUserData's accrued earnings
                  onClaim={claim}
                  isClaiming={isClaiming}
                  onReinvest={reinvest}
                  isReinvesting={isReinvesting}
                />
              }
              backContent={<MainCardBack user={user} slots={slotsData} isLoading={slotsLoading} />}
            />
          </section>

          <section className="w-full">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full">
              {navItems.map((item) => (
                <div key={item.to} className="h-28">
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
          </section>
        </main>
      </div>
      <Earth />
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