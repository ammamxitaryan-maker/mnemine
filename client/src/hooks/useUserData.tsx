import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

// Define the shape of the user data to fix TypeScript errors
export interface UserData {
  balance: number;
  nonBalance: number; // Add NON balance
  miningPower: number;
  accruedEarnings: number;
  totalInvested: number; // New field
  usdBalance?: number; // Add USD balance
  totalEarnings?: number; // Add total earnings
}

const fetchUserData = async (telegramId: string, bypassCache: boolean = false): Promise<UserData> => {
  // Always use cache bypass to ensure fresh data
  const url = `/user/${telegramId}/data?bypassCache=true&t=${Date.now()}`;
  console.log(`[fetchUserData] Fetching data for ${telegramId}, bypassCache: ${bypassCache}, url: ${url}`);
  const { data } = await api.get(url);
  console.log(`[fetchUserData] Received data:`, { nonBalance: data.nonBalance, balance: data.balance });
  return data;
};

export const useUserData = (telegramId: string | undefined) => {
  const [forceRefresh, setForceRefresh] = React.useState(0);

  const query = useQuery<UserData, Error>({ // Указан тип для data и error
    queryKey: ['userData', telegramId, forceRefresh, Date.now()], // Add timestamp to force fresh fetches
    queryFn: () => {
      console.log(`[useUserData] Query function called for telegramId: ${telegramId}, forceRefresh: ${forceRefresh}`);
      return fetchUserData(telegramId!, forceRefresh > 0);
    },
    enabled: !!telegramId,
    refetchInterval: 30000, // Refetch every 30 seconds (reduced from 60)
    staleTime: 0, // Always consider data stale to force fresh fetches
    // onError удален из опций useQuery
  });

  // Listen for admin balance updates and WebSocket notifications
  React.useEffect(() => {
    const handleUserDataRefresh = (event: CustomEvent) => {
      console.log(`[useUserData] Received userDataRefresh event:`, event.detail);
      console.log(`[useUserData] Current telegramId: ${telegramId}`);
      if (event.detail?.telegramId === telegramId) {
        console.log(`[useUserData] Refreshing data for user ${telegramId} with cache bypass`);
        // Force refresh with cache bypass
        setForceRefresh(prev => prev + 1);
        // Also manually refetch the query
        query.refetch();
      } else {
        console.log(`[useUserData] Event telegramId (${event.detail?.telegramId}) does not match current user (${telegramId})`);
      }
    };

    // Listen for WebSocket balance updates
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'BALANCE_UPDATED' && data.data) {
          console.log(`[useUserData] WebSocket balance update received:`, data.data);
          console.log(`[useUserData] New balance: ${data.data.newBalance}, Previous: ${data.data.previousBalance}`);
          // Force immediate refresh with cache bypass
          setForceRefresh(prev => prev + 1);
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };

    // Listen for multiple event types
    const handleBalanceUpdated = (event: CustomEvent) => {
      console.log(`[useUserData] Received balanceUpdated event:`, event.detail);
      if (event.detail?.telegramId === telegramId) {
        console.log(`[useUserData] Balance updated for user ${telegramId}, forcing refresh`);
        setForceRefresh(prev => prev + 1);
        query.refetch();
      }
    };

    const handleGlobalRefresh = () => {
      console.log(`[useUserData] Received globalDataRefresh event, forcing refresh for user ${telegramId}`);
      setForceRefresh(prev => prev + 1);
      query.refetch();
    };

    window.addEventListener('userDataRefresh', handleUserDataRefresh as EventListener);
    window.addEventListener('balanceUpdated', handleBalanceUpdated as EventListener);
    window.addEventListener('globalDataRefresh', handleGlobalRefresh);
    window.addEventListener('message', handleWebSocketMessage);

    return () => {
      window.removeEventListener('userDataRefresh', handleUserDataRefresh as EventListener);
      window.removeEventListener('balanceUpdated', handleBalanceUpdated as EventListener);
      window.removeEventListener('globalDataRefresh', handleGlobalRefresh);
      window.removeEventListener('message', handleWebSocketMessage);
    };
  }, [telegramId, query]);

  return query;
};