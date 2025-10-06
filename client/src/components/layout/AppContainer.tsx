"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppContainerProps {
  children: ReactNode;
  className?: string;
  hasSidebar?: boolean;
  hasExtraPanel?: boolean;
}

export const AppContainer = ({ 
  children, 
  className,
  hasSidebar = false,
  hasExtraPanel = false 
}: AppContainerProps) => {
  return (
    <div className={cn(
      "app-container",
      hasSidebar && "has-sidebar",
      hasExtraPanel && "has-extra-panel",
      className
    )}>
      {children}
    </div>
  );
};
