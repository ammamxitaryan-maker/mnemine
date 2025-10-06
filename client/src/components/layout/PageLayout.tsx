"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AppContainer } from './AppContainer';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';
import { ExtraPanel } from './ExtraPanel';

interface PageLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  extraPanel?: ReactNode;
  className?: string;
  hasSidebar?: boolean;
  hasExtraPanel?: boolean;
  mainContentPadding?: 'none' | 'sm' | 'md' | 'lg';
}

export const PageLayout = ({
  children,
  sidebar,
  extraPanel,
  className,
  hasSidebar = false,
  hasExtraPanel = false,
  mainContentPadding = 'md'
}: PageLayoutProps) => {
  return (
    <AppContainer 
      className={className}
      hasSidebar={hasSidebar}
      hasExtraPanel={hasExtraPanel}
    >
      {hasSidebar && sidebar && (
        <Sidebar>
          {sidebar}
        </Sidebar>
      )}
      
      <MainContent padding={mainContentPadding}>
        {children}
      </MainContent>
      
      {hasExtraPanel && extraPanel && (
        <ExtraPanel>
          {extraPanel}
        </ExtraPanel>
      )}
    </AppContainer>
  );
};
