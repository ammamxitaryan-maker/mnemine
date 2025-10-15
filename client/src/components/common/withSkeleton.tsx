import React from 'react';

// HOC для оборачивания компонентов в скелетон
const withSkeleton = <P extends object>(
  Component: React.ComponentType<P>,
  SkeletonComponent: React.ComponentType<Record<string, unknown>>
) => {
  return (props: P & { loading?: boolean }) => {
    if (props.loading) {
      return <SkeletonComponent />;
    }
    return <Component {...(props as P)} />;
  };
};
