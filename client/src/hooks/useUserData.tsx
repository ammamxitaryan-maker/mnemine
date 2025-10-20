import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

// Define the shape of the user data to fix TypeScript errors
export interface UserData {
  balance: number;
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
  const [forceRefresh, setForceRefresh] = React.useState(0);

  const query = useQuery<UserData, Error>({ // Указан тип для data и error
    queryKey: ['userData', telegramId, forceRefresh], // Remove timestamp to allow proper caching
    queryFn: () => {
      console.log(`[useUserData] Query function called for telegramId: ${telegramId}, forceRefresh: ${forceRefresh}`);
      // Only bypass cache when forceRefresh is > 0, otherwise use normal caching
      return fetchUserData(telegramId!, forceRefresh > 0);
    },
    enabled: !!telegramId,
    refetchInterval: 3000, // Refetch every 3 seconds for real-time updates
    staleTime: 5000, // Consider data fresh for 5 seconds to allow more frequent updates
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
          // Also manually refetch the query
          query.refetch();
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

    const handleUserDataUpdated = (event: CustomEvent) => {
      console.log(`[useUserData] Received userDataUpdated event:`, event.detail);
      if (event.detail?.telegramId === telegramId) {
        console.log(`[useUserData] User data updated for ${telegramId}, forcing refresh`);
        setForceRefresh(prev => prev + 1);
        query.refetch();
      }
    };

    window.addEventListener('userDataRefresh', handleUserDataRefresh as EventListener);
    window.addEventListener('balanceUpdated', handleBalanceUpdated as EventListener);
    window.addEventListener('globalDataRefresh', handleGlobalRefresh);
    window.addEventListener('userDataUpdated', handleUserDataUpdated as EventListener);
    window.addEventListener('message', handleWebSocketMessage);

    return () => {
      window.removeEventListener('userDataRefresh', handleUserDataRefresh as EventListener);
      window.removeEventListener('balanceUpdated', handleBalanceUpdated as EventListener);
      window.removeEventListener('globalDataRefresh', handleGlobalRefresh);
      window.removeEventListener('userDataUpdated', handleUserDataUpdated as EventListener);
      window.removeEventListener('message', handleWebSocketMessage);
    };
  }, [telegramId, query]);

  // Add manual refresh function
  const forceRefreshData = React.useCallback(() => {
    console.log(`[useUserData] Manual force refresh requested for user ${telegramId}`);
    setForceRefresh(prev => prev + 1);
    query.refetch();
  }, [telegramId, query.refetch]); // Use query.refetch instead of query to prevent unnecessary re-renders

  return {
    ...query,
    forceRefresh: forceRefreshData
  };
};