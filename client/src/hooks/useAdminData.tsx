/**
 * Улучшенный хук для работы с данными админ панели
 */

import { ADMIN_CONFIG } from '@/config/adminConfig';
import { api } from '@/lib/api';
import { AdminUser, DashboardStats, FilterOptions, PaginatedResponse, SortOptions, Transaction } from '@/types/admin';
import { isAdminUser } from '@/utils/adminAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTelegramAuth } from './useTelegramAuth';

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
      try {
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

        const { data } = await api.get(`/admin/users?${params}`);
        return data;
      } catch (error: any) {
        console.error('Error fetching admin users:', error);
        throw new Error(error.response?.data?.error || error.message || 'Failed to fetch users');
      }
    },
    enabled: !!user && isAdmin,
    staleTime: ADMIN_CONFIG.API.CACHE_DURATION,
    refetchInterval: 30000, // Обновляем каждые 30 секунд
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
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
      const { data } = await api.get(`/admin/user/${userId}`);
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
      try {
        const { data } = await api.get(`/admin/dashboard-stats`);
        return data.data;
      } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error(error.response?.data?.error || error.message || 'Failed to fetch dashboard stats');
      }
    },
    enabled: !!user && isAdmin,
    staleTime: 120000, // 2 минуты
    refetchInterval: 180000, // Обновляем каждые 3 минуты (оптимизировано)
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for auth errors
      if (error.message.includes('401') || error.message.includes('403')) {
        return false;
      }
      return failureCount < 3;
    },
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

      const { data } = await api.get(`/admin/transactions?${params}`);
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
      const { data } = await api.patch(`/admin/user/${userId}`, updates);
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
      const { data } = await api.post(`/admin/user/${userId}/freeze`);
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_DETAILS, userId] });
    },
  });

  const unfreezeUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post(`/admin/user/${userId}/unfreeze`);
      return data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USER_DETAILS, userId] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.delete(`/admin/user/${userId}`);
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
      const { data } = await api.patch(`/admin/transaction/${transactionId}`, updates);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
    },
  });

  const approveTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data } = await api.post(`/admin/transaction/${transactionId}/approve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.DASHBOARD_STATS] });
    },
  });

  const rejectTransaction = useMutation({
    mutationFn: async (transactionId: string) => {
      const { data } = await api.post(`/admin/transaction/${transactionId}/reject`);
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