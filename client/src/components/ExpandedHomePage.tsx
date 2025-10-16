"use client";

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  CircleDot, 
  Server, 
  Ticket, 
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Shield,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { AuthenticatedUser } from '@/types/telegram';
import { useUserData } from '@/hooks/useUserData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useWebSocketUserStats } from '@/hooks/useWebSocketUserStats';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { MainBalanceDisplay } from './MainBalanceDisplay';
import { QuickActions } from './QuickActions';
import { SimpleStats } from './SimpleStats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

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
  const ADMIN_TELEGRAM_IDS = import.meta.env.VITE_ADMIN_TELEGRAM_IDS 
    ? import.meta.env.VITE_ADMIN_TELEGRAM_IDS.split(',').map((id: string) => id.trim())
    : ['6760298907'];
  const isAdmin = ADMIN_TELEGRAM_IDS.includes(user.telegramId);

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
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <header className="px-6 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-light text-foreground">
              {displayName}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CircleDot className="w-3 h-3 text-primary" />
                <span>{onlineUsers.toLocaleString()} online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="status-dot online" />
                <span>{totalUsers.toLocaleString()} users</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeSwitcher />
            <Avatar className="h-10 w-10 border-2 border-primary">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName || 'User'} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Main Balance Display */}
      <div className="px-6 mb-6">
        <MainBalanceDisplay />
      </div>

      {/* Main Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">{t('mainActions')}</h2>
        <div className="grid grid-cols-2 gap-4">
          <Link 
            to="/slots" 
            className="minimal-card text-center p-4 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-3 bg-primary/10 rounded-xl mb-3">
              <Server className="w-6 h-6 mx-auto text-primary" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">
              {t('miningSlots')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {activeSlots.length} active slots
            </p>
          </Link>

          <Link 
            to="/lottery" 
            className="minimal-card text-center p-4 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-3 bg-accent/10 rounded-xl mb-3">
              <Ticket className="w-6 h-6 mx-auto text-accent" />
            </div>
            <h3 className="font-medium text-foreground text-sm mb-1">
              {t('dailyLottery')}
            </h3>
            <p className="text-xs text-muted-foreground">
              Jackpot available
            </p>
          </Link>
        </div>
      </div>

      {/* Referrals Section */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">{t('referrals')}</h2>
        <Link 
          to="/referrals" 
          className="minimal-card p-4 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          onClick={() => hapticLight()}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <UserPlus className="w-6 h-6 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground text-sm mb-1">
                {t('inviteFriends')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('earnFromReferrals')}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      </div>

      {/* Wallet Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">{t('wallet')}</h2>
        <div className="grid grid-cols-3 gap-3">
          <Link 
            to="/deposit" 
            className="minimal-card text-center p-3 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-2 bg-primary/10 rounded-xl mb-2">
              <ArrowDownToLine className="w-5 h-5 mx-auto text-primary" />
            </div>
            <h3 className="font-medium text-foreground text-xs mb-1">
              {t('deposit')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('addFunds')}
            </p>
          </Link>

          <Link 
            to="/withdraw" 
            className="minimal-card text-center p-3 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-2 bg-secondary/10 rounded-xl mb-2">
              <ArrowUpFromLine className="w-5 h-5 mx-auto text-secondary" />
            </div>
            <h3 className="font-medium text-foreground text-xs mb-1">
              {t('withdraw')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('cashOut')}
            </p>
          </Link>

          <Link 
            to="/wallet" 
            className="minimal-card text-center p-3 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            onClick={() => hapticLight()}
          >
            <div className="p-2 bg-accent/10 rounded-xl mb-2">
              <History className="w-5 h-5 mx-auto text-accent" />
            </div>
            <h3 className="font-medium text-foreground text-xs mb-1">
              {t('history')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('transactions')}
            </p>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 mb-6">
        <SimpleStats telegramId={user.telegramId} />
      </div>

      {/* Admin Panel (conditional) */}
      {isAdmin && (
        <div className="px-6 mb-8">
          <Link 
            to="/admin" 
            className="minimal-card p-4 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer block"
            onClick={() => hapticLight()}
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <Shield className="w-6 h-6 text-purple-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm mb-1">
                  {t('adminPanel')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {t('manageSystem')}
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </Link>
        </div>
      )}

      {/* Bottom spacing */}
      <div className="h-8" />
      
    </div>
  );
};
