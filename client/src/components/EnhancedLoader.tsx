"use client";

import { cn } from '@/lib/utils';

interface EnhancedLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'dots' | 'pulse' | 'wave' | 'shimmer';
  className?: string;
  text?: string;
}

export const EnhancedLoader = ({ 
  size = 'md', 
  variant = 'spinner', 
  className,
  text 
}: EnhancedLoaderProps) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-6 h-6'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-current rounded-full loading-bounce" />
          <div className="w-1 h-1 bg-current rounded-full loading-bounce" style={{ animationDelay: '0.1s' }} />
          <div className="w-1 h-1 bg-current rounded-full loading-bounce" style={{ animationDelay: '0.2s' }} />
        </div>
        {text && <span className={cn('ml-2', textSizeClasses[size], 'loading-shimmer')}>{text}</span>}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('rounded-full bg-current loading-pulse', sizeClasses[size])} />
        {text && <span className={cn(textSizeClasses[size], 'loading-shimmer')}>{text}</span>}
      </div>
    );
  }

  if (variant === 'wave') {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className="flex space-x-0.5">
          <div className="w-1 h-3 bg-current rounded-full loading-wave" />
          <div className="w-1 h-3 bg-current rounded-full loading-wave" />
          <div className="w-1 h-3 bg-current rounded-full loading-wave" />
          <div className="w-1 h-3 bg-current rounded-full loading-wave" />
          <div className="w-1 h-3 bg-current rounded-full loading-wave" />
        </div>
        {text && <span className={cn('ml-2', textSizeClasses[size], 'loading-shimmer')}>{text}</span>}
      </div>
    );
  }

  if (variant === 'shimmer') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div className={cn('rounded bg-current loading-shimmer', sizeClasses[size])} />
        {text && <span className={cn(textSizeClasses[size], 'loading-shimmer')}>{text}</span>}
      </div>
    );
  }

  // Default spinner
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('border-2 border-current border-t-transparent rounded-full loading-spin-smooth', sizeClasses[size])} />
      {text && <span className={cn(textSizeClasses[size], 'loading-shimmer')}>{text}</span>}
    </div>
  );
};
