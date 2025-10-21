import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export interface MiningSlot {
  id: string;
  userId: string;
  principal: number; // Amount invested in the slot
  accruedEarnings?: number; // Accumulated earnings ready for claim (optional)
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

export interface RealTimeSlotData {
  id: string;
  currentEarnings: number;
  currentBalance: number;
  progress: number;
  isCompleted: boolean;
}

const fetchSlotsData = async (telegramId?: string): Promise<MiningSlot[]> => {
  console.log('[useSlotsData] Fetching slots data for telegramId:', telegramId);

  if (!telegramId) {
    console.log('[useSlotsData] No telegramId provided, returning empty array');
    return [];
  }

  try {
    const { data } = await api.get(`/user/${telegramId}/slots`);
    console.log('[useSlotsData] Fetched slots data:', {
      count: data?.length || 0,
      slots: data?.map((slot: any) => ({
        id: slot.id,
        principal: slot.principal,
        isActive: slot.isActive,
        effectiveWeeklyRate: slot.effectiveWeeklyRate
      }))
    });

    // Ensure earningsPerSecond is always provided
    return data.map((slot: MiningSlot) => ({
      ...slot,
      earningsPerSecond: slot.earningsPerSecond || 0
    }));
  } catch (error: any) {
    // Don't log aborted requests as errors - they're normal when components unmount
    if (error.name !== 'AxiosError' || error.code !== 'ECONNABORTED') {
      console.error('[useSlotsData] Error fetching slots:', error);
    }
    return [];
  }
};

export const useSlotsData = (telegramId?: string) => {
  return useQuery<MiningSlot[], Error>({
    queryKey: ['slotsData', telegramId],
    queryFn: () => fetchSlotsData(telegramId),
    enabled: !!telegramId,
    refetchInterval: 10000, // Refetch every 10 seconds to match userData
    staleTime: 5000, // Consider data fresh for 5 seconds
  });
};