"use client";

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnhancedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    loading = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className,
    children,
    disabled,
    ...props
  }, ref) => {
    const baseClasses = 'ds-button-enhanced ds-focus-enhanced ds-transition-optimized';
    
    const variantClasses = {
      primary: 'ds-button-enhanced-primary',
      secondary: 'ds-button-enhanced-secondary',
      outline: 'ds-button-enhanced-outline',
      ghost: 'bg-transparent hover:bg-gray-100/10 text-gray-300 hover:text-white',
      destructive: 'bg-red-600 hover:bg-red-700 text-white'
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[2rem]',
      md: 'px-4 py-3 text-sm min-h-[2.5rem]',
      lg: 'px-6 py-4 text-base min-h-[3rem]'
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        <div className="ds-flex-enhanced ds-items-enhanced-center ds-justify-enhanced-center ds-space-enhanced-xs">
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          )}
          
          {!loading && icon && iconPosition === 'left' && (
            <span className="ds-flex-enhanced ds-items-enhanced-center" aria-hidden="true">
              {icon}
            </span>
          )}
          
          <span className={cn(
            loading && 'opacity-0',
            'ds-transition-optimized'
          )}>
            {children}
          </span>
          
          {!loading && icon && iconPosition === 'right' && (
            <span className="ds-flex-enhanced ds-items-enhanced-center" aria-hidden="true">
              {icon}
            </span>
          )}
        </div>
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';
