/**
 * Централизованная конфигурация админ панели
 */

// Конфигурация админов
export const ADMIN_CONFIG = {
  // Telegram ID админов
  TELEGRAM_IDS: import.meta.env.VITE_ADMIN_TELEGRAM_IDS
    ? import.meta.env.VITE_ADMIN_TELEGRAM_IDS.split(',').map((id: string) => id.trim())
    : ['6760298907'],
  
  // Пароль для доступа к админ панели
  PASSWORD: 'nemesisN3M3616',
  
  // Настройки сессии
  SESSION: {
    STORAGE_KEY: 'admin_password_verified',
    TIMEOUT: 24 * 60 * 60 * 1000, // 24 часа в миллисекундах
  },
  
  // Настройки API
  API: {
    TIMEOUT: 30000, // 30 секунд
    RETRY_ATTEMPTS: 3,
    CACHE_DURATION: 5 * 60 * 1000, // 5 минут
  },
  
  // Настройки UI
  UI: {
    THEME: 'dark',
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 500,
    ITEMS_PER_PAGE: 20,
  },
  
  // Настройки безопасности
  SECURITY: {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 минут
    PASSWORD_MIN_LENGTH: 8,
  }
} as const;

// Конфигурация навигации
export const ADMIN_NAVIGATION = {
  MAIN_ROUTES: [
    {
      path: '/admin',
      label: 'Dashboard',
      icon: 'Home',
      description: 'Overview',
      order: 1,
    },
    {
      path: '/admin/users',
      label: 'Users',
      icon: 'Users',
      description: 'User management',
      order: 2,
    },
    {
      path: '/admin/transactions',
      label: 'Transactions',
      icon: 'CreditCard',
      description: 'Payments',
      order: 3,
    },
    {
      path: '/admin/analytics',
      label: 'Analytics',
      icon: 'BarChart3',
      description: 'Metrics',
      order: 4,
    },
    {
      path: '/admin/lottery',
      label: 'Lottery',
      icon: 'Ticket',
      description: 'Lottery',
      order: 5,
    },
    {
      path: '/admin/notifications',
      label: 'Notifications',
      icon: 'Bell',
      description: 'Alerts',
      order: 6,
    },
    {
      path: '/admin/processing',
      label: 'Processing',
      icon: 'Cog',
      description: 'Slots',
      order: 7,
    },
    {
      path: '/admin/exchange',
      label: 'Exchange',
      icon: 'TrendingUp',
      description: 'Rates',
      order: 8,
    },
    {
      path: '/admin/logs',
      label: 'Logs',
      icon: 'FileText',
      description: 'System logs',
      order: 9,
    },
    {
      path: '/admin/settings',
      label: 'Settings',
      icon: 'Settings',
      description: 'Config',
      order: 10,
    },
    {
      path: '/admin/staff',
      label: 'Staff',
      icon: 'Shield',
      description: 'Staff',
      order: 11,
    },
  ],
  
  LEGACY_ROUTES: [
    {
      path: '/admin-panel',
      label: 'Legacy Panel',
      icon: 'Settings',
      description: 'Old admin panel',
      order: 99,
    },
    {
      path: '/admin/dashboard',
      label: 'Dashboard Compact',
      icon: 'Home',
      description: 'Compact dashboard',
      order: 98,
    },
  ],
} as const;

// Конфигурация дашборда
export const DASHBOARD_CONFIG = {
  WIDGETS: {
    USERS: {
      title: 'Users',
      icon: 'Users',
      color: 'blue',
      refreshInterval: 30000, // 30 секунд
    },
    FINANCES: {
      title: 'Finances',
      icon: 'DollarSign',
      color: 'green',
      refreshInterval: 60000, // 1 минута
    },
    ACTIVITY: {
      title: 'Activity',
      icon: 'Activity',
      color: 'purple',
      refreshInterval: 15000, // 15 секунд
    },
    SYSTEM: {
      title: 'System',
      icon: 'Monitor',
      color: 'orange',
      refreshInterval: 10000, // 10 секунд
    },
  },
  
  LAYOUTS: {
    ULTRA_COMPACT: 'ultra-compact',
    MINIMAL: 'minimal',
    FULL: 'full',
  },
} as const;

// Конфигурация таблиц
export const TABLE_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  SORT_DIRECTIONS: ['asc', 'desc'] as const,
  FILTER_DEBOUNCE: 500,
} as const;

// Конфигурация уведомлений
export const NOTIFICATION_CONFIG = {
  TYPES: {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
  },
  DURATION: {
    SUCCESS: 3000,
    ERROR: 5000,
    WARNING: 4000,
    INFO: 3000,
  },
  POSITION: 'top-right',
} as const;

// Экспорт типов
export type AdminConfig = typeof ADMIN_CONFIG;
export type NavigationItem = typeof ADMIN_NAVIGATION.MAIN_ROUTES[0];
export type DashboardWidget = typeof DASHBOARD_CONFIG.WIDGETS[keyof typeof DASHBOARD_CONFIG.WIDGETS];
export type NotificationType = keyof typeof NOTIFICATION_CONFIG.TYPES;
