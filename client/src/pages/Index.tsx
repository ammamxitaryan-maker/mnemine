"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserData } from '@/hooks/useUserData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useLocalEarningsCache } from '@/hooks/useLocalEarningsCache';
import { useWebSocketOptimized } from '@/hooks/useWebSocketOptimized';

import { AuthWrapper } from '@/components/AuthWrapper';
import { AuthenticatedUser } from '@/types/telegram';
import { showError } from '@/utils/toast';
import { Link } from 'react-router-dom';

import { Server, Trophy, Ticket, Loader2, Settings, TrendingUp, BarChart3 } from 'lucide-react';

// Import components directly to avoid dynamic import conflicts
import { FlippableCard } from '@/components/common/FlippableCard';
import { MainCardFront } from '@/components/common/MainCardFront';
import { MainCardBack } from '@/components/common/MainCardBack';
import { HomePageHeader } from '@/components/HomePageHeader';
import { DashboardLinkCard } from '@/components/common/DashboardLinkCard';
import { SwapCard } from '@/components/business/SwapCard';

// Constants moved outside component to avoid recreation
const ADMIN_TELEGRAM_IDS = import.meta.env.VITE_ADMIN_TELEGRAM_IDS 
  ? import.meta.env.VITE_ADMIN_TELEGRAM_IDS.split(',').map((id: string) => id.trim())
  : ['6760298907'];

const SECONDARY_DATA_DELAY = 100;
const SYNC_INTERVAL = 120000; // 2 minutes
const ANIMATION_INTERVAL = 500; // 500ms

const IndexContent = ({ user }: { user: AuthenticatedUser }) => {
  const { t } = useTranslation();
  
  // WebSocket connection for real-time updates
  const { isConnected, subscribe } = useWebSocketOptimized({
    url: process.env.VITE_WS_URL || 'ws://localhost:10113',
    telegramId: user.telegramId,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  });
  
  // Optimized data fetching - only fetch essential data initially
  const { data: userData, isLoading: userDataLoading, error: userDataError, refetch: refetchUserData } = useUserData(user.telegramId);
  const { data: slotsData, isLoading: slotsLoading, refetch: refetchSlotsData } = useSlotsData(user.telegramId);
  
  // Defer non-critical data fetching until after initial render
  const [shouldFetchSecondary, setShouldFetchSecondary] = useState(false);
  
  // Simplified secondary data fetching - single useEffect
  useEffect(() => {
    const timer = setTimeout(() => setShouldFetchSecondary(true), SECONDARY_DATA_DELAY);
    return () => clearTimeout(timer);
  }, []);

  // Memoized refetch functions to prevent unnecessary re-renders
  const handleRefetchUserData = useCallback(() => {
    refetchUserData();
  }, [refetchUserData]);

  const handleRefetchSlotsData = useCallback(() => {
    refetchSlotsData();
  }, [refetchSlotsData]);

  // WebSocket message handling for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe((message) => {
      console.log('📨 WebSocket message received on Index:', message);
      
      switch (message.type) {
        case 'BALANCE_UPDATE':
          console.log('💰 Balance updated on Index:', message.data);
          handleRefetchUserData();
          break;
        case 'SLOT_UPDATE':
          console.log('⛏️ Slot updated on Index:', message.data);
          handleRefetchUserData();
          handleRefetchSlotsData();
          break;
        case 'NOTIFICATION':
          console.log('🔔 New notification on Index:', message.data);
          break;
        default:
          console.log('📨 Unknown message type on Index:', message.type);
      }
    });

    return unsubscribe;
  }, [isConnected, subscribe, handleRefetchUserData, handleRefetchSlotsData]);

  // Conditional secondary data fetching
  const lotteryDataResult = useLotteryData();

  // Optimized local earnings cache with reduced frequency
  const { 
    localEarnings: displayEarnings, 
    isAnimating,
    forceSync 
  } = useLocalEarningsCache({
    serverEarnings: userData?.accruedEarnings || 0,
    serverSlotsData: slotsData || [],
    syncInterval: SYNC_INTERVAL,
    animationInterval: ANIMATION_INTERVAL
  });

  // Simplified loading state - only check critical data
  const isLoading = userDataLoading || slotsLoading;

  // Memoized active slots calculation with performance optimization
  const activeSlots = useMemo(() => {
    if (!slotsData || !Array.isArray(slotsData)) return [];
    
    const now = Date.now();
    return slotsData.filter(slot => {
      if (!slot.isActive) return false;
      // Cache date parsing for better performance
      const expiresAt = new Date(slot.expiresAt).getTime();
      return expiresAt > now;
    });
  }, [slotsData]);

  // Memoized admin check - simplified dependency
  const isAdmin = useMemo(() => {
    return user && ADMIN_TELEGRAM_IDS.includes(user.telegramId);
  }, [user?.telegramId]); // Only depend on telegramId, not entire user object

  // Optimized navigation data calculations with reduced dependencies
  const navigationData = useMemo(() => {
    const slotsCount = activeSlots.length;
    const lotteryJackpot = shouldFetchSecondary ? lotteryDataResult.lottery?.jackpot?.toFixed(4) : '0.0000';

    return {
      slotsCount,
      lotteryJackpot
    };
  }, [activeSlots.length, shouldFetchSecondary, lotteryDataResult.lottery?.jackpot]);

  // Memoized navigation items with optimized dependencies
  const navItems = useMemo(() => {
    const baseItems = [
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
        isLoading: shouldFetchSecondary ? lotteryDataResult.isLoading : false,
        error: shouldFetchSecondary ? lotteryDataResult.error : undefined,
        unit: "USD"
      },
      { 
        to: "/leaderboard", 
        icon: Trophy, 
        titleKey: "leaderboard" 
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
  }, [
    navigationData.slotsCount, 
    navigationData.lotteryJackpot, 
    slotsLoading, 
    shouldFetchSecondary, 
    lotteryDataResult.isLoading, 
    lotteryDataResult.error, 
    isAdmin
  ]);

  // Memoized slot calculations for accordion content
  const slotCalculations = useMemo(() => {
    if (activeSlots.length === 0) return [];
    
    return activeSlots.slice(0, 3).map((slot, index) => {
      const dailyRate = slot.effectiveWeeklyRate / 7;
      const dailyEarnings = slot.principal * dailyRate;
      return {
        id: slot.id || index,
        index: index + 1,
        dailyEarnings
      };
    });
  }, [activeSlots]);

  // Error handling
  if (userDataError) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white p-4">
        <p className="text-red-500 text-center">{userDataError.toString()}</p>
      </div>
    );
  }

  // Loading state
  if (isLoading || !userData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-200 to-slate-800 relative">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-400/80 via-purple-900/60 to-slate-900/55 backdrop-blur-sm pointer-events-none" />
      
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
                    telegramId={user.telegramId}
                  />
                }
                backContent={
                  <MainCardBack user={user} slots={slotsData} isLoading={slotsLoading} />
                }
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
                          {activeSlots.length}
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
                          {slotCalculations.map(({ id, index, dailyEarnings }) => (
                            <div key={id} className="flex justify-between items-center text-sm">
                              <span className="text-gray-300">Slot {index}:</span>
                              <span className="font-mono text-emerald-400">{dailyEarnings.toFixed(6)} USD</span>
                            </div>
                          ))}
                          {activeSlots.length > 3 && (
                            <div className="text-xs text-gray-400 text-center pt-2">
                              +{activeSlots.length - 3} more slots...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 gap-2">
                      <Link to="/slots" className="block">
                        <button className="w-full bg-gradient-to-r from-blue-600/80 to-blue-500/80 hover:from-blue-500/90 hover:to-blue-400/90 text-white font-semibold py-2 px-3 rounded-lg text-sm transition-all duration-200 flex items-center justify-center gap-2">
                          <Server className="w-4 h-4" />
                          Manage Slots
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
                      isNotification={false}
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