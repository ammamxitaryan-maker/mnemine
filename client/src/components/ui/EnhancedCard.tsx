"use client";

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface EnhancedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  hover?: boolean;
  interactive?: boolean;
  children: React.ReactNode;
}

export const EnhancedCard = forwardRef<HTMLDivElement, EnhancedCardProps>(
  ({
    variant = 'default',
    size = 'md',
    hover = true,
    interactive = false,
    className,
    children,
    ...props
  }, ref) => {
    const baseClasses = 'ds-card-enhanced ds-transition-optimized';
    
    const variantClasses = {
      default: '',
      primary: 'ds-card-enhanced-primary',
      secondary: 'ds-card-enhanced-secondary',
      accent: 'ds-card-enhanced-accent',
      outline: 'border-2 border-dashed border-gray-600 bg-transparent'
    };

    const sizeClasses = {
      sm: 'ds-card-enhanced-sm',
      md: 'ds-card-enhanced-md',
      lg: 'ds-card-enhanced-lg'
    };

    const interactiveClasses = interactive 
      ? 'cursor-pointer ds-hover-optimized ds-focus-enhanced' 
      : '';

    const hoverClasses = hover 
      ? 'hover:transform hover:-translate-y-1 hover:shadow-lg' 
      : '';

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          interactiveClasses,
          hoverClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

EnhancedCard.displayName = 'EnhancedCard';

// Card Header Component
interface EnhancedCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const EnhancedCardHeader = forwardRef<HTMLDivElement, EnhancedCardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'ds-padding-enhanced-md ds-padding-enhanced-sm',
          'border-b border-gray-700/50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

EnhancedCardHeader.displayName = 'EnhancedCardHeader';

// Card Content Component
interface EnhancedCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const EnhancedCardContent = forwardRef<HTMLDivElement, EnhancedCardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'ds-padding-enhanced-md',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

EnhancedCardContent.displayName = 'EnhancedCardContent';

// Card Footer Component
interface EnhancedCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const EnhancedCardFooter = forwardRef<HTMLDivElement, EnhancedCardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'ds-padding-enhanced-md ds-padding-enhanced-sm',
          'border-t border-gray-700/50',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

EnhancedCardFooter.displayName = 'EnhancedCardFooter';
