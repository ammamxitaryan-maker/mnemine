"use client";

import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, CircleDot } from 'lucide-react';
import { AuthenticatedUser } from '@/types/telegram';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';
import { NotificationSystem } from './NotificationSystem'; // Import NotificationSystem
import { useFictitiousUsers } from '@/hooks/useFictitiousUsers';

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
  const { totalUsers, onlineUsers } = useFictitiousUsers();

  const displayName = user.firstName || user.username || "User";
  const fallbackInitial = displayName.charAt(0).toUpperCase();
  const greeting = getGreeting(t);

  return (
    <header className="flex items-center justify-between w-full mb-6">
      <div>
        <h1 className="text-xl font-bold">{greeting}</h1>
        <p className="text-lg font-semibold text-gray-300">{displayName}</p>
        {/* Fictitious User Stats */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
          <span>{t('fictitiousUsers.users')}: <span className="font-bold text-white">{totalUsers.toLocaleString()}</span></span>
          <span className="flex items-center gap-1">
            <CircleDot className="w-3 h-3 text-green-400 animate-pulse-slow" />
            {t('fictitiousUsers.online')}: <span className="font-bold text-white">{onlineUsers.toLocaleString()}</span>
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <NotificationSystem /> {/* Add NotificationSystem here */}
        <LanguageSwitcher />
        <ThemeSwitcher />
        <Link to="/profile">
          <Avatar className="h-10 w-10 border-2 border-purple-400">
            <AvatarImage src={user.avatarUrl || undefined} alt={displayName} />
            <AvatarFallback className="bg-gray-700 text-gray-400">
              {fallbackInitial || <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
};