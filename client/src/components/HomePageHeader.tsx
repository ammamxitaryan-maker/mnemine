"use client";

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CircleDot } from 'lucide-react';
import { AuthenticatedUser } from '@/types/telegram';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher'; // Import ThemeSwitcher
import { useWebSocketUserStats } from '@/hooks/useWebSocketUserStats';

interface HomePageHeaderProps {
  user: AuthenticatedUser;
}

const getGreeting = (t: (key: string) => string) => {
  const hour = new Date().getHours();
  if (hour < 12) return t('greeting.morning');
  if (hour < 18) return t('greeting.afternoon');
  return t('greeting.evening');
};

export const HomePageHeader = ({ user }: HomePageHeaderProps) => {
  const { t } = useTranslation();
  const { totalUsers, onlineUsers } = useWebSocketUserStats();

  const displayName = user.firstName || user.username || "User";
  const fallbackInitial = displayName.charAt(0).toUpperCase();
  const greeting = getGreeting(t);

  return (
    <header className="flex items-center justify-between w-full mb-8">
      <div className="flex-1">
        <h1 className="text-2xl font-bold text-white mb-1">{greeting}</h1>
        <p className="text-xl font-semibold text-white mb-3">{displayName}</p>
        {/* Enhanced User Stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <span className="text-gray-300">{t('fictitiousUsers.users')}: <span className="font-bold text-white">{totalUsers.toLocaleString()}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <CircleDot className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="text-gray-300">{t('fictitiousUsers.online')}: <span className="font-bold text-white">{onlineUsers.toLocaleString()}</span></span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher />
        <ThemeSwitcher />
        <Link to="/profile" className="group">
          <Avatar className="h-12 w-12 border-2 border-purple-400 group-hover:border-purple-300 transition-colors duration-200 shadow-lg">
            {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={displayName} />}
            <AvatarFallback className="bg-gradient-to-br from-slate-700 to-slate-800 text-white font-semibold">
              {fallbackInitial ? fallbackInitial : <User className="w-6 h-6" />}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};