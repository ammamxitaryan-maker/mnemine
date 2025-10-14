"use client";

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Wallet, Users, User as ProfileIcon, Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, labelKey: 'home' },
  { to: '/wallet', icon: Wallet, labelKey: 'wallet' },
  { to: '/lottery', icon: Ticket, labelKey: 'lottery.title' },
  { to: '/referrals', icon: Users, labelKey: 'referrals.title' },
  { to: '/profile', icon: ProfileIcon, labelKey: 'profile' },
];

export const BottomNavBar = () => {
  const { t } = useTranslation();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex flex-col items-center justify-center gap-1 text-xs transition-all duration-200 w-full h-full",
      isActive ? "text-purple-400" : "text-gray-400 hover:text-white"
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-14 sm:h-12 bg-gray-900/80 border-t border-primary z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-2">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} className={navLinkClasses} end>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-8 sm:w-6 bg-purple-400 rounded-full animate-in fade-in-0 zoom-in-95" />}
                <Icon className={cn("w-6 h-6 sm:w-5 sm:h-5 transition-transform", isActive && "scale-110")} />
                <span className="text-xs sm:text-xs">{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};