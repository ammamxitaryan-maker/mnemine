"use client";

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  User, 
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
  Loader2
} from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData } from '@/hooks/useUserData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';

export const MinimalistProfilePage = () => {
  const { t } = useTranslation();
  const { user, logout } = useTelegramAuth();
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);
  const { data: slotsData, isLoading: slotsLoading } = useSlotsData(user?.telegramId);
  const { hapticLight, hapticWarning } = useHapticFeedback();

  const isLoading = userDataLoading || slotsLoading;
  const displayName = user?.firstName || user?.username || t('profile.user');
  const fallbackInitial = displayName?.charAt(0).toUpperCase() || 'U';
  
  const activeSlots = slotsData?.filter(slot => 
    slot.isActive && new Date(slot.expiresAt) > new Date()
  ) || [];

  const profileStats = [
    {
      icon: TrendingUp,
      label: 'Mining Power',
      value: `${((userData?.miningPower ?? 0) * 100).toFixed(1)}%`,
      color: 'text-primary'
    },
    {
      icon: Award,
      label: 'Active Slots',
      value: activeSlots.length.toString(),
      color: 'text-secondary'
    },
    {
      icon: Users,
      label: 'Referrals',
      value: '0', // TODO: Add referrals data
      color: 'text-accent'
    }
  ];

  const menuItems = [
    {
      icon: Settings,
      label: t('settings'),
      to: '/settings',
      color: 'text-muted-foreground'
    },
    {
      icon: Bell,
      label: t('notifications'),
      to: '/notifications',
      color: 'text-muted-foreground'
    },
    {
      icon: Shield,
      label: t('security'),
      to: '/security',
      color: 'text-muted-foreground'
    },
    {
      icon: HelpCircle,
      label: t('help'),
      to: '/help',
      color: 'text-muted-foreground'
    }
  ];

  const handleLogout = () => {
    hapticWarning();
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <User className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-foreground">Profile</h1>
            <p className="text-sm text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
        </div>
      </header>

      {/* User Info */}
      <div className="px-6 mb-6">
        <div className="minimal-card text-center">
          <div className="flex items-center justify-center mb-4">
            <Avatar className="h-20 w-20 border-2 border-primary">
              {user?.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                {fallbackInitial}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <h2 className="text-xl font-medium text-foreground mb-1">
            {displayName}
          </h2>
          
          <p className="text-sm text-muted-foreground mb-4">
            @{user?.username || 'user'}
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
            {profileStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <div className="p-2 bg-muted/20 rounded-xl">
                    <stat.icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-lg font-medium text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Settings */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Quick Settings</h2>
        <div className="minimal-card">
          <div className="space-y-4">
            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-xl">
                  <Globe className="w-4 h-4 text-secondary" />
                </div>
                <span className="text-foreground">Language</span>
              </div>
              <LanguageSwitcher />
            </div>

            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-xl">
                  <Moon className="w-4 h-4 text-accent" />
                </div>
                <span className="text-foreground">Theme</span>
              </div>
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Account</h2>
        <div className="minimal-card">
          <div className="space-y-1">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.to}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => hapticLight()}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-muted/20 rounded-xl">
                    <item.icon className={`w-4 h-4 ${item.color}`} />
                  </div>
                  <span className="text-foreground">{item.label}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="px-6 mb-8">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-destructive/20 text-destructive hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />
    </div>
  );
};
