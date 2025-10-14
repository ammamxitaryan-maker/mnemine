import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface MiningSlot {
  id: string;
  userId: string;
  principal: number; // Amount invested in the slot
  accruedEarnings: number; // Accumulated earnings ready for claim
  effectiveWeeklyRate: number; // Weekly profit rate (e.g., 0.3 for 30%)
  createdAt: string; // When the slot was created
  expiresAt: string; // When the slot expires (ISO string)
  isActive: boolean;
  type: string; // Type of slot (e.g., 'standard')
  lastAccruedAt: string; // Last time earnings were accrued
  earningsPerSecond: number; // Earnings per second for compatibility
  currentEarnings?: number; // Current live earnings (calculated)
  [key: string]: unknown; // Index signature for compatibility
}

const fetchSlotsData = async (telegramId?: string): Promise<MiningSlot[]> => {
  if (!telegramId) {
    return [];
  }
  const { data } = await api.get(`/user/${telegramId}/slots`);
  return data;
};

export const useSlotsData = (telegramId?: string) => {
  return useQuery<MiningSlot[], Error>({
    queryKey: ['slotsData', telegramId],
    queryFn: () => fetchSlotsData(telegramId),
    enabled: !!telegramId,
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};