import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { MiningSlot } from './useSlotsData';
import { Activity } from './useActivityData';

interface AdminUserDetail {
  id: string;
  telegramId: string;
  firstName: string | null;
  username: string | null;
  createdAt: string;
  totalInvested: number;
  isSuspicious: boolean;
  wallets: { currency: string; balance: number }[];
  miningSlots: MiningSlot[];
  activityLogs: Activity[];
  referrals: { id: string; firstName: string | null; username: string | null }[];
  referredBy: { id: string; firstName: string | null; username: string | null } | null;
}

const fetchUserDetail = async (userId: string, adminTelegramId: string): Promise<AdminUserDetail> => {
  const { data } = await api.get(`/admin/user/${userId}/${adminTelegramId}`);
  return data;
};

export const useAdminUserDetail = (userId: string | undefined) => {
  const { user: adminUser } = useTelegramAuth();

  // Check if user is admin by Telegram ID
  const ADMIN_TELEGRAM_IDS = import.meta.env.VITE_ADMIN_TELEGRAM_IDS 
    ? import.meta.env.VITE_ADMIN_TELEGRAM_IDS.split(',').map((id: string) => id.trim())
    : ['6760298907'];
  
  const isAdmin = adminUser ? ADMIN_TELEGRAM_IDS.includes(adminUser.telegramId) : false;

  return useQuery<AdminUserDetail, Error>({
    queryKey: ['userDetail', userId],
    queryFn: () => fetchUserDetail(userId!, adminUser!.telegramId),
    enabled: !!userId && !!adminUser && isAdmin,
  });
};