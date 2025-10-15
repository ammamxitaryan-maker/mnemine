"use client";

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  CircleDot, 
  Server, 
  Ticket, 
  Wallet, 
  User,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Settings,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Globe,
  Moon,
  Sun,
  ChevronRight,
  Award,
  TrendingUp,
  Users,
  Loader2,
  UserPlus
} from 'lucide-react';
import { AuthenticatedUser } from '@/types/telegram';
import { useUserData } from '@/hooks/useUserData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useWebSocketUserStats } from '@/hooks/useWebSocketUserStats';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SimpleBalance } from './SimpleBalance';
import { RealTimeEarnings } from './RealTimeEarnings';
import { QuickActions } from './QuickActions';
import { SimpleStats } from './SimpleStats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { Shield } from 'lucide-react';

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

  const handleLogout = () => {
    hapticWarning();
    if (confirm('Are you sure you want to logout?')) {
      // logout function would be called here
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
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
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </header>

      {/* Balance */}
      <div className="px-6 mb-6">
        <SimpleBalance telegramId={user.telegramId} />
      </div>

      {/* Real-time Earnings */}
      <div className="px-6 mb-6">
        <RealTimeEarnings telegramId={user.telegramId} />
      </div>

      {/* Main Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Main Actions</h2>
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
              {t('slots.title')}
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
              {t('lottery.title')}
            </h3>
            <p className="text-xs text-muted-foreground">
              Jackpot available
            </p>
          </Link>
        </div>
      </div>

      {/* Referrals Section */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Referrals</h2>
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
                Invite Friends
              </h3>
              <p className="text-xs text-muted-foreground">
                Earn from referrals • Share your link
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </Link>
      </div>

      {/* Wallet Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Wallet</h2>
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
              Add funds
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
              Cash out
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
              History
            </h3>
            <p className="text-xs text-muted-foreground">
              Transactions
            </p>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 mb-6">
        <SimpleStats telegramId={user.telegramId} />
      </div>

      {/* Profile & Settings */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-medium text-foreground mb-4">Account</h2>
        <div className="minimal-card">
          <div className="space-y-1">
            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <span className="text-foreground">Profile Info</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-xl">
                  <Settings className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-foreground">{t('settings')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Bell className="w-4 h-4 text-accent" />
                </div>
                <span className="text-foreground">{t('notifications')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>

            {isAdmin && (
              <Link 
                to="/admin" 
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => hapticLight()}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-xl">
                    <Shield className="w-4 h-4 text-purple-500" />
                  </div>
                  <span className="text-foreground">Admin Panel</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full mt-4 border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
};
