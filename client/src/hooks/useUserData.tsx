import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

// Define the shape of the user data to fix TypeScript errors
export interface UserData {
  balance: number;
  mneBalance: number; // Add MNE balance
  miningPower: number;
  accruedEarnings: number;
  totalInvested: number; // New field
}

const fetchUserData = async (telegramId: string, bypassCache: boolean = false): Promise<UserData> => {
  const url = bypassCache ? `/user/${telegramId}/data?bypassCache=true` : `/user/${telegramId}/data`;
  const { data } = await api.get(url);
  return data;
};

export const useUserData = (telegramId: string | undefined) => {
  const [forceRefresh, setForceRefresh] = React.useState(0);

  const query = useQuery<UserData, Error>({ // Указан тип для data и error
    queryKey: ['userData', telegramId, forceRefresh],
    queryFn: () => {
      // console.log(`[useUserData] Fetching data for telegramId: ${telegramId}`); // Removed log
      return fetchUserData(telegramId!, forceRefresh > 0);
    },
    enabled: !!telegramId,
    refetchInterval: 60000, // Refetch every 60 seconds (1 minute)
    // onError удален из опций useQuery
  });

  // Listen for admin balance updates and WebSocket notifications
  React.useEffect(() => {
    const handleUserDataRefresh = (event: CustomEvent) => {
      if (event.detail?.telegramId === telegramId) {
        console.log(`[useUserData] Refreshing data for user ${telegramId} with cache bypass`);
        // Force refresh with cache bypass
        setForceRefresh(prev => prev + 1);
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

    window.addEventListener('userDataRefresh', handleUserDataRefresh as EventListener);
    window.addEventListener('message', handleWebSocketMessage);

    return () => {
      window.removeEventListener('userDataRefresh', handleUserDataRefresh as EventListener);
      window.removeEventListener('message', handleWebSocketMessage);
    };
  }, [telegramId, query]);

  return query;
};