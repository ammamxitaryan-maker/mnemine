/**
 * Улучшенные карточки для админ панели
 */

import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminCardProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  error?: string;
  actions?: ReactNode;
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    color?: string;
  };
  onClick?: () => void;
  hover?: boolean;
}

export const AdminCard = ({
  title,
  description,
  children,
  className,
  variant = 'default',
  size = 'md',
  loading = false,
  error,
  actions,
  badge,
  onClick,
  hover = false,
}: AdminCardProps) => {
  const baseClasses = 'transition-all duration-200';
  
  const variantClasses = {
    default: 'bg-gray-900 border-gray-700',
    elevated: 'bg-gray-900 border-gray-700 shadow-lg shadow-gray-900/20',
    outlined: 'bg-transparent border-gray-600',
    glass: 'bg-gray-900/50 border-gray-700/50 backdrop-blur-sm',
  };

  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const hoverClasses = hover ? 'hover:border-gray-600 hover:shadow-md' : '';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <Card
      className={cn(
        baseClasses,
        variantClasses[variant],
        hoverClasses,
        clickableClasses,
        className
      )}
      onClick={onClick}
    >
      {(title || description || actions || badge) && (
        <CardHeader className={sizeClasses[size]}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {title && (
                <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                  {title}
                  {badge && (
                    <Badge 
                      variant={badge.variant} 
                      className={badge.color}
                    >
                      {badge.text}
                    </Badge>
                  )}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-gray-400 mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">
                {actions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={sizeClasses[size]}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400 mb-2">⚠️</div>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Карточка статистики
 */
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
  };
  icon?: ReactNode;
  color?: string;
  onClick?: () => void;
  loading?: boolean;
}

export const StatCard = ({
  title,
  value,
  change,
  icon,
  color = 'bg-blue-600',
  onClick,
  loading = false,
}: StatCardProps) => {
  const getChangeColor = () => {
    switch (change?.type) {
      case 'increase': return 'text-green-400';
      case 'decrease': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getChangeIcon = () => {
    switch (change?.type) {
      case 'increase': return '↗';
      case 'decrease': return '↘';
      default: return '→';
    }
  };

  return (
    <AdminCard
      variant="elevated"
      hover
      onClick={onClick}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">
            {loading ? (
              <div className="h-8 w-20 bg-gray-700 rounded animate-pulse" />
            ) : (
              value
            )}
          </p>
          {change && !loading && (
            <div className={`flex items-center text-xs mt-1 ${getChangeColor()}`}>
              <span className="mr-1">{getChangeIcon()}</span>
              <span>{Math.abs(change.value)}%</span>
              <span className="ml-1 text-gray-500">vs last period</span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${color}`}>
            {icon}
          </div>
        )}
      </div>
    </AdminCard>
  );
};

/**
 * Карточка с действиями
 */
interface ActionCardProps {
  title: string;
  description?: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
    icon?: ReactNode;
  }>;
  children?: ReactNode;
  className?: string;
}

export const ActionCard = ({
  title,
  description,
  actions,
  children,
  className,
}: ActionCardProps) => {
  return (
    <AdminCard
      title={title}
      description={description}
      className={className}
      actions={
        <div className="flex gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={action.onClick}
              className="flex items-center gap-1"
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      }
    >
      {children}
    </AdminCard>
  );
};

/**
 * Карточка с прогрессом
 */
interface ProgressCardProps {
  title: string;
  description?: string;
  progress: number;
  max?: number;
  color?: string;
  showPercentage?: boolean;
  children?: ReactNode;
}

export const ProgressCard = ({
  title,
  description,
  progress,
  max = 100,
  color = 'bg-purple-600',
  showPercentage = true,
  children,
}: ProgressCardProps) => {
  const percentage = Math.min((progress / max) * 100, 100);

  return (
    <AdminCard title={title} description={description}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-300">Progress</span>
          {showPercentage && (
            <span className="text-sm font-medium text-white">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${color}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        {children}
      </div>
    </AdminCard>
  );
};
