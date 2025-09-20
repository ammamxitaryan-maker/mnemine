import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useCallback } from 'react';
import { AxiosError } from 'axios'; // Import AxiosError

// Define the shape of the user data to fix TypeScript errors
export interface UserData {
  balance: number;
  miningPower: number;
  accruedEarnings: number;
  totalInvested: number; // New field
  referralCount?: number; // Added for ProfessionalDashboard
  rank?: string | null; // Added for ProfessionalDashboard
}

const fetchUserData = async (telegramId: string): Promise<UserData> => {
  try {
    const { data } = await api.get(`/user/${telegramId}/data`);
    return data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const useUserData = (telegramId: string | undefined) => {
  const queryFn = useCallback(() => {
    if (!telegramId) {
      throw new Error('Telegram ID is required');
    }
    return fetchUserData(telegramId);
  }, [telegramId]);

  return useQuery<UserData, Error>({
    queryKey: ['userData', telegramId],
    queryFn,
    enabled: !!telegramId,
    refetchInterval: 60000, // Refetch every 60 seconds (1 minute)
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error instanceof AxiosError && error.response?.status >= 400 && error.response?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    staleTime: 30000, // Consider data stale after 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
};