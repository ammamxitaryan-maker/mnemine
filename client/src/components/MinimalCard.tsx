import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MinimalCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export const MinimalCard: React.FC<MinimalCardProps> = ({
  children,
  className,
  onClick,
  hover = true,
  padding = 'md',
}) => {
  const CardComponent = onClick ? motion.div : 'div';
  const cardProps = onClick ? {
    whileHover: hover ? { scale: 1.02, y: -2 } : {},
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 300, damping: 20 },
    onClick,
    className: "cursor-pointer"
  } : {};

  return (
    <CardComponent {...cardProps}>
      <Card 
        className={cn(
          'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/50 dark:border-gray-700/50',
          'shadow-sm hover:shadow-md transition-all duration-300',
          paddingStyles[padding],
          className
        )}
      >
        <CardContent className={cn('p-0', paddingStyles[padding])}>
          {children}
        </CardContent>
      </Card>
    </CardComponent>
  );
};
