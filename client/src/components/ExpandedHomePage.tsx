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
  Ticket,
  UserPlus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { MainBalanceDisplay } from './MainBalanceDisplay';
import { SimpleStats } from './SimpleStats';

interface ExpandedHomePageProps {
  user: AuthenticatedUser;
}

export const ExpandedHomePage = ({ user }: ExpandedHomePageProps) => {
  const { t } = useTranslation();
  const { data: userData, isLoading: userDataLoading } = useUserData(user.telegramId);
  const { data: slotsData, isLoading: slotsLoading } = useSlotsData(user.telegramId);
  const { totalUsers, onlineUsers } = useWebSocketUserStats();
  const { hapticLight, hapticWarning } = useHapticFeedback();

  // Check if user is admin
  const isAdmin = isAdminUser(user.telegramId);

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
    <div className="min-h-screen bg-background">

      {/* Header - Compact */}
      <header className="px-4 pt-3 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-base font-bold text-white mb-1 professional-glow hover:professional-scale transition-all duration-500 ease-in-out">
              {t('appName')}
            </div>
            <h1 className="text-lg font-light text-foreground">
              {displayName}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <CircleDot className="w-2 h-2 text-primary" />
                <span>{onlineUsers.toLocaleString()} {t('online')}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="status-dot online" />
                <span>{totalUsers.toLocaleString()} {t('users')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Avatar className="h-8 w-8 border-2 border-primary">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName || t('profile.user')} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Balance Display - Compact */}
      <div className="px-4 mb-4">
        <MainBalanceDisplay />
      </div>

      {/* Stats - Mining Power and Active Slots - Very Compact */}
      <div className="px-4 mb-2">
        <SimpleStats telegramId={user.telegramId} />
      </div>

      {/* Main Actions - Compact */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-2 gap-2">
          <Link
            to="/slots"
            className="minimal-card text-center p-2 hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-1.5 bg-primary/10 rounded-lg mb-1">
              <Server className="w-4 h-4 mx-auto text-primary" />
            </div>
            <h3 className="font-medium text-foreground text-xs">
              {t('miningSlots')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeSlots.length} {t('activeSlots')}
            </p>
          </Link>

          <Link
            to="/lottery"
            className="minimal-card text-center p-2 hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-1.5 bg-accent/10 rounded-lg mb-1">
              <Ticket className="w-4 h-4 mx-auto text-accent" />
            </div>
            <h3 className="font-medium text-foreground text-xs">
              {t('dailyLottery')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('jackpotAvailable')}
            </p>
          </Link>
        </div>
      </div>

      {/* Wallet Actions - Compact */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-3 gap-1.5">
          <Link
            to="/deposit"
            className="minimal-card text-center p-1.5 hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-1 bg-primary/10 rounded-lg mb-1">
              <ArrowDownToLine className="w-3 h-3 mx-auto text-primary" />
            </div>
            <h3 className="font-medium text-foreground text-xs">
              {t('deposit')}
            </h3>
          </Link>

          <Link
            to="/withdraw"
            className="minimal-card text-center p-1.5 hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-1 bg-secondary/10 rounded-lg mb-1">
              <ArrowUpFromLine className="w-3 h-3 mx-auto text-secondary" />
            </div>
            <h3 className="font-medium text-foreground text-xs">
              {t('withdraw')}
            </h3>
          </Link>

          <Link
            to="/wallet"
            className="minimal-card text-center p-1.5 hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-1 bg-accent/10 rounded-lg mb-1">
              <History className="w-3 h-3 mx-auto text-accent" />
            </div>
            <h3 className="font-medium text-foreground text-xs">
              {t('history')}
            </h3>
          </Link>
        </div>
      </div>


      {/* Referrals Section - Compact */}
      <div className="px-4 mb-3">
        <Link
          to="/referrals"
          className="minimal-card p-2 hover:scale-105 transition-all duration-200 cursor-pointer"
          onClick={() => hapticLight()}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <UserPlus className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground text-xs">
                {t('inviteFriends')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('earnFromReferrals')}
              </p>
            </div>
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          </div>
        </Link>
      </div>

      {/* Admin Panel (conditional) - Compact */}
      {isAdmin && (
        <div className="px-4 mb-3">
          <Link
            to="/admin"
            className="minimal-card p-2 hover:scale-105 transition-all duration-200 cursor-pointer block"
            onClick={() => hapticLight()}
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/10 rounded-lg">
                <Shield className="w-4 h-4 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-xs">
                  {t('adminPanel')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('manageSystem')}
                </p>
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            </div>
          </Link>
        </div>
      )}

      {/* Bottom spacing - Reduced */}
      <div className="h-2" />

    </div>
  );
};
