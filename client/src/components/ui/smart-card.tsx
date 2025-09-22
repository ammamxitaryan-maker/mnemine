"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface SmartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "minimal" | "elevated" | "interactive";
  size?: "sm" | "md" | "lg" | "xl";
  hover?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

const SmartCard = React.forwardRef<HTMLDivElement, SmartCardProps>(
  ({ 
    className, 
    variant = "default", 
    size = "md", 
    hover = true,
    icon: Icon,
    iconColor = "from-blue-500 to-indigo-600",
    title,
    subtitle,
    children,
    ...props 
  }, ref) => {
    const baseClasses = "transition-all duration-300 ease-in-out";
    
    const variantClasses = {
      default: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm",
      glass: "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg",
      minimal: "bg-transparent border border-gray-200 dark:border-gray-700",
      elevated: "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl",
      interactive: "bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl cursor-pointer"
    };

    const sizeClasses = {
      sm: "p-4 rounded-lg",
      md: "p-6 rounded-xl", 
      lg: "p-8 rounded-2xl",
      xl: "p-10 rounded-3xl"
    };

    const hoverClasses = hover ? "hover:scale-[1.02] hover:-translate-y-1" : "";

    return (
      <motion.div
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          hoverClasses,
          className
        )}
        whileHover={hover ? { 
          scale: 1.02, 
          y: -4,
          transition: { type: "spring", stiffness: 300, damping: 20 }
        } : {}}
        whileTap={hover ? { scale: 0.98 } : {}}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        {...props}
      >
        {(title || subtitle || Icon) && (
          <div className="flex items-start gap-4 mb-4">
            {Icon && (
              <motion.div 
                className={cn(
                  "p-3 rounded-xl bg-gradient-to-br",
                  iconColor
                )}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Icon className="w-6 h-6 text-white" />
              </motion.div>
            )}
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        <div className="w-full">
          {children}
        </div>
      </motion.div>
    );
  }
);

SmartCard.displayName = "SmartCard";

// Compact version for lists and grids
const SmartCardCompact = React.forwardRef<HTMLDivElement, Omit<SmartCardProps, 'size'> & { size?: 'xs' | 'sm' }>(
  ({ className, variant = "glass", size = "xs", children, ...props }, ref) => {
    const sizeClasses = {
      xs: "p-3 rounded-lg",
      sm: "p-4 rounded-lg"
    };

    return (
      <SmartCard
        ref={ref}
        className={cn(sizeClasses[size], className)}
        variant={variant}
        hover={false}
        {...props}
      >
        {children}
      </SmartCard>
    );
  }
);

SmartCardCompact.displayName = "SmartCardCompact";

export { SmartCard, SmartCardCompact };
