import { useEffect, useRef, useState } from 'react';
import { globalEarningsManager } from '../utils/globalEarningsManager';

interface WebSocketEarningsData {
  type: 'slot_earnings_updated' | 'earnings_update' | 'earnings_claimed';
  data: {
    slotId?: string;
    accruedEarnings?: number;
    lastAccruedAt?: string;
    principal?: number;
    effectiveWeeklyRate?: number;
    claimedAmount?: number;
    newBalance?: number;
    earnings?: number;
    balance?: number;
    lastUpdate?: string;
  };
  timestamp: string;
}

export const useWebSocketEarnings = (telegramId: string | undefined) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!telegramId) {
      console.log('[WebSocketEarnings] No telegramId provided, skipping connection');
      return;
    }

    const connectWebSocket = () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';
        const wsUrl = backendUrl.replace('http', 'ws') + '/ws';

        // Add type parameter to the URL
        const wsWithType = `${wsUrl}?type=earnings&token=${telegramId}`;
        console.log('[WebSocketEarnings] Connecting to:', wsWithType);

        const ws = new WebSocket(wsWithType);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[WebSocketEarnings] Connected successfully to:', wsWithType);
          setIsConnected(true);
          reconnectAttempts.current = 0;

          // Send authentication with telegramId
          const authMessage = {
            type: 'auth',
            telegramId: telegramId
          };
          console.log('[WebSocketEarnings] Sending auth message:', authMessage);
          ws.send(JSON.stringify(authMessage));
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketEarningsData = JSON.parse(event.data);
            console.log('[WebSocketEarnings] Received message:', message);

            setLastUpdate(new Date().toISOString());

            switch (message.type) {
              case 'slot_earnings_updated':
                if (message.data.slotId && message.data.accruedEarnings !== undefined) {
                  console.log('[WebSocketEarnings] Slot earnings updated:', {
                    slotId: message.data.slotId,
                    accruedEarnings: message.data.accruedEarnings
                  });

                  // Trigger a refresh of slots data to get updated earnings
                  // The globalEarningsManager will pick up the changes
                  globalEarningsManager.forceServerSync(telegramId);
                }
                break;

              case 'earnings_update':
                if (message.data.earnings !== undefined) {
                  console.log('[WebSocketEarnings] Earnings update received:', {
                    earnings: message.data.earnings,
                    balance: message.data.balance
                  });

                  // Update the global earnings manager with server data
                  // The manager will intelligently decide whether to apply the update
                  globalEarningsManager.updateServerEarnings(telegramId, message.data.earnings);
                }
                break;

              case 'earnings_claimed':
                if (message.data.claimedAmount !== undefined) {
                  console.log('[WebSocketEarnings] Earnings claimed:', {
                    claimedAmount: message.data.claimedAmount,
                    newBalance: message.data.newBalance
                  });

                  // Reset earnings after claim
                  globalEarningsManager.resetEarnings(telegramId);
                }
                break;
            }
          } catch (error) {
            console.error('[WebSocketEarnings] Error parsing message:', error);
          }
        };

        ws.onclose = (event) => {
          console.log('[WebSocketEarnings] Connection closed:', event.code, event.reason);
          setIsConnected(false);
          wsRef.current = null;

          // Attempt to reconnect if not a normal closure
          if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
            console.log(`[WebSocketEarnings] Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1})`);

            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectAttempts.current++;
              connectWebSocket();
            }, delay);
          }
        };

        ws.onerror = (error) => {
          console.error('[WebSocketEarnings] WebSocket error:', error);
          setIsConnected(false);
        };

      } catch (error) {
        console.error('[WebSocketEarnings] Connection error:', error);
        setIsConnected(false);
      }
    };

    // Connect to WebSocket
    connectWebSocket();

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounting');
        wsRef.current = null;
      }

      setIsConnected(false);
    };
  }, [telegramId]);

  return {
    isConnected,
    lastUpdate,
    reconnectAttempts: reconnectAttempts.current
  };
};
