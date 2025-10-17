/**
 * Улучшенная навигация для админ панели
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminNavigation } from '@/hooks/useAdminNavigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  Home, 
  Users, 
  CreditCard, 
  BarChart3, 
  Ticket, 
  Bell, 
  Cog, 
  TrendingUp, 
  FileText, 
  Settings, 
  Shield,
  Menu,
  X
} from 'lucide-react';

// Маппинг иконок
const iconMap = {
  Home,
  Users,
  CreditCard,
  BarChart3,
  Ticket,
  Bell,
  Cog,
  TrendingUp,
  FileText,
  Settings,
  Shield,
};

interface AdminNavigationProps {
  variant?: 'sidebar' | 'topbar' | 'compact';
  showLabels?: boolean;
  className?: string;
}

export const AdminNavigation = ({ 
  variant = 'sidebar', 
  showLabels = true,
  className = '' 
}: AdminNavigationProps) => {
  const { allRoutes, currentRoute, goTo, isActiveRoute, getAdjacentRoutes } = useAdminNavigation();
  const [isExpanded, setIsExpanded] = useState(variant === 'sidebar');

  const renderIcon = (iconName: string, isActive: boolean = false) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap];
    if (!IconComponent) return null;
    
    return (
      <IconComponent 
        className={`h-4 w-4 ${isActive ? 'text-purple-400' : 'text-gray-400'}`} 
      />
    );
  };

  const renderNavItem = (route: any) => {
    const isActive = isActiveRoute(route.path);
    
    return (
      <Button
        key={route.path}
        variant={isActive ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => goTo(route.path)}
        className={`w-full justify-start ${
          isActive 
            ? 'bg-purple-600/20 text-purple-400 border-purple-600/30' 
            : 'text-gray-300 hover:text-white hover:bg-gray-700/50'
        } ${variant === 'compact' ? 'px-2' : 'px-3'}`}
      >
        {renderIcon(route.icon, isActive)}
        {showLabels && (
          <span className={`ml-2 ${variant === 'compact' ? 'text-xs' : 'text-sm'}`}>
            {route.label}
          </span>
        )}
        {isActive && variant !== 'compact' && (
          <Badge variant="secondary" className="ml-auto text-xs">
            Active
          </Badge>
        )}
      </Button>
    );
  };

  if (variant === 'topbar') {
    return (
      <div className={`flex items-center space-x-1 overflow-x-auto ${className}`}>
        {allRoutes.map(route => (
          <div key={route.path} className="flex-shrink-0">
            {renderNavItem(route)}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex flex-col space-y-1 ${className}`}>
        {allRoutes.slice(0, 6).map(route => renderNavItem(route))}
      </div>
    );
  }

  // Sidebar variant
  return (
    <Card className={`bg-gray-900 border-gray-700 ${className}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Navigation</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 p-0 text-gray-400 hover:text-white"
          >
            {isExpanded ? <X className="h-3 w-3" /> : <Menu className="h-3 w-3" />}
          </Button>
        </div>
        
        {isExpanded && (
          <div className="space-y-1">
            {allRoutes.map(route => renderNavItem(route))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Компонент хлебных крошек
export const AdminBreadcrumbs = ({ className = '' }: { className?: string }) => {
  const { breadcrumbs, goTo } = useAdminNavigation();

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-3 w-3 text-gray-500 mx-1" />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => goTo(crumb.path)}
            className={`text-xs ${
              index === breadcrumbs.length - 1
                ? 'text-white font-medium'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {crumb.label}
          </Button>
        </div>
      ))}
    </nav>
  );
};

// Компонент навигации между страницами
export const AdminPageNavigation = ({ className = '' }: { className?: string }) => {
  const { currentRoute, getAdjacentRoutes, goTo } = useAdminNavigation();
  const { previous, next } = getAdjacentRoutes();

  if (!previous && !next) return null;

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => previous && goTo(previous.path)}
        disabled={!previous}
        className="flex items-center space-x-1"
      >
        <ChevronLeft className="h-3 w-3" />
        <span className="text-xs">
          {previous ? previous.label : 'Previous'}
        </span>
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={() => next && goTo(next.path)}
        disabled={!next}
        className="flex items-center space-x-1"
      >
        <span className="text-xs">
          {next ? next.label : 'Next'}
        </span>
        <ChevronRight className="h-3 w-3" />
      </Button>
    </div>
  );
};
