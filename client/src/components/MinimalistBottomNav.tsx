"use client";

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Server, Ticket, Wallet, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: Home, labelKey: 'home' },
  { to: '/slots', icon: Server, labelKey: 'slots' },
  { to: '/lottery', icon: Ticket, labelKey: 'lottery.title' },
  { to: '/wallet', icon: Wallet, labelKey: 'wallet.title' },
  { to: '/profile', icon: User, labelKey: 'profile' },
];

export const MinimalistBottomNav = () => {
  const { t } = useTranslation();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 w-full h-full relative",
      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-xl border-t border-border z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto px-4">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} className={navLinkClasses} end>
            {({ isActive }) => (
              <>
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
                
                {/* Icon with subtle animation */}
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10 scale-110" : "hover:bg-muted/50"
                )}>
                  <Icon className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isActive && "scale-110"
                  )} />
                </div>
                
                {/* Label */}
                <span className={cn(
                  "text-xs font-medium transition-all duration-300",
                  isActive && "font-semibold"
                )}>
                  {t(labelKey)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
