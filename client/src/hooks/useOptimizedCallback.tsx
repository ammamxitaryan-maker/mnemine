import { useCallback, useRef, useMemo } from 'react';

// Optimized callback hook with dependency comparison
export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const ref = useRef<{ callback: T; deps: React.DependencyList }>();
  
  if (!ref.current || !areDepsEqual(ref.current.deps, deps)) {
    ref.current = { callback, deps };
  }
  
  return useCallback(ref.current.callback, deps);
}

// Optimized memo hook with custom comparison
export function useOptimizedMemo<T>(
  factory: () => T,
  deps: React.DependencyList,
  isEqual?: (prev: T, next: T) => boolean
): T {
  const ref = useRef<{ value: T; deps: React.DependencyList }>();
  
  if (!ref.current || !areDepsEqual(ref.current.deps, deps)) {
    ref.current = { value: factory(), deps };
  } else if (isEqual && !isEqual(ref.current.value, factory())) {
    ref.current.value = factory();
  }
  
  return ref.current.value;
}

// Debounced callback hook
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay, ...deps]) as T;
}

// Throttled callback hook
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const lastCallRef = useRef<number>(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay, ...deps]) as T;
}

// Stable reference hook
export function useStableRef<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef<T>(value);
  ref.current = value;
  return ref;
}

// Helper function to compare dependencies
function areDepsEqual(prev: React.DependencyList, next: React.DependencyList): boolean {
  if (prev.length !== next.length) return false;
  
  for (let i = 0; i < prev.length; i++) {
    if (prev[i] !== next[i]) return false;
  }
  
  return true;
}

// Hook for expensive computations with caching
export function useExpensiveComputation<T>(
  computeFn: () => T,
  deps: React.DependencyList,
  cacheKey?: string
): T {
  const cacheRef = useRef<Map<string, T>>(new Map());
  
  return useMemo(() => {
    const key = cacheKey || JSON.stringify(deps);
    
    if (cacheRef.current.has(key)) {
      return cacheRef.current.get(key)!;
    }
    
    const result = computeFn();
    cacheRef.current.set(key, result);
    
    // Limit cache size
    if (cacheRef.current.size > 100) {
      const firstKey = cacheRef.current.keys().next().value;
      cacheRef.current.delete(firstKey);
    }
    
    return result;
  }, deps);
}
