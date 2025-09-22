"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

const CTAButton = React.forwardRef<HTMLButtonElement, CTAButtonProps>(
  ({ 
    className, 
    variant = "primary", 
    size = "md", 
    icon: Icon,
    iconPosition = "left",
    loading = false,
    fullWidth = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const baseClasses = "relative inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
    
    const variantClasses = {
      primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl border border-blue-500/20",
      secondary: "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white shadow-lg hover:shadow-xl border border-gray-500/20",
      success: "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl border border-green-500/20",
      warning: "bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white shadow-lg hover:shadow-xl border border-orange-500/20",
      danger: "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg hover:shadow-xl border border-red-500/20",
      ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600"
    };

    const sizeClasses = {
      sm: "h-9 px-4 text-sm rounded-lg",
      md: "h-11 px-6 text-base rounded-xl",
      lg: "h-12 px-8 text-lg rounded-xl",
      xl: "h-14 px-10 text-xl rounded-2xl"
    };

    const iconSizeClasses = {
      sm: "w-4 h-4",
      md: "w-5 h-5", 
      lg: "w-6 h-6",
      xl: "w-7 h-7"
    };

    const isDisabled = disabled || loading;

    return (
      <motion.button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && "w-full",
          className
        )}
        disabled={isDisabled}
        whileHover={!isDisabled ? { 
          scale: 1.02,
          transition: { type: "spring", stiffness: 400, damping: 17 }
        } : {}}
        whileTap={!isDisabled ? { scale: 0.98 } : {}}
        {...props}
      >
        {/* Loading spinner */}
        {loading && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={cn(
                "border-2 border-white/30 border-t-white rounded-full",
                iconSizeClasses[size]
              )}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          className={cn(
            "flex items-center gap-2",
            loading && "opacity-0"
          )}
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {Icon && iconPosition === "left" && (
            <Icon className={iconSizeClasses[size]} />
          )}
          <span>{children}</span>
          {Icon && iconPosition === "right" && (
            <Icon className={iconSizeClasses[size]} />
          )}
        </motion.div>

        {/* Hover effect overlay */}
        <motion.div
          className="absolute inset-0 bg-white/10 rounded-inherit opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.button>
    );
  }
);

CTAButton.displayName = "CTAButton";

// Quick action button for secondary actions
const QuickActionButton = React.forwardRef<HTMLButtonElement, Omit<CTAButtonProps, 'variant' | 'size'> & { variant?: 'outline' | 'ghost' }>(
  ({ className, variant = "outline", children, ...props }, ref) => {
    const variantClasses = {
      outline: "border border-gray-300 dark:border-gray-600 bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300",
      ghost: "bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
    };

    return (
      <CTAButton
        ref={ref}
        className={cn(variantClasses[variant], "h-9 px-4 text-sm rounded-lg", className)}
        size="sm"
        {...props}
      >
        {children}
      </CTAButton>
    );
  }
);

QuickActionButton.displayName = "QuickActionButton";

export { CTAButton, QuickActionButton };
