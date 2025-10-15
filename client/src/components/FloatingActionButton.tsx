"use client";

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, ArrowLeftRight, Wallet, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export const FloatingActionButton = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { hapticLight, hapticMedium } = useHapticFeedback();

  const quickActions = [
    { to: '/wallet', icon: Wallet, label: t('wallet.title') },
    { to: '/deposit', icon: ArrowLeftRight, label: t('deposit') },
    { to: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <>
      {/* Quick Actions Menu */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 z-40 space-y-3">
          {quickActions.map((action, index) => (
            <Link
              key={action.to}
              to={action.to}
              className={cn(
                "flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3",
                "hover:bg-muted transition-all duration-200 hover:scale-105",
                "shadow-lg backdrop-blur-xl"
              )}
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'slideInUp 0.3s ease-out forwards'
              }}
              onClick={() => {
                hapticLight();
                setIsOpen(false);
              }}
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <action.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Main FAB */}
      <button
        onClick={() => {
          hapticMedium();
          setIsOpen(!isOpen);
        }}
        className={cn(
          "fab",
          isOpen && "rotate-45 bg-secondary"
        )}
        aria-label="Quick actions"
      >
        <Plus className="w-6 h-6 transition-transform duration-300" />
      </button>

      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
};
