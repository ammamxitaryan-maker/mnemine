import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string | null;
  isLoading: boolean;
  unit?: string;
  colorClass?: string;
}

export const StatCard = ({ icon: Icon, label, value, isLoading, unit, colorClass = 'text-purple-400' }: StatCardProps) => {
  return (
    <Card className="bg-gray-900/80 border-primary h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
        <CardTitle className="text-xs font-medium text-gray-400">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClass}`} />
      </CardHeader>
      <CardContent className="p-3 pt-0">
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <div className="text-xl font-bold text-white">
            {value !== null && value !== undefined ? `${typeof value === 'number' ? value.toLocaleString() : value} ${unit || ''}`.trim() : '-'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};