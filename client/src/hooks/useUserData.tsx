import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Define the shape of the user data to fix TypeScript errors
export interface UserData {
  balance: number;
  mneBalance: number; // Add MNE balance
  miningPower: number;
  accruedEarnings: number;
  totalInvested: number; // New field
}

const fetchUserData = async (telegramId: string): Promise<UserData> => {
  const { data } = await api.get(`/user/${telegramId}/data`);
  return data;
};

export const useUserData = (telegramId: string | undefined) => {
  return useQuery<UserData, Error>({ // Указан тип для data и error
    queryKey: ['userData', telegramId],
    queryFn: () => {
      // console.log(`[useUserData] Fetching data for telegramId: ${telegramId}`); // Removed log
      return fetchUserData(telegramId!);
    },
    enabled: !!telegramId,
    refetchInterval: 60000, // Refetch every 60 seconds (1 minute)
    // onError удален из опций useQuery
  });
};