import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  onClick?: () => void;
  loading?: boolean;
}

export const DashboardWidget: React.FC<DashboardWidgetProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  onClick,
  loading = false
}) => {
  const colorClasses = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
    purple: 'text-purple-400',
    gray: 'text-gray-400'
  };

  const bgColorClasses = {
    blue: 'bg-blue-600/10',
    green: 'bg-green-600/10',
    yellow: 'bg-yellow-600/10',
    red: 'bg-red-600/10',
    purple: 'bg-purple-600/10',
    gray: 'bg-gray-600/10'
  };

  return (
    <Card 
      className={`bg-gray-900 border-gray-700 hover:border-gray-600 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-gray-800/50' : ''
      }`}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-300">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${bgColorClasses[color]}`}>
          <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {loading ? (
            <div className="h-8 bg-gray-800 rounded animate-pulse"></div>
          ) : (
            <div className="text-2xl font-bold text-white">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          )}
          
          {subtitle && (
            <p className="text-xs text-gray-400">
              {subtitle}
            </p>
          )}
          
          {trend && !loading && (
            <div className="flex items-center space-x-1">
              <span className={`text-xs font-medium ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">
                {trend.label}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
