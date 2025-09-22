import React from 'react';
import { motion } from 'framer-motion';
import { TouchButton } from './FullscreenSection';
import { cn } from '@/lib/utils';

interface CTAButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl',
  secondary: 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl',
  success: 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl',
  warning: 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg hover:shadow-xl',
  danger: 'bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl',
};

const sizeStyles = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

export const CTAButton: React.FC<CTAButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className,
  disabled = false,
  icon,
  fullWidth = false,
}) => {
  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <TouchButton
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'relative overflow-hidden rounded-xl font-semibold transition-all duration-300',
          'border-0 focus:outline-none focus:ring-2 focus:ring-offset-2',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div className="relative flex items-center justify-center gap-2">
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </div>
        
        {/* Shine effect on hover */}
        <div className="absolute inset-0 bg-white/10 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-xl bg-white/20 scale-0 hover:scale-100 transition-transform duration-300 origin-center" />
      </TouchButton>
    </motion.div>
  );
};
