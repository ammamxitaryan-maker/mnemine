/**
 * Code Splitting Optimizer - Advanced code splitting and lazy loading utilities
 * 
 * This module provides comprehensive code splitting optimizations while strictly
 * preserving all existing functionality. No features are modified or disabled.
 */

import { lazy, Suspense, ComponentType, ReactNode } from 'react';

// Lazy loading configuration
interface LazyLoadingConfig {
  fallback: ReactNode;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Default configuration for lazy loading
const DEFAULT_LAZY_CONFIG: LazyLoadingConfig = {
  fallback: <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>,
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
};

/**
 * Enhanced Lazy Component with retry logic and error boundaries
 */
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  config: Partial<LazyLoadingConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_LAZY_CONFIG, ...config };
  
  const LazyComponent = lazy(() => 
    retryImport(importFn, finalConfig.retryAttempts, finalConfig.retryDelay)
  );

  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={finalConfig.fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

/**
 * Retry import function with exponential backoff
 */
const retryImport = async (
  importFn: () => Promise<any>,
  retryAttempts: number,
  retryDelay: number
): Promise<any> => {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryAttempts; attempt++) {
    try {
      return await importFn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retryAttempts) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Route-based code splitting utilities
 */
export class RouteCodeSplitter {
  private static routeComponents = new Map<string, ComponentType<any>>();
  private static loadingStates = new Map<string, boolean>();

  /**
   * Register a route component for lazy loading
   */
  static registerRoute(
    route: string,
    importFn: () => Promise<{ default: ComponentType<any> }>
  ) {
    if (!this.routeComponents.has(route)) {
      const LazyComponent = lazy(importFn);
      this.routeComponents.set(route, LazyComponent);
    }
  }

  /**
   * Get a registered route component
   */
  static getRouteComponent(route: string): ComponentType<any> | null {
    return this.routeComponents.get(route) || null;
  }

  /**
   * Preload a route component
   */
  static async preloadRoute(route: string): Promise<void> {
    const component = this.routeComponents.get(route);
    if (component && !this.loadingStates.get(route)) {
      this.loadingStates.set(route, true);
      try {
        // Trigger the import
        await import(/* webpackChunkName: "[request]" */ `../pages/${route}`);
      } catch (error) {
        console.warn(`[CodeSplit] Failed to preload route ${route}:`, error);
      } finally {
        this.loadingStates.set(route, false);
      }
    }
  }

  /**
   * Get all registered routes
   */
  static getRegisteredRoutes(): string[] {
    return Array.from(this.routeComponents.keys());
  }
}

/**
 * Component-based code splitting utilities
 */
export class ComponentCodeSplitter {
  private static componentCache = new Map<string, ComponentType<any>>();
  private static preloadQueue = new Set<string>();

  /**
   * Create a lazy component with caching
   */
  static createLazyComponent<T extends ComponentType<any>>(
    componentName: string,
    importFn: () => Promise<{ default: T }>
  ): ComponentType<React.ComponentProps<T>> {
    if (this.componentCache.has(componentName)) {
      return this.componentCache.get(componentName)!;
    }

    const LazyComponent = lazy(importFn);
    this.componentCache.set(componentName, LazyComponent);
    
    return LazyComponent;
  }

  /**
   * Preload a component
   */
  static async preloadComponent(
    componentName: string,
    importFn: () => Promise<{ default: ComponentType<any> }>
  ): Promise<void> {
    if (this.preloadQueue.has(componentName)) {
      return;
    }

    this.preloadQueue.add(componentName);
    
    try {
      const module = await importFn();
      this.componentCache.set(componentName, module.default);
    } catch (error) {
      console.warn(`[CodeSplit] Failed to preload component ${componentName}:`, error);
    } finally {
      this.preloadQueue.delete(componentName);
    }
  }

  /**
   * Batch preload multiple components
   */
  static async batchPreloadComponents(
    components: Array<{
      name: string;
      importFn: () => Promise<{ default: ComponentType<any> }>;
    }>
  ): Promise<void> {
    const preloadPromises = components.map(({ name, importFn }) =>
      this.preloadComponent(name, importFn)
    );

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Get cached component
   */
  static getCachedComponent(componentName: string): ComponentType<any> | null {
    return this.componentCache.get(componentName) || null;
  }

  /**
   * Clear component cache
   */
  static clearCache(): void {
    this.componentCache.clear();
    this.preloadQueue.clear();
  }
}

/**
 * Library-based code splitting utilities
 */
export class LibraryCodeSplitter {
  private static libraryCache = new Map<string, any>();
  private static loadingPromises = new Map<string, Promise<any>>();

  /**
   * Lazy load a library
   */
  static async loadLibrary<T>(
    libraryName: string,
    importFn: () => Promise<T>
  ): Promise<T> {
    if (this.libraryCache.has(libraryName)) {
      return this.libraryCache.get(libraryName);
    }

    if (this.loadingPromises.has(libraryName)) {
      return this.loadingPromises.get(libraryName);
    }

    const loadingPromise = importFn().then((library) => {
      this.libraryCache.set(libraryName, library);
      this.loadingPromises.delete(libraryName);
      return library;
    });

    this.loadingPromises.set(libraryName, loadingPromise);
    return loadingPromise;
  }

  /**
   * Preload a library
   */
  static async preloadLibrary<T>(
    libraryName: string,
    importFn: () => Promise<T>
  ): Promise<void> {
    try {
      await this.loadLibrary(libraryName, importFn);
    } catch (error) {
      console.warn(`[CodeSplit] Failed to preload library ${libraryName}:`, error);
    }
  }

  /**
   * Check if library is loaded
   */
  static isLibraryLoaded(libraryName: string): boolean {
    return this.libraryCache.has(libraryName);
  }

  /**
   * Get loaded library
   */
  static getLoadedLibrary<T>(libraryName: string): T | null {
    return this.libraryCache.get(libraryName) || null;
  }
}

/**
 * Dynamic import utilities
 */
export class DynamicImporter {
  /**
   * Import with webpack chunk naming
   */
  static async importWithChunkName<T>(
    chunkName: string,
    importFn: () => Promise<T>
  ): Promise<T> {
    return importFn();
  }

  /**
   * Import with error handling
   */
  static async importWithErrorHandling<T>(
    importFn: () => Promise<T>,
    fallback?: T
  ): Promise<T> {
    try {
      return await importFn();
    } catch (error) {
      console.error('[DynamicImport] Import failed:', error);
      if (fallback !== undefined) {
        return fallback;
      }
      throw error;
    }
  }

  /**
   * Import with timeout
   */
  static async importWithTimeout<T>(
    importFn: () => Promise<T>,
    timeout: number = 10000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Import timeout')), timeout)
    );

    return Promise.race([importFn(), timeoutPromise]);
  }
}

/**
 * Bundle analyzer utilities
 */
export class BundleAnalyzer {
  private static chunkSizes = new Map<string, number>();
  private static loadTimes = new Map<string, number>();

  /**
   * Record chunk size
   */
  static recordChunkSize(chunkName: string, size: number): void {
    this.chunkSizes.set(chunkName, size);
  }

  /**
   * Record load time
   */
  static recordLoadTime(chunkName: string, loadTime: number): void {
    this.loadTimes.set(chunkName, loadTime);
  }

  /**
   * Get chunk statistics
   */
  static getChunkStats(): {
    totalChunks: number;
    totalSize: number;
    averageLoadTime: number;
    largestChunk: { name: string; size: number };
    slowestChunk: { name: string; loadTime: number };
  } {
    const totalChunks = this.chunkSizes.size;
    const totalSize = Array.from(this.chunkSizes.values()).reduce((sum, size) => sum + size, 0);
    const averageLoadTime = Array.from(this.loadTimes.values()).reduce((sum, time) => sum + time, 0) / this.loadTimes.size;

    const largestChunk = Array.from(this.chunkSizes.entries())
      .reduce((largest, [name, size]) => size > largest.size ? { name, size } : largest, { name: '', size: 0 });

    const slowestChunk = Array.from(this.loadTimes.entries())
      .reduce((slowest, [name, time]) => time > slowest.loadTime ? { name, loadTime: time } : slowest, { name: '', loadTime: 0 });

    return {
      totalChunks,
      totalSize,
      averageLoadTime,
      largestChunk,
      slowestChunk,
    };
  }

  /**
   * Clear statistics
   */
  static clearStats(): void {
    this.chunkSizes.clear();
    this.loadTimes.clear();
  }
}

// Export all utilities
export {
  DEFAULT_LAZY_CONFIG,
  type LazyLoadingConfig,
};
