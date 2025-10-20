"use client";

import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useUserData } from '@/hooks/useUserData';
import { useWebSocketUserStats } from '@/hooks/useWebSocketUserStats';
import { AuthenticatedUser } from '@/types/telegram';
import { isAdminUser } from '@/utils/adminAuth';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronRight,
  CircleDot,
  History,
  Server,
  Shield,
  Sparkles,
  Ticket,
  UserPlus
} from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MainBalanceDisplay } from './MainBalanceDisplay';
import { SimpleStats } from './SimpleStats';

interface ExpandedHomePageProps {
  user: AuthenticatedUser;
}

export const ExpandedHomePage = ({ user }: ExpandedHomePageProps) => {
  const { t } = useTranslation();
  const { data: userData, isLoading: userDataLoading, forceRefresh } = useUserData(user.telegramId);
  const { data: slotsData, isLoading: slotsLoading } = useSlotsData(user.telegramId);
  const { totalUsers, onlineUsers } = useWebSocketUserStats();
  const { hapticLight, hapticWarning } = useHapticFeedback();

  // Check if user is admin
  const isAdmin = isAdminUser(user.telegramId);

  // Force refresh user data when page loads to get latest balance
  useEffect(() => {
    console.log('[ExpandedHomePage] Page loaded, forcing data refresh for user', user.telegramId);
    if (forceRefresh) {
      forceRefresh();
    }
  }, [user.telegramId]); // Remove forceRefresh from dependencies to prevent infinite loop

  const displayName = user.firstName || user.username || t('profile.user');
  const fallbackInitial = displayName?.charAt(0).toUpperCase() || 'U';

  const activeSlots = slotsData?.filter(slot =>
    slot.isActive && new Date(slot.expiresAt) > new Date()
  ) || [];

  if (userDataLoading || slotsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5 relative overflow-hidden">
      {/* Modern Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(5,150,105,0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-secondary/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Compact Header */}
      <header className="relative z-10 px-4 pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <div className="text-lg font-bold text-white professional-glow hover:professional-scale transition-all duration-500 ease-in-out">
                  {t('appName')}
                </div>
                <div className="text-xs text-muted-foreground font-medium">
                  {t('cryptoMining')}
                </div>
              </div>
            </div>
            <h1 className="text-lg font-light text-foreground mb-1">
              Welcome back, {displayName}
            </h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="relative">
                  <CircleDot className="w-2 h-2 text-primary" />
                  <div className="absolute inset-0 w-2 h-2 bg-primary/30 rounded-full animate-ping" />
                </div>
                <span className="font-medium">{onlineUsers.toLocaleString()} {t('online')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
                <span className="font-medium">{totalUsers.toLocaleString()} {t('users')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-primary/20 shadow-lg">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName || t('profile.user')} />}
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-secondary/20 text-primary font-bold text-sm">
                  {fallbackInitial}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary rounded-full border-2 border-background flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Balance Display - Compact */}
      <div className="px-4 mb-4">
        <MainBalanceDisplay />
      </div>

      {/* Stats - Mining Power and Active Slots - Compact */}
      <div className="px-4 mb-4">
        <SimpleStats telegramId={user.telegramId} />
      </div>

      {/* Main Actions - Compact Grid */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/slots"
            className="group relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-4 hover:scale-105 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => hapticLight()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg mb-3 group-hover:scale-110 transition-transform duration-300">
                <Server className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors duration-300">
                {t('miningSlots')}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {activeSlots.length} {t('activeSlots')}
              </p>
              <div className="flex items-center text-primary text-xs font-medium group-hover:translate-x-1 transition-transform duration-300">
                <span>Start Mining</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </Link>

          <Link
            to="/lottery"
            className="group relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-xl p-4 hover:scale-105 hover:shadow-lg hover:shadow-accent/10 transition-all duration-300 cursor-pointer overflow-hidden"
            onClick={() => hapticLight()}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg mb-3 group-hover:scale-110 transition-transform duration-300">
                <Ticket className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-accent transition-colors duration-300">
                {t('dailyLottery')}
              </h3>
              <p className="text-xs text-muted-foreground mb-2">
                {t('jackpotAvailable')}
              </p>
              <div className="flex items-center text-accent text-xs font-medium group-hover:translate-x-1 transition-transform duration-300">
                <span>Join Now</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Wallet Actions - Compact Grid */}
      <div className="px-4 mb-4">
        <div className="grid grid-cols-3 gap-2">
          <Link
            to="/deposit"
            className="group relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-lg p-3 hover:scale-105 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-pointer text-center"
            onClick={() => hapticLight()}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg mb-2 mx-auto group-hover:scale-110 transition-transform duration-300">
              <ArrowDownToLine className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors duration-300">
              {t('deposit')}
            </h3>
          </Link>

          <Link
            to="/withdraw"
            className="group relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-lg p-3 hover:scale-105 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300 cursor-pointer text-center"
            onClick={() => hapticLight()}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-secondary/20 to-secondary/10 rounded-lg mb-2 mx-auto group-hover:scale-110 transition-transform duration-300">
              <ArrowUpFromLine className="w-4 h-4 text-secondary" />
            </div>
            <h3 className="font-semibold text-foreground text-xs group-hover:text-secondary transition-colors duration-300">
              {t('withdraw')}
            </h3>
          </Link>

          <Link
            to="/wallet"
            className="group relative bg-gradient-to-br from-card to-card/80 border border-border/50 rounded-lg p-3 hover:scale-105 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 cursor-pointer text-center"
            onClick={() => hapticLight()}
          >
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-accent/20 to-accent/10 rounded-lg mb-2 mx-auto group-hover:scale-110 transition-transform duration-300">
              <History className="w-4 h-4 text-accent" />
            </div>
            <h3 className="font-semibold text-foreground text-xs group-hover:text-accent transition-colors duration-300">
              {t('history')}
            </h3>
          </Link>
        </div>
      </div>


      {/* Referrals Section - Compact */}
      <div className="px-4 mb-4">
        <Link
          to="/referrals"
          className="group relative bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-4 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 cursor-pointer block"
          onClick={() => hapticLight()}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
              <UserPlus className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-emerald-500 transition-colors duration-300">
                {t('inviteFriends')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('earnFromReferrals')}
              </p>
            </div>
            <div className="flex items-center text-emerald-500 group-hover:translate-x-1 transition-transform duration-300">
              <span className="text-xs font-medium mr-1">Invite</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </Link>
      </div>

      {/* Admin Panel (conditional) - Compact */}
      {isAdmin && (
        <div className="px-4 mb-4">
          <Link
            to="/admin"
            className="group relative bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-4 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 cursor-pointer block"
            onClick={() => hapticLight()}
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                <Shield className="w-5 h-5 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-purple-500 transition-colors duration-300">
                  {t('adminPanel')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('manageSystem')}
                </p>
              </div>
              <div className="flex items-center text-purple-500 group-hover:translate-x-1 transition-transform duration-300">
                <span className="text-xs font-medium mr-1">Manage</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom spacing for better mobile experience */}
      <div className="h-4" />

    </div>
  );
};
