"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TemplateCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const TemplateCard = ({
  children,
  className,
  hover = true,
  padding = 'md'
}: TemplateCardProps) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <div className={cn(
      "card",
      hover && "hover:shadow-lg hover:-translate-y-1",
      paddingClasses[padding],
      className
    )}>
      {children}
    </div>
  );
};
