"use client";

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { CircleDot } from 'lucide-react';
import { AuthenticatedUser } from '@/types/telegram';
import { useUserData } from '@/hooks/useUserData';
import { useWebSocketUserStats } from '@/hooks/useWebSocketUserStats';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { SimpleBalance } from './SimpleBalance';
import { RealTimeEarnings } from './RealTimeEarnings';
import { QuickActions } from './QuickActions';
import { SimpleStats } from './SimpleStats';

interface MinimalistHomePageProps {
  user: AuthenticatedUser;
}

export const MinimalistHomePage = ({ user }: MinimalistHomePageProps) => {
  const { t } = useTranslation();
  const { data: userData, isLoading: userDataLoading } = useUserData(user.telegramId);
  const { totalUsers, onlineUsers } = useWebSocketUserStats();
  const { hapticLight } = useHapticFeedback();

  const displayName = user.firstName || user.username || t('profile.user');

  if (userDataLoading) {
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
          
          <Link 
            to="/profile" 
            className="p-2 rounded-xl hover:bg-muted transition-colors"
            onClick={() => hapticLight()}
          >
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-primary font-semibold text-lg">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
          </Link>
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

      {/* Quick Actions */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Quick Actions</h2>
        <QuickActions telegramId={user.telegramId} />
      </div>

      {/* Stats */}
      <div className="px-6 mb-8">
        <SimpleStats telegramId={user.telegramId} />
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />
    </div>
  );
};