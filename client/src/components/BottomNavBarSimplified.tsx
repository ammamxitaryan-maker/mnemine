"use client";

import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Wallet, ArrowRightLeft, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

// Упрощенная навигация - только самые важные разделы
const navItems = [
  { to: '/', icon: Home, labelKey: 'home' },
  { to: '/wallet', icon: Wallet, labelKey: 'wallet' },
  { to: '/swap', icon: ArrowRightLeft, labelKey: 'swap.title' },
  { to: '/menu', icon: Menu, labelKey: 'menu' }, // Новый раздел "Меню" для остальных функций
];

export const BottomNavBarSimplified = () => {
  const { t } = useTranslation();

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    cn(
      "relative flex flex-col items-center justify-center gap-1 text-xs transition-all duration-200 w-full h-full",
      isActive ? "text-blue-500" : "text-gray-400 hover:text-white"
    );

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 z-50">
      <div className="flex justify-around items-center h-full max-w-md mx-auto">
        {navItems.map(({ to, icon: Icon, labelKey }) => (
          <NavLink key={to} to={to} className={navLinkClasses} end>
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 h-0.5 w-8 bg-blue-500 rounded-full animate-in fade-in-0 zoom-in-95" />
                )}
                <Icon className={cn("w-6 h-6 transition-transform", isActive && "scale-110")} />
                <span>{t(labelKey)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
