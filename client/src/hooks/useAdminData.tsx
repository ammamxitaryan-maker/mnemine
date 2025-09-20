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
  wallets: { currency: string; balance: number }[];
  _count: {
    referrals: number;
    miningSlots: number;
  };
}

const fetchAllUsers = async (telegramId: string): Promise<AdminUser[]> => {
  const { data } = await api.get(`/admin/users/${telegramId}`);
  return data;
};

export const useAdminData = () => {
  const { user } = useTelegramAuth();

  return useQuery<AdminUser[], Error>({
    queryKey: ['allUsers', user?.telegramId],
    queryFn: () => fetchAllUsers(user!.telegramId),
    enabled: !!user && user.role === 'ADMIN',
  });
};