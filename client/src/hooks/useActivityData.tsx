import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export type ActivityLogType =
  | 'DEPOSIT'
  | 'WITHDRAWAL'
  | 'CLAIM'
  | 'NEW_SLOT_PURCHASE'
  | 'SLOT_EXTENSION'
  | 'BOOSTER_PURCHASE'
  | 'REFERRAL_SIGNUP_BONUS'
  | 'REFERRAL_COMMISSION'
  | 'REFERRAL_DEPOSIT_BONUS'
  | 'TASK_REWARD'
  | 'DAILY_BONUS'
  | 'WELCOME_BONUS'
  | 'REINVESTMENT'
  | 'LEADERBOARD_BONUS'
  | 'INVESTMENT_GROWTH_BONUS'
  | 'DIVIDEND_BONUS'
  | 'REFERRAL_3_IN_3_DAYS_BONUS'
  | 'BALANCE_ZEROED_PENALTY'
  | 'LOTTERY_TICKET_PURCHASE'
  | 'LOTTERY_WIN';

export interface Activity {
  id: string;
  type: ActivityLogType;
  amount: number;
  description: string;
  createdAt: string; // ISO date string
}

const fetchActivityData = async (telegramId: string): Promise<Activity[]> => {
  const { data } = await api.get(`/user/${telegramId}/activity`);
  return data;
};

export const useActivityData = (telegramId: string | undefined) => {
  return useQuery<Activity[], Error>({
    queryKey: ['activity', telegramId],
    queryFn: () => fetchActivityData(telegramId!),
    enabled: !!telegramId,
    refetchInterval: 15000, // Refetch every 15 seconds
  });
};