"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MainContentProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const MainContent = ({ 
  children, 
  className,
  padding = 'md'
}: MainContentProps) => {
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  return (
    <main className={cn(
      "main-content",
      paddingClasses[padding],
      className
    )}>
      {children}
    </main>
  );
};
