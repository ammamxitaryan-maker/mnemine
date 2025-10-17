/**
 * Улучшенный хук для работы с данными админ панели
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { isAdminUser } from '@/utils/adminAuth';
import { AdminUser, DashboardStats, Transaction, PaginatedResponse, FilterOptions, SortOptions } from '@/types/admin';
import { ADMIN_CONFIG } from '@/config/adminConfig';

// Ключи для кэширования
export const QUERY_KEYS = {
  USERS: 'admin-users',
  USER_DETAILS: 'admin-user-details',
  DASHBOARD_STATS: 'admin-dashboard-stats',
  TRANSACTIONS: 'admin-transactions',
  SYSTEM_LOGS: 'admin-system-logs',
  NOTIFICATIONS: 'admin-notifications',
} as const;

/**
 * Хук для получения всех пользователей
 */
export const useAdminUsers = (filters?: FilterOptions, sort?: SortOptions, page: number = 1) => {
  const { user } = useTelegramAuth();
  const isAdmin = user ? isAdminUser(user.telegramId) : false;

  return useQuery<PaginatedResponse<AdminUser>, Error>({
    queryKey: [QUERY_KEYS.USERS, user?.telegramId, filters, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      
      if (sort) {
        params.append('sortBy', sort.field);
        params.append('sortOrder', sort.direction);
      }
      
      params.append('page', page.toString());
      params.append('limit', ADMIN_CONFIG.UI.ITEMS_PER_PAGE.toString());
      
      const { data } = await api.get(`/admin/users/${user?.telegramId}?${params}`);
      return data;
    },
    enabled: !!user && isAdmin,
    staleTime: ADMIN_CONFIG.API.CACHE_DURATION,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });
};

/**
 * Хук для получения детальной информации о пользователе
 */
export const useAdminUserDetails = (userId: string) => {
  const { user } = useTelegramAuth();
  const isAdmin = user ? isAdminUser(user.telegramId) : false;

  return useQuery<AdminUser, Error>({
    queryKey: [QUERY_KEYS.USER_DETAILS, userId, user?.telegramId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/user/${userId}/${user?.telegramId}`);
      return data.data;
    },
    enabled: !!user && isAdmin && !!userId,
    staleTime: ADMIN_CONFIG.API.CACHE_DURATION,
  });
};

/**
 * Хук для получения статистики дашборда
 */
export const useAdminDashboardStats = () => {
  const { user } = useTelegramAuth();
  const isAdmin = user ? isAdminUser(user.telegramId) : false;

  return useQuery<DashboardStats, Error>({
    queryKey: [QUERY_KEYS.DASHBOARD_STATS, user?.telegramId],
    queryFn: async () => {
      const { data } = await api.get(`/admin/dashboard-stats/${user?.telegramId}`);
      return data.data;
    },
    enabled: !!user && isAdmin,
    staleTime: 60000, // 1 минута
    refetchInterval: 30000, // Обновляем каждые 30 секунд
  });
};

/**
 * Хук для получения транзакций
 */
export const useAdminTransactions = (filters?: FilterOptions, sort?: SortOptions, page: number = 1) => {
  const { user } = useTelegramAuth();
  const isAdmin = user ? isAdminUser(user.telegramId) : false;

  return useQuery<PaginatedResponse<Transaction>, Error>({
    queryKey: [QUERY_KEYS.TRANSACTIONS, user?.telegramId, filters, sort, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value.toString());
        });
      }
      
      if (sort) {
        params.append('sortBy', sort.field);
        params.append('sortOrder', sort.direction);
      }
      
      params.append('page', page.toString());
      params.append('limit', ADMIN_CONFIG.UI.ITEMS_PER_PAGE.toString());
      
      const { data } = await api.get(`/admin/transactions/${user?.telegramId}?${params}`);
      return data;
    },
    enabled: !!user && isAdmin,
    staleTime: ADMIN_CONFIG.API.CACHE_DURATION,
  });
};

/**
 * Хук для мутаций пользователей
 */
export const useAdminUserMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useTelegramAuth();

  const updateUser = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<AdminUser> }) => {
      const { data } = await api.patch(`/admin/user/${userId}/${user?.telegramId}`, updates);
      return data;
    },
    onSuccess: (_, { userId }) => {
      // Инвалидируем кэш
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_DETAILS, userId] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
    },
  });

  const freezeUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/admin/user/${userId}/freeze/${user?.telegramId}`);
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_DETAILS, userId] });
    },
  });

  const unfreezeUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/admin/user/${userId}/unfreeze/${user?.telegramId}`);
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_DETAILS, userId] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete(`/admin/user/${userId}/${user?.telegramId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
    },
  });

  return {
    updateUser,
    freezeUser,
    unfreezeUser,
    deleteUser,
  };
};

/**
 * Хук для мутаций транзакций
 */
export const useAdminTransactionMutations = () => {
  const queryClient = useQueryClient();
  const { user } = useTelegramAuth();

  const updateTransaction = useMutation({
    mutationFn: async ({ transactionId, updates }: { transactionId: string; updates: Partial<Transaction> }) => {
      const { data } = await api.patch(`/admin/transaction/${transactionId}/${user?.telegramId}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
    },
  });

  const approveTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data } = await api.post(`/admin/transaction/${transactionId}/approve/${user?.telegramId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
    },
  });

  const rejectTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data } = await api.post(`/admin/transaction/${transactionId}/reject/${user?.telegramId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
    },
  });

  return {
    updateTransaction,
    approveTransaction,
    rejectTransaction,
  };
};

/**
 * Хук для обновления кэша
 */
export const useAdminCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    Object.values(QUERY_KEYS).forEach(key => {
      queryClient.invalidateQueries({ queryKey: [key] });
    });
  };

  const invalidateUsers = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
  };

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
  };

  const invalidateTransactions = () => {
    queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
  };

  return {
    invalidateAll,
    invalidateUsers,
    invalidateDashboard,
    invalidateTransactions,
  };
};