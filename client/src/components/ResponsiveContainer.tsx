"use client";

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
};

const paddingClasses = {
  none: '',
  sm: 'p-2 sm:p-3',
  md: 'p-3 sm:p-4 lg:p-6',
  lg: 'p-4 sm:p-6 lg:p-8',
  xl: 'p-6 sm:p-8 lg:p-12'
};

const spacingClasses = {
  none: '',
  sm: 'space-y-2 sm:space-y-3',
  md: 'space-y-3 sm:space-y-4 lg:space-y-6',
  lg: 'space-y-4 sm:space-y-6 lg:space-y-8',
  xl: 'space-y-6 sm:space-y-8 lg:space-y-12'
};

export const ResponsiveContainer = ({
  children,
  className,
  maxWidth = 'full',
  padding = 'md',
  spacing = 'md'
}: ResponsiveContainerProps) => {
  return (
    <div
      className={cn(
        'w-full mx-auto',
        maxWidthClasses[maxWidth],
        paddingClasses[padding],
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
  cols?: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  gap?: 'sm' | 'md' | 'lg' | 'xl';
}

const gapClasses = {
  sm: 'gap-2',
  md: 'gap-3 sm:gap-4',
  lg: 'gap-4 sm:gap-6',
  xl: 'gap-6 sm:gap-8'
};

export const ResponsiveGrid = ({
  children,
  className,
  cols = { mobile: 2, tablet: 3, desktop: 4 },
  gap = 'md'
}: ResponsiveGridProps) => {
  const gridCols = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;
  
  return (
    <div
      className={cn(
        'grid',
        gridCols,
        gapClasses[gap],
        className
      )}
    >
      {children}
    </div>
  );
};

interface ResponsiveTextProps {
  children: ReactNode;
  className?: string;
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
  responsive?: boolean;
}

const textSizeClasses = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl'
};

const responsiveTextSizeClasses = {
  sm: 'text-responsive-sm',
  base: 'text-responsive-base',
  lg: 'text-responsive-lg',
  xl: 'text-responsive-xl',
  '2xl': 'text-responsive-2xl',
  '3xl': 'text-responsive-3xl'
};

export const ResponsiveText = ({
  children,
  className,
  size = 'base',
  responsive = false
}: ResponsiveTextProps) => {
  return (
    <span
      className={cn(
        responsive ? responsiveTextSizeClasses[size] : textSizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
};

interface ResponsiveSpacingProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  margin?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

const paddingSizeClasses = {
  none: '',
  sm: 'p-2',
  md: 'p-3 sm:p-4',
  lg: 'p-4 sm:p-6',
  xl: 'p-6 sm:p-8'
};

const marginSizeClasses = {
  none: '',
  sm: 'm-2',
  md: 'm-3 sm:m-4',
  lg: 'm-4 sm:m-6',
  xl: 'm-6 sm:m-8'
};

export const ResponsiveSpacing = ({
  children,
  className,
  padding = 'none',
  margin = 'none'
}: ResponsiveSpacingProps) => {
  return (
    <div
      className={cn(
        paddingSizeClasses[padding],
        marginSizeClasses[margin],
        className
      )}
    >
      {children}
    </div>
  );
};
