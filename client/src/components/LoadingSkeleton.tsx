import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
      <div className="h-4 bg-gray-300 rounded w-1/2"></div>
    </div>
  );
};

export const CardSkeleton = () => {
  return (
    <Card className="bg-white/90 backdrop-blur-sm border-blue-300 shadow-lg">
      <CardHeader>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-300 rounded"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
          <div className="h-4 bg-gray-300 rounded w-4/6"></div>
        </div>
      </CardContent>
    </Card>
  );
};

export const BalanceSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
      <div className="h-8 bg-gray-300 rounded w-1/2"></div>
    </div>
  );
};

export const ButtonSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-gray-300 rounded"></div>
    </div>
  );
};
