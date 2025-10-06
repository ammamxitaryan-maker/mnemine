"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ExtraPanelProps {
  children: ReactNode;
  className?: string;
  isVisible?: boolean;
}

export const ExtraPanel = ({ 
  children, 
  className,
  isVisible = true 
}: ExtraPanelProps) => {
  if (!isVisible) return null;

  return (
    <aside className={cn(
      "extra-panel",
      className
    )}>
      {children}
    </aside>
  );
};
