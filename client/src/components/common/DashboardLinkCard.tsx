import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DashboardLinkCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  displayData?: number | string | null;
  isLoading?: boolean;
  error?: Error | null;
  unit?: string;
  isNotification?: boolean;
}

export const DashboardLinkCard = ({ to, icon: Icon, title, displayData, isLoading = false, error = null, unit, isNotification = false }: DashboardLinkCardProps) => {
  const showBadge = isNotification && !isLoading && !error && displayData && (typeof displayData === 'number' ? displayData > 0 : true);
  const showText = !isNotification && !isLoading && !error && displayData !== null && displayData !== undefined;

  return (
    <Link to={to} className="block h-full group relative">
      <Card className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 hover:border-slate-600/80 transition-all duration-300 hover:scale-105 active:scale-100 h-full shadow-lg hover:shadow-xl hover:shadow-slate-900/30 backdrop-blur-sm overflow-hidden">
        {showBadge && (
          <Badge className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-purple-500 text-white animate-pulse shadow-lg z-20 text-xs px-1.5 py-0.5">
            {displayData}
          </Badge>
        )}
        <CardContent className="p-2 sm:p-3 flex flex-col items-center justify-center text-center h-full relative z-10">
          <div className="p-1 sm:p-1.5 bg-emerald-400/20 rounded-full mb-1 sm:mb-1.5 group-hover:bg-emerald-400/30 transition-colors duration-200">
            <Icon className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
          </div>
          <p className="font-semibold text-white text-xs sm:text-sm mb-1 leading-tight">{title}</p>
          {isLoading ? (
            <div className="flex items-center gap-1">
              <Loader2 className="w-2.5 h-2.5 animate-spin text-emerald-400" />
              <span className="text-xs text-gray-400">Loading...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-1">
              <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
              <span className="text-xs text-red-400">Error</span>
            </div>
          ) : showText ? (
            <div className="text-center">
              <p className="text-xs font-bold text-white">
                {displayData} <span className="text-xs text-gray-300">{unit}</span>
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
};