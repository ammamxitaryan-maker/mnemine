"use client";

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Server, Ticket, ArrowLeftRight } from 'lucide-react';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface QuickActionsProps {
  telegramId: string;
  className?: string;
}

export const QuickActions = ({ telegramId, className = '' }: QuickActionsProps) => {
  const { t } = useTranslation();
  const { data: slotsData } = useSlotsData(telegramId);
  const { hapticLight } = useHapticFeedback();

  const activeSlots = slotsData?.filter(slot => 
    slot.isActive && new Date(slot.expiresAt) > new Date()
  ) || [];

  const actions = [
    {
      to: '/slots',
      icon: Server,
      label: t('slots.title'),
      subtitle: `${activeSlots.length} ${t('active')}`,
      color: 'text-primary'
    },
    {
      to: '/lottery',
      icon: Ticket,
      label: t('lottery.title'),
      subtitle: t('jackpot'),
      color: 'text-accent'
    },
    {
      to: '/wallet',
      icon: ArrowLeftRight,
      label: t('swap.title'),
      subtitle: t('exchange'),
      color: 'text-secondary'
    }
  ];

  return (
    <div className={`grid grid-cols-3 gap-4 ${className}`}>
      {actions.map((action) => (
        <Link 
          key={action.to} 
          to={action.to} 
          className="minimal-card text-center p-4 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
          onClick={() => hapticLight()}
        >
          <div className="p-3 bg-muted/20 rounded-xl mb-3">
            <action.icon className={`w-6 h-6 mx-auto ${action.color}`} />
          </div>
          <h3 className="font-medium text-foreground text-sm mb-1">
            {action.label}
          </h3>
          <p className="text-xs text-muted-foreground">
            {action.subtitle}
          </p>
        </Link>
      ))}
    </div>
  );
};
