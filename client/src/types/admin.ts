/**
 * Унифицированные типы данных для админ панели
 */

// Базовые типы пользователя
export interface BaseUser {
  id: string;
  telegramId: string;
  firstName: string | null;
  username: string | null;
  email: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  isOnline: boolean;
}

// Расширенный тип пользователя для админ панели
export interface AdminUser extends BaseUser {
  role: string;
  isActive: boolean;
  isFrozen: boolean;
  isSuspicious: boolean;
  balance: number;
  totalInvested: number;
  referralCount: number;
  wallets: UserWallet[];
  _count: {
    referrals: number;
    miningSlots: number;
  };
}

// Кошелек пользователя
export interface UserWallet {
  currency: string;
  balance: number;
  frozen?: boolean;
}

// Статистика дашборда
export interface DashboardStats {
  users: {
    total: number;
    active: number;
    frozen: number;
    newThisWeek: number;
    online: number;
  };
  finances: {
    totalInvested: number;
    totalEarnings: number;
    todayPayouts: number;
    pendingWithdrawals: number;
  };
  system: {
    uptime: string;
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
  activity: {
    weeklyLogs: number;
    dailyActiveUsers: number;
    transactionsToday: number;
  };
}

// Транзакция
export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'investment' | 'payout' | 'referral';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  createdAt: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

// Лотерея
export interface Lottery {
  id: string;
  name: string;
  description: string;
  ticketPrice: number;
  maxTickets: number;
  soldTickets: number;
  prize: number;
  status: 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  winnerId?: string;
  participants: LotteryParticipant[];
}

// Участник лотереи
export interface LotteryParticipant {
  userId: string;
  ticketCount: number;
  purchasedAt: string;
}

// Уведомление
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  targetUsers?: string[]; // Если пустой - всем пользователям
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

// Лог системы
export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  category: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Настройки системы
export interface SystemSettings {
  general: {
    siteName: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
  };
  mining: {
    baseRate: number;
    multiplier: number;
    maxSlots: number;
  };
  lottery: {
    enabled: boolean;
    defaultTicketPrice: number;
    maxTicketsPerUser: number;
  };
  notifications: {
    emailEnabled: boolean;
    telegramEnabled: boolean;
    pushEnabled: boolean;
  };
  security: {
    maxLoginAttempts: number;
    lockoutDuration: number;
    passwordMinLength: number;
  };
}

// API ответы
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Фильтры и сортировка
export interface FilterOptions {
  search?: string;
  status?: string;
  role?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: any;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

// Состояния загрузки
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Действия админа
export interface AdminAction {
  id: string;
  adminId: string;
  action: string;
  targetType: 'user' | 'transaction' | 'system' | 'lottery';
  targetId: string;
  details: Record<string, any>;
  timestamp: string;
}

// Экспорт всех типов
export type {
  BaseUser,
  AdminUser,
  UserWallet,
  DashboardStats,
  Transaction,
  Lottery,
  LotteryParticipant,
  Notification,
  SystemLog,
  SystemSettings,
  ApiResponse,
  PaginatedResponse,
  FilterOptions,
  SortOptions,
  PaginationOptions,
  LoadingState,
  AdminAction,
};
