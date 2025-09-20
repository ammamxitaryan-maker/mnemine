import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DashboardLinkCardProps {
  to: string;
  icon: React.ElementType;
  title: string;
  dataHook?: () => { data: any; isLoading: boolean; error: Error | null };
  processData?: (data: any) => number | string;
  unit?: string;
  isNotification?: boolean;
}

export const DashboardLinkCard = ({ to, icon: Icon, title, dataHook, processData, unit, isNotification = false }: DashboardLinkCardProps) => {
  const { data, isLoading, error } = dataHook ? dataHook() : { data: null, isLoading: false, error: null };

  let displayData: number | string | null = null;
  if (data && processData) {
    displayData = processData(data);
  }

  const showBadge = isNotification && !isLoading && !error && displayData && (typeof displayData === 'number' ? displayData > 0 : true);
  const showText = !isNotification && !isLoading && !error && displayData !== null;

  return (
    <Link to={to} className="block h-full">
      <Card className="relative bg-gray-900/80 backdrop-blur-sm border-gray-700 hover:bg-gray-800/80 transition-transform duration-200 hover:scale-105 active:scale-100 h-full">
        {showBadge && (
          <Badge className="absolute top-2 right-2 bg-accent text-white animate-pulse">
            {displayData}
          </Badge>
        )}
        <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
          <Icon className="w-8 h-8 mb-2 text-secondary" />
          <p className="font-semibold text-white">{title}</p>
          {isLoading ? (
            <Loader2 className="w-4 h-4 mt-1 animate-spin" />
          ) : error ? (
            <AlertTriangle className="w-4 h-4 mt-1 text-destructive" />
          ) : showText ? (
            <p className="text-sm text-gray-400 mt-1">
              {displayData} {unit}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </Link>
  );
};