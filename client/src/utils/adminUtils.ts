/**
 * Утилиты для работы с админ панелью
 */

import { AdminUser, Transaction, DashboardStats, FilterOptions, SortOptions } from '@/types/admin';
import { ADMIN_CONFIG } from '@/config/adminConfig';

/**
 * Форматирование чисел
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

/**
 * Форматирование валюты
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Форматирование даты
 */
export const formatDate = (date: string | Date, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
};

/**
 * Форматирование времени относительно текущего момента
 */
export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return formatDate(dateObj, { month: 'short', day: 'numeric' });
};

/**
 * Получить статус пользователя
 */
export const getUserStatus = (user: AdminUser): { status: string; color: string; icon: string } => {
  if (user.isFrozen) {
    return { status: 'Frozen', color: 'text-red-400', icon: '❄️' };
  }
  if (user.isSuspicious) {
    return { status: 'Suspicious', color: 'text-yellow-400', icon: '⚠️' };
  }
  if (user.isOnline) {
    return { status: 'Online', color: 'text-green-400', icon: '🟢' };
  }
  if (user.isActive) {
    return { status: 'Active', color: 'text-blue-400', icon: '🔵' };
  }
  return { status: 'Inactive', color: 'text-gray-400', icon: '⚪' };
};

/**
 * Получить статус транзакции
 */
export const getTransactionStatus = (transaction: Transaction): { status: string; color: string; icon: string } => {
  switch (transaction.status) {
    case 'completed':
      return { status: 'Completed', color: 'text-green-400', icon: '✅' };
    case 'pending':
      return { status: 'Pending', color: 'text-yellow-400', icon: '⏳' };
    case 'failed':
      return { status: 'Failed', color: 'text-red-400', icon: '❌' };
    case 'cancelled':
      return { status: 'Cancelled', color: 'text-gray-400', icon: '🚫' };
    default:
      return { status: 'Unknown', color: 'text-gray-400', icon: '❓' };
  }
};

/**
 * Фильтрация пользователей
 */
export const filterUsers = (users: AdminUser[], filters: FilterOptions): AdminUser[] => {
  return users.filter(user => {
    // Поиск по тексту
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.username?.toLowerCase().includes(searchTerm) ||
        user.telegramId.includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm);
      
      if (!matchesSearch) return false;
    }
    
    // Фильтр по статусу
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'active':
          if (!user.isActive) return false;
          break;
        case 'frozen':
          if (!user.isFrozen) return false;
          break;
        case 'suspicious':
          if (!user.isSuspicious) return false;
          break;
        case 'online':
          if (!user.isOnline) return false;
          break;
      }
    }
    
    // Фильтр по роли
    if (filters.role && filters.role !== 'all') {
      if (user.role !== filters.role) return false;
    }
    
    // Фильтр по дате
    if (filters.dateFrom) {
      const userDate = new Date(user.createdAt);
      const fromDate = new Date(filters.dateFrom);
      if (userDate < fromDate) return false;
    }
    
    if (filters.dateTo) {
      const userDate = new Date(user.createdAt);
      const toDate = new Date(filters.dateTo);
      if (userDate > toDate) return false;
    }
    
    return true;
  });
};

/**
 * Сортировка пользователей
 */
export const sortUsers = (users: AdminUser[], sort: SortOptions): AdminUser[] => {
  return [...users].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sort.field) {
      case 'firstName':
        aValue = a.firstName || '';
        bValue = b.firstName || '';
        break;
      case 'username':
        aValue = a.username || '';
        bValue = b.username || '';
        break;
      case 'balance':
        aValue = a.balance;
        bValue = b.balance;
        break;
      case 'totalInvested':
        aValue = a.totalInvested;
        bValue = b.totalInvested;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'lastSeenAt':
        aValue = a.lastSeenAt ? new Date(a.lastSeenAt) : new Date(0);
        bValue = b.lastSeenAt ? new Date(b.lastSeenAt) : new Date(0);
        break;
      default:
        return 0;
    }
    
    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });
};

/**
 * Пагинация данных
 */
export const paginateData = <T>(data: T[], page: number, limit: number): {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
} => {
  const total = data.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = data.slice(startIndex, endIndex);
  
  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Получить цвет для статистики
 */
export const getStatColor = (value: number, threshold?: { good: number; warning: number }): string => {
  if (threshold) {
    if (value >= threshold.good) return 'text-green-400';
    if (value >= threshold.warning) return 'text-yellow-400';
    return 'text-red-400';
  }
  
  // Базовые цвета для разных типов статистики
  if (value > 0) return 'text-green-400';
  if (value < 0) return 'text-red-400';
  return 'text-gray-400';
};

/**
 * Дебаунс функция
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Генерация уникального ID
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Валидация email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Валидация Telegram ID
 */
export const isValidTelegramId = (id: string): boolean => {
  return /^\d+$/.test(id) && id.length >= 8;
};

/**
 * Получить иконку для типа транзакции
 */
export const getTransactionIcon = (type: string): string => {
  switch (type) {
    case 'deposit':
      return '💰';
    case 'withdrawal':
      return '💸';
    case 'investment':
      return '📈';
    case 'payout':
      return '🎁';
    case 'referral':
      return '👥';
    default:
      return '💳';
  }
};

/**
 * Получить цвет для типа транзакции
 */
export const getTransactionTypeColor = (type: string): string => {
  switch (type) {
    case 'deposit':
      return 'text-green-400';
    case 'withdrawal':
      return 'text-red-400';
    case 'investment':
      return 'text-blue-400';
    case 'payout':
      return 'text-purple-400';
    case 'referral':
      return 'text-yellow-400';
    default:
      return 'text-gray-400';
  }
};

/**
 * Экспорт данных в CSV
 */
export const exportToCSV = (data: any[], filename: string): void => {
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Копирование в буфер обмена
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback для старых браузеров
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (fallbackErr) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};
