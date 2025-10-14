/**
 * Centralized type exports for Mnemine client
 * Provides all types in a single import point
 */

// API types
export * from './api.js';

// Telegram types
export * from './telegram.d.js';

// Error types
export * from './errors.js';

// Re-export commonly used types for convenience
export type {
  ApiResponse,
  UserProfile,
  WalletInfo,
  MiningSlotInfo,
  TransactionInfo,
  TransactionType,
  TransactionStatus,
  WithdrawalRequest,
  WithdrawalInfo,
  LotteryInfo,
  LotteryTicketInfo,
  SwapRequest,
  SwapResponse,
  TaskInfo,
  ActivityLogInfo,
  ActivityLogType,
  ExchangeRateInfo,
  NotificationInfo,
  DashboardStats,
  LeaderboardEntry,
  LeaderboardResponse,
  ApiError,
} from './api.js';

export type {
  AuthenticatedUser,
  BackendUser,
  TelegramWebAppUser,
  TelegramWebApp,
} from './telegram.d.js';

export type {
  ApiError as ClientApiError,
  isApiError,
  getErrorMessage,
} from './errors.js';

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

// React-specific types
export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Hook types
export interface UseApiResult<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UsePaginatedApiResult<T> extends UseApiResult<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null;
  loadMore: () => Promise<void>;
  goToPage: (page: number) => Promise<void>;
}

// Form types
export interface FormField<T = unknown> {
  value: T;
  error: string | null;
  touched: boolean;
  required: boolean;
}

export interface FormState<T extends Record<string, unknown>> {
  fields: { [K in keyof T]: FormField<T[K]> };
  isValid: boolean;
  isSubmitting: boolean;
  submitError: string | null;
}

// Theme types
export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Localization types
export interface Locale {
  code: string;
  name: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}

export interface Translation {
  [key: string]: string | Translation;
}

// WebSocket types (client-side)
export interface WebSocketMessage<T = unknown> {
  type: string;
  data: T;
  timestamp: string;
  requestId?: string;
}

export interface WebSocketConnection {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  lastConnectedAt: Date | null;
}

// Performance types
export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  timestamp: Date;
}

// Analytics types
export interface AnalyticsEvent {
  name: string;
  properties: Record<string, unknown>;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

// Storage types
export interface StorageItem<T = unknown> {
  value: T;
  expiresAt?: Date;
  createdAt: Date;
}

export interface StorageManager {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T, ttl?: number): void;
  remove(key: string): void;
  clear(): void;
  exists(key: string): boolean;
}
