/**
 * Система кэширования для админ панели
 */

import { ADMIN_CONFIG } from '@/config/adminConfig';

// Типы для кэша
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  key: string;
}

interface CacheOptions {
  ttl?: number; // Time to live в миллисекундах
  maxSize?: number; // Максимальный размер кэша
  persist?: boolean; // Сохранять в localStorage
}

class AdminCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize: number;
  private defaultTTL: number;

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100;
    this.defaultTTL = options.ttl || ADMIN_CONFIG.API.CACHE_DURATION;
  }

  /**
   * Получить данные из кэша
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Проверяем, не истек ли кэш
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Сохранить данные в кэш
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL;
    const now = Date.now();

    // Если кэш переполнен, удаляем самые старые элементы
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl,
      key,
    };

    this.cache.set(key, item);

    // Сохраняем в localStorage если нужно
    if (options.persist) {
      try {
        localStorage.setItem(`admin_cache_${key}`, JSON.stringify(item));
      } catch (error) {
        console.warn('[CACHE] Failed to persist to localStorage:', error);
      }
    }
  }

  /**
   * Удалить элемент из кэша
   */
  delete(key: string): void {
    this.cache.delete(key);
    localStorage.removeItem(`admin_cache_${key}`);
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    this.cache.clear();
    
    // Очищаем localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('admin_cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  /**
   * Проверить, существует ли ключ в кэше
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return item ? Date.now() <= item.expiresAt : false;
  }

  /**
   * Получить размер кэша
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Получить статистику кэша
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    oldestItem: number;
    newestItem: number;
  } {
    const items = Array.from(this.cache.values());
    const timestamps = items.map(item => item.timestamp);
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Implement hit rate tracking
      oldestItem: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestItem: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * Очистка устаревших элементов
   */
  private cleanup(): void {
    const now = Date.now();
    const items = Array.from(this.cache.entries());
    
    // Сортируем по времени создания (старые сначала)
    items.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Удаляем 25% самых старых элементов
    const toDelete = Math.ceil(items.length * 0.25);
    for (let i = 0; i < toDelete; i++) {
      this.cache.delete(items[i][0]);
    }
  }

  /**
   * Загрузить кэш из localStorage
   */
  loadFromStorage(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('admin_cache_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '');
          if (item && Date.now() <= item.expiresAt) {
            this.cache.set(item.key, item);
          } else {
            localStorage.removeItem(key);
          }
        } catch (error) {
          localStorage.removeItem(key);
        }
      }
    });
  }
}

// Создаем глобальный экземпляр кэша
export const adminCache = new AdminCache({
  ttl: ADMIN_CONFIG.API.CACHE_DURATION,
  maxSize: 200,
  persist: true,
});

// Загружаем кэш из localStorage при инициализации
adminCache.loadFromStorage();

/**
 * Хук для работы с кэшем
 */
export const useCache = () => {
  const get = <T>(key: string): T | null => {
    return adminCache.get<T>(key);
  };

  const set = <T>(key: string, data: T, options?: CacheOptions): void => {
    adminCache.set(key, data, options);
  };

  const remove = (key: string): void => {
    adminCache.delete(key);
  };

  const clear = (): void => {
    adminCache.clear();
  };

  const has = (key: string): boolean => {
    return adminCache.has(key);
  };

  const getStats = () => {
    return adminCache.getStats();
  };

  return {
    get,
    set,
    remove,
    clear,
    has,
    getStats,
  };
};

/**
 * Декоратор для кэширования функций
 */
export const withCache = <T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options?: CacheOptions
): T => {
  return ((...args: Parameters<T>) => {
    const key = keyGenerator(...args);
    const cached = adminCache.get(key);
    
    if (cached !== null) {
      return Promise.resolve(cached);
    }

    const result = fn(...args);
    
    if (result instanceof Promise) {
      return result.then(data => {
        adminCache.set(key, data, options);
        return data;
      });
    } else {
      adminCache.set(key, result, options);
      return result;
    }
  }) as T;
};

/**
 * Утилиты для работы с кэшем
 */
export const cacheUtils = {
  /**
   * Создать ключ кэша
   */
  createKey: (prefix: string, ...parts: (string | number)[]): string => {
    return `${prefix}:${parts.join(':')}`;
  },

  /**
   * Инвалидировать кэш по паттерну
   */
  invalidatePattern: (pattern: string): void => {
    const regex = new RegExp(pattern);
    const keys = Array.from(adminCache['cache'].keys());
    
    keys.forEach(key => {
      if (regex.test(key)) {
        adminCache.delete(key);
      }
    });
  },

  /**
   * Получить все ключи кэша
   */
  getAllKeys: (): string[] => {
    return Array.from(adminCache['cache'].keys());
  },

  /**
   * Предзагрузить данные
   */
  preload: async <T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> => {
    const cached = adminCache.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    adminCache.set(key, data, options);
    return data;
  },
};
