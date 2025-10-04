import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';

export interface AdminUser {
  id: string;
  telegramId: string;
  firstName: string | null;
  username: string | null;
  createdAt: string;
  totalInvested: number;
  isOnline: boolean;
  lastSeenAt: string | null;
  wallets: { currency: string; balance: number }[];
  _count: {
    referrals: number;
    miningSlots: number;
  };
}

export interface AdminData {
  users: AdminUser[];
  totalCount: number;
  onlineCount: number;
}

const fetchAllUsers = async (telegramId: string): Promise<AdminData> => {
  const { data } = await api.get(`/admin/users/${telegramId}`);
  return data;
};

export const useAdminData = () => {
  const { user } = useTelegramAuth();

  return useQuery<AdminData, Error>({
    queryKey: ['allUsers', user?.telegramId],
    queryFn: () => fetchAllUsers(user?.telegramId || 'guest_fallback'),
    enabled: !!user && user.role === 'ADMIN',
  });
};