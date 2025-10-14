import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  rounded?: boolean;
  animate?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '20px',
  className = '',
  rounded = false,
  animate = true
}) => {
  const baseClasses = 'bg-gray-200';
  const roundedClasses = rounded ? 'rounded-full' : 'rounded';
  const animateClasses = animate ? 'animate-pulse' : '';
  
  return (
    <div
      className={`${baseClasses} ${roundedClasses} ${animateClasses} ${className}`}
      style={{ width, height }}
    />
  );
};

// Специализированные скелетоны для разных компонентов
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 border rounded-lg ${className}`}>
    <div className="flex items-center space-x-4">
      <Skeleton width={40} height={40} rounded />
      <div className="flex-1 space-y-2">
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={14} />
      </div>
    </div>
    <div className="mt-4 space-y-2">
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; className?: string }> = ({ 
  rows = 5, 
  className = '' 
}) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <Skeleton width={40} height={40} rounded />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={14} />
        </div>
        <Skeleton width={80} height={32} />
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ 
  items = 3, 
  className = '' 
}) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: items }).map((_, index) => (
      <div key={index} className="flex items-center space-x-3">
        <Skeleton width={24} height={24} rounded />
        <div className="flex-1">
          <Skeleton width="80%" height={16} />
        </div>
        <Skeleton width={60} height={20} />
      </div>
    ))}
  </div>
);

export const SkeletonChart: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`p-4 ${className}`}>
    <div className="mb-4">
      <Skeleton width="40%" height={20} />
      <Skeleton width="60%" height={16} className="mt-2" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center space-x-3">
          <Skeleton width={60} height={16} />
          <Skeleton width={`${Math.random() * 40 + 20}%`} height={20} />
        </div>
      ))}
    </div>
  </div>
);

// HOC для оборачивания компонентов в скелетон
export const withSkeleton = <P extends object>(
  Component: React.ComponentType<P>,
  SkeletonComponent: React.ComponentType<Record<string, unknown>>
) => {
  return (props: P & { loading?: boolean }) => {
    if (props.loading) {
      return <SkeletonComponent />;
    }
    return <Component {...props} />;
  };
};
