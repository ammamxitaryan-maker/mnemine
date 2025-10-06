"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  children: ReactNode;
  className?: string;
  isCollapsed?: boolean;
}

export const Sidebar = ({ children, className, isCollapsed = false }: SidebarProps) => {
  return (
    <aside className={cn(
      "sidebar",
      isCollapsed && "collapsed",
      className
    )}>
      {children}
    </aside>
  );
};
