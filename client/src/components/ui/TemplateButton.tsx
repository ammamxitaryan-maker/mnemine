"use client";

import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TemplateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const TemplateButton = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: TemplateButtonProps) => {
  const variantClasses = {
    primary: 'button',
    secondary: 'button button-secondary',
    ghost: 'button button-ghost'
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-8',
    md: 'px-4 py-2 text-base min-h-10',
    lg: 'px-6 py-3 text-lg min-h-12'
  };

  return (
    <button
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};
