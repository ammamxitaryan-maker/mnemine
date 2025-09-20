import React, { Suspense, lazy, ComponentType, ReactNode, PropsWithoutRef, RefAttributes } from 'react';
import { LoadingSkeleton } from './LoadingSkeleton';

interface LazyComponentHOCProps {
  fallback?: React.ReactNode;
}

export function withLazyLoading<TBaseProps extends object>(
  importFunc: () => Promise<{ default: ComponentType<TBaseProps> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFunc);

  // The props that our HOC's WrappedComponent will receive.
  type WrappedComponentProps = TBaseProps & LazyComponentHOCProps;

  return function WrappedComponent(props: WrappedComponentProps) {
    const { fallback: propFallback, ...componentProps } = props;

    // Explicitly cast componentProps to the type expected by LazyComponent,
    // which includes intrinsic attributes like 'key' and 'ref'.
    const propsForLazyComponent = componentProps as React.ComponentProps<typeof LazyComponent>;

    return (
      <Suspense fallback={propFallback || fallback || <LoadingSkeleton />}>
        <LazyComponent {...propsForLazyComponent} />
      </Suspense>
    );
  };
}

// Preload function for critical components
export function preloadComponent(importFunc: () => Promise<any>) {
  return () => {
    importFunc();
  };
}

// Lazy load with retry on failure
export function withRetry<TBaseProps extends object>(
  importFunc: () => Promise<{ default: ComponentType<TBaseProps> }>,
  maxRetries = 3
) {
  return withLazyLoading<TBaseProps>(
    () => retryImport(importFunc, maxRetries),
    <div className="text-center p-4">
      <p className="text-gray-500">Loading component...</p>
    </div>
  );
}

async function retryImport(
  importFunc: () => Promise<any>,
  maxRetries: number
): Promise<any> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await importFunc();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  
  throw lastError!;
}

// Lazy load with error boundary
export function withErrorBoundary<TBaseProps extends object>(
  importFunc: () => Promise<{ default: ComponentType<TBaseProps> }>,
  fallback?: React.ReactNode
) {
  return withLazyLoading<TBaseProps>(
    importFunc,
    fallback
  );
}