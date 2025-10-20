import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { useBalanceEventHandlers } from './useBalanceEventHandlers';

// Define the shape of the user data to fix TypeScript errors
export interface UserData {
  balance: number; // Main balance (same as admin panel)
  availableBalance: number; // User's available balance (main currency)
  miningPower: number;
  accruedEarnings: number;
  totalInvested: number; // New field
  usdBalance?: number; // Add USD balance
  totalEarnings?: number; // Add total earnings
}

const fetchUserData = async (telegramId: string, bypassCache: boolean = false): Promise<UserData> => {
  // Use cache bypass only when explicitly requested
  const url = bypassCache
    ? `/user/${telegramId}/data?bypassCache=true&t=${Date.now()}`
    : `/user/${telegramId}/data`;
  console.log(`[fetchUserData] Fetching data for ${telegramId}, bypassCache: ${bypassCache}, url: ${url}`);
  const { data } = await api.get(url);
  console.log(`[fetchUserData] Received data for ${telegramId}:`, {
    availableBalance: data.availableBalance,
    balance: data.balance,
    bypassCache,
    url,
    timestamp: new Date().toISOString()
  });
  return data;
};

export const useUserData = (telegramId: string | undefined) => {
  const query = useQuery<UserData, Error>({ // Указан тип для data и error
    queryKey: ['userData', telegramId], // Remove forceRefresh from query key
    queryFn: () => {
      console.log(`[useUserData] Query function called for telegramId: ${telegramId}`);
      return fetchUserData(telegramId!, false);
    },
    enabled: !!telegramId,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
    staleTime: 5000, // Consider data fresh for 5 seconds to allow more frequent updates
  });

  // Use centralized balance event handlers
  const { forceRefresh, forceRefreshData } = useBalanceEventHandlers({
    telegramId,
    onBalanceUpdate: () => {
      console.log(`[useUserData] Balance updated for user ${telegramId}, forcing refresh`);
      query.refetch();
    },
    onUserDataRefresh: () => {
      console.log(`[useUserData] User data refresh for user ${telegramId}, forcing refresh`);
      query.refetch();
    },
    onGlobalRefresh: () => {
      console.log(`[useUserData] Global refresh for user ${telegramId}, forcing refresh`);
      query.refetch();
    },
    onUserDataUpdated: () => {
      console.log(`[useUserData] User data updated for user ${telegramId}, forcing refresh`);
      query.refetch();
    }
  });

  return {
    ...query,
    forceRefresh: forceRefreshData
  };
};