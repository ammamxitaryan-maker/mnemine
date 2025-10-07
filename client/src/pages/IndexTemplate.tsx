"use client";

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserData } from '@/hooks/useUserData';
// import { useClaimEarnings } from '@/hooks/useClaimEarnings';
import { useTasksData } from '@/hooks/useTasksData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useAchievements } from '@/hooks/useAchievements';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useBonusesSummary } from '@/hooks/useBonusesSummary';
import { useExchangeRate } from '@/hooks/useSwap';

import { AuthWrapper } from '@/components/AuthWrapper';
import { PageLayout } from '@/components/layout/PageLayout';
import { TemplateCard } from '@/components/ui/TemplateCard';
import { TemplateButton } from '@/components/ui/TemplateButton';
import { AuthenticatedUser } from '@/types/telegram';
import { showError } from '@/utils/toast';

import { Server, Trophy, Gift, Award, Ticket, Loader2, Settings, Wallet, Coins, TrendingUp, DollarSign } from 'lucide-react';

const IndexTemplateContent = ({ user }: { user: AuthenticatedUser }) => {
  const { t } = useTranslation();
  
  // Data fetching hooks - all called at top level for consistency
  const { data: userData, isLoading: userDataLoading, error: userDataError } = useUserData(user.telegramId);
  const { data: slotsData, isLoading: slotsLoading } = useSlotsData(user.telegramId);
  // const { claim: originalClaim, isClaiming } = useClaimEarnings();
  const originalClaim = () => {}; // Placeholder function
  const isClaiming = false; // Placeholder state
  // const tasksDataResult = useTasksData(user.telegramId);
  const lotteryDataResult = useLotteryData();
  const bonusesSummaryResult = useBonusesSummary();
  const achievementsResult = useAchievements();
  const { data: rateData } = useExchangeRate(user.telegramId);

  // Local state
  const [displayEarnings, setDisplayEarnings] = useState(0);
  
  // Calculate USD equivalent of MNE balance
  const usdEquivalent = rateData && userData?.mneBalance ? userData.mneBalance * rateData.rate : 0;

  // Memoized loading state
  const overallLoading = useMemo(() => 
    userDataLoading || 
    slotsLoading || 
    lotteryDataResult.isLoading || 
    bonusesSummaryResult.isLoading || 
    achievementsResult.isLoading,
    [userDataLoading, slotsLoading, lotteryDataResult.isLoading, bonusesSummaryResult.isLoading, achievementsResult.isLoading]
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
    if (userData && slotsData) {
      // Calculate accumulated earnings since last server sync
      const now = new Date();
      let accumulatedEarnings = userData.accruedEarnings;
      
      // Add earnings that have accumulated since the server calculation
      slotsData.forEach(slot => {
        if (slot.isActive && new Date(slot.expiresAt) > now) {
          const timeElapsedMs = now.getTime() - new Date(slot.lastAccruedAt || slot.createdAt).getTime();
          if (timeElapsedMs > 0) {
            const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
            const additionalEarnings = earningsPerSecond * (timeElapsedMs / 1000);
            accumulatedEarnings += additionalEarnings;
          }
        }
      });
      
      setDisplayEarnings(accumulatedEarnings);
    }
  }, [userData, slotsData]);

  // Memoized navigation data calculations
  const navigationData = useMemo(() => {
    const slotsCount = Array.isArray(slotsData) ? slotsData.filter((s: { isActive: boolean }) => s.isActive).length : 0;
    const lotteryJackpot = lotteryDataResult.lottery?.jackpot?.toFixed(4);
    const bonusesCount = bonusesSummaryResult.data?.claimableCount ?? 0;
    const achievementsCount = Array.isArray(achievementsResult.achievements) ? achievementsResult.achievements.filter((a: { isCompleted: boolean; isClaimed: boolean }) => a.isCompleted && !a.isClaimed).length : 0;

    return {
      slotsCount,
      lotteryJackpot,
      bonusesCount,
      achievementsCount
    };
  }, [slotsData, lotteryDataResult.lottery?.jackpot, bonusesSummaryResult.data?.claimableCount, achievementsResult.achievements]);

  // Check if user is admin
  const ADMIN_TELEGRAM_IDS = import.meta.env.VITE_ADMIN_TELEGRAM_IDS 
    ? import.meta.env.VITE_ADMIN_TELEGRAM_IDS.split(',').map((id: string) => id.trim())
    : ['6760298907'];
  
  const isAdmin = user && ADMIN_TELEGRAM_IDS.includes(user.telegramId);

  // Memoized navigation items
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
        error: null,
        isNotification: false
      });
    }

    return baseItems;
  }, [navigationData, slotsLoading, lotteryDataResult.isLoading, lotteryDataResult.error, bonusesSummaryResult.isLoading, bonusesSummaryResult.error, achievementsResult.isLoading, achievementsResult.error, isAdmin]);

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

  if (overallLoading || !userData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  const displayName = user.firstName || user.username || "User";
  const greeting = t('greeting.morning'); // Simplified for template

  return (
    <PageLayout 
      hasSidebar={false}
      hasExtraPanel={false}
      mainContentPadding="md"
    >
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading heading-1">{greeting}</h1>
          <p className="text-lg text-muted-foreground">{displayName}</p>
        </div>
        <div className="flex items-center gap-2">
          <TemplateButton variant="ghost" size="sm">
            <Settings className="w-4 h-4" />
          </TemplateButton>
        </div>
      </div>

      {/* Main Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Balance Card */}
        <TemplateCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading heading-3">{t('balance')}</h2>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">+0.02%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-400/20 rounded-full">
              <Coins className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {(userData?.mneBalance ?? 0).toFixed(2)} <span className="text-sm text-gray-300">MNE</span>
              </p>
              {/* USD Equivalent Display */}
              {usdEquivalent > 0 && (
                <p className="text-lg font-semibold text-yellow-400 mt-1">
                  {usdEquivalent.toFixed(4)} <span className="text-sm text-yellow-300">USD</span>
                </p>
              )}
            </div>
          </div>
        </TemplateCard>

        {/* Earnings Card */}
        <TemplateCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading heading-3">{t('accruedEarnings')}</h2>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-purple-400">Live</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-400/20 rounded-full">
              <Coins className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white animate-pulse">
                {(() => {
                  // Check if user has purchased slots (has active slots)
                  const hasActiveSlots = slotsData && slotsData.some(slot => slot.isActive && new Date(slot.expiresAt) > new Date());
                  
                  if (hasActiveSlots) {
                    // Show 30% bonus visually only - multiply by 1.3 for display
                    const displayWithBonus = displayEarnings * 1.3;
                    return displayWithBonus.toFixed(8);
                  } else {
                    // Show normal earnings if no slots
                    return displayEarnings.toFixed(8);
                  }
                })()} <span className="text-sm text-gray-300">USD</span>
              </p>
              {/* Show bonus indicator if user has slots */}
              {slotsData && slotsData.some(slot => slot.isActive && new Date(slot.expiresAt) > new Date()) && (
                <div className="flex items-center justify-center gap-1 mt-1">
                  <span className="text-xs font-medium text-emerald-400">+30% Bonus</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
              )}
            </div>
          </div>
        </TemplateCard>
      </div>

      {/* Action Button */}
      <div className="mb-6">
        <TemplateButton
          onClick={claim}
          disabled={isClaiming || displayEarnings < 0.000001}
          className="w-full"
          size="lg"
        >
          {isClaiming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('claim.processing')}
            </>
          ) : (
            t('claim')
          )}
        </TemplateButton>
      </div>

      {/* Navigation Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {navItems.map((item) => (
          <TemplateCard key={item.to} className="cursor-pointer hover:scale-105 transition-transform">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-emerald-400/20 rounded-full mb-2">
                <item.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-white mb-1">{t(item.titleKey)}</p>
              {item.data && (
                <p className="text-xs text-gray-300">
                  {item.data} {item.unit ? t(item.unit) : ''}
                </p>
              )}
            </div>
          </TemplateCard>
        ))}
      </div>
    </PageLayout>
  );
};

const IndexTemplate = () => {
  return (
    <AuthWrapper>
      {(user) => <IndexTemplateContent user={user} />}
    </AuthWrapper>
  );
};

export default IndexTemplate;
