/**
 * Хук для ленивой загрузки данных
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface LazyLoadingOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  delay?: number;
}

/**
 * Хук для ленивой загрузки при появлении элемента в viewport
 */
export const useLazyLoading = <T>(
  fetcher: () => Promise<T>,
  options: LazyLoadingOptions = {}
) => {
  const {
    threshold = 0.1,
    rootMargin = '100px',
    triggerOnce = true,
    delay = 0,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const { ref, inView } = useInView({
    threshold,
    rootMargin,
    triggerOnce,
  });

  const fetchData = useCallback(async () => {
    if (hasLoaded && triggerOnce) return;
    
    setLoading(true);
    setError(null);

    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await fetcher();
      setData(result);
      setHasLoaded(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, delay, hasLoaded, triggerOnce]);

  useEffect(() => {
    if (inView && !hasLoaded) {
      fetchData();
    }
  }, [inView, fetchData, hasLoaded]);

  const retry = useCallback(() => {
    setError(null);
    setHasLoaded(false);
    fetchData();
  }, [fetchData]);

  return {
    ref,
    data,
    loading,
    error,
    inView,
    retry,
    hasLoaded,
  };
};

/**
 * Хук для бесконечной прокрутки
 */
export const useInfiniteScroll = <T>(
  fetcher: (page: number) => Promise<{ data: T[]; hasMore: boolean }>,
  options: {
    initialPage?: number;
    threshold?: number;
    rootMargin?: string;
  } = {}
) => {
  const { initialPage = 1, threshold = 0.1, rootMargin = '100px' } = options;
  
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const { ref, inView } = useInView({
    threshold,
    rootMargin,
  });

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher(page);
      setData(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, page, loading, hasMore]);

  useEffect(() => {
    if (inView && hasMore) {
      loadMore();
    }
  }, [inView, loadMore, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
  }, [initialPage]);

  return {
    ref,
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
  };
};

/**
 * Хук для дебаунсированной загрузки
 */
export const useDebouncedLoading = <T>(
  fetcher: (query: string) => Promise<T>,
  delay: number = 500
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedFetch = useCallback(async (searchQuery: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setData(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await fetcher(searchQuery);
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }, delay);
  }, [fetcher, delay]);

  const search = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    debouncedFetch(searchQuery);
  }, [debouncedFetch]);

  const clear = useCallback(() => {
    setQuery('');
    setData(null);
    setError(null);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    loading,
    error,
    query,
    search,
    clear,
  };
};

/**
 * Хук для предзагрузки данных
 */
export const usePreload = <T>(
  fetcher: () => Promise<T>,
  options: {
    enabled?: boolean;
    delay?: number;
  } = {}
) => {
  const { enabled = true, delay = 0 } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasPreloaded, setHasPreloaded] = useState(false);

  const preload = useCallback(async () => {
    if (hasPreloaded) return;

    setLoading(true);
    setError(null);

    try {
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const result = await fetcher();
      setData(result);
      setHasPreloaded(true);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, delay, hasPreloaded]);

  useEffect(() => {
    if (enabled && !hasPreloaded) {
      preload();
    }
  }, [enabled, preload, hasPreloaded]);

  const retry = useCallback(() => {
    setError(null);
    setHasPreloaded(false);
    preload();
  }, [preload]);

  return {
    data,
    loading,
    error,
    hasPreloaded,
    retry,
  };
};

/**
 * Хук для кэшированной ленивой загрузки
 */
export const useCachedLazyLoading = <T>(
  key: string,
  fetcher: () => Promise<T>,
  options: LazyLoadingOptions & { cacheTTL?: number } = {}
) => {
  const { cacheTTL = 5 * 60 * 1000, ...lazyOptions } = options;
  
  const [cachedData, setCachedData] = useState<T | null>(() => {
    try {
      const cached = localStorage.getItem(`lazy_cache_${key}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < cacheTTL) {
          return data;
        }
      }
    } catch {
      // Игнорируем ошибки парсинга
    }
    return null;
  });

  const lazyResult = useLazyLoading(async () => {
    if (cachedData) {
      return cachedData;
    }
    return await fetcher();
  }, lazyOptions);

  // Сохраняем в кэш при успешной загрузке
  useEffect(() => {
    if (lazyResult.data && !cachedData) {
      try {
        localStorage.setItem(`lazy_cache_${key}`, JSON.stringify({
          data: lazyResult.data,
          timestamp: Date.now(),
        }));
        setCachedData(lazyResult.data);
      } catch {
        // Игнорируем ошибки сохранения
      }
    }
  }, [lazyResult.data, cachedData, key]);

  return {
    ...lazyResult,
    data: cachedData || lazyResult.data,
  };
};
