import { useState, useEffect, useCallback } from 'react';
import { useWebSocketOptimized } from './useWebSocketOptimized';

interface WebSocketEarningsData {
  earnings: number;
  balance: number;
  lastUpdate: string;
  totalAccruedEarnings?: number;
}

interface WebSocketSlotsData {
  id: string;
  principal: number;
  effectiveWeeklyRate: number;
  lastAccruedAt: string;
  currentEarnings: number;
  earningsPerSecond: number;
  timeRemaining: number;
}

export const useWebSocketEarnings = (telegramId: string | undefined) => {
  const [earningsData, setEarningsData] = useState<WebSocketEarningsData | null>(null);
  const [slotsData, setSlotsData] = useState<WebSocketSlotsData[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:10112'}/ws`;
  
  const { socket, isConnected: wsConnected, lastMessage } = useWebSocketOptimized({
    url: wsUrl,
    telegramId: telegramId || '',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  });

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage) return;

    console.log('[WebSocketEarnings] Received message:', lastMessage);

    switch (lastMessage.type) {
      case 'earnings_update':
      case 'EARNINGS_UPDATE':
        if (lastMessage.data) {
          setEarningsData(prev => ({
            earnings: Number(lastMessage.data.accruedEarnings || lastMessage.data.earnings) || 0,
            balance: Number(lastMessage.data.balance) || (prev?.balance || 0),
            lastUpdate: String(lastMessage.data.lastUpdate) || new Date().toISOString(),
            totalAccruedEarnings: Number(lastMessage.data.totalAccruedEarnings || lastMessage.data.accruedEarnings) || 0
          }));
          console.log('[WebSocketEarnings] Updated earnings data:', lastMessage.data);
        }
        break;

      case 'slot_earnings_updated':
        if (lastMessage.data) {
          // Update specific slot earnings - use database field
          setSlotsData(prev =>
            prev.map(slot =>
              slot.id === lastMessage.data.slotId
                ? { ...slot, currentEarnings: lastMessage.data.accruedEarnings as number }
                : slot
            )
          );
          console.log('[WebSocketEarnings] Updated slot earnings:', lastMessage.data);
        }
        break;

      case 'earnings_claimed':
        if (lastMessage.data) {
          setEarningsData(prev => ({
            earnings: 0, // Reset earnings after claim
            balance: Number(lastMessage.data.newBalance) || (prev?.balance || 0),
            lastUpdate: new Date().toISOString(),
            totalAccruedEarnings: 0
          }));
          console.log('[WebSocketEarnings] Earnings claimed:', lastMessage.data);
        }
        break;

      case 'slots_data_update':
        if (Array.isArray(lastMessage.data)) {
          setSlotsData(lastMessage.data);
          console.log('[WebSocketEarnings] Updated slots data:', lastMessage.data.length, 'slots');
        }
        break;

      case 'user_data_update':
        if (lastMessage.data) {
          setEarningsData({
            earnings: Number(lastMessage.data.accruedEarnings) || 0,
            balance: Number(lastMessage.data.balance) || 0,
            lastUpdate: String(lastMessage.data.lastUpdate) || new Date().toISOString(),
            totalAccruedEarnings: Number(lastMessage.data.accruedEarnings) || 0
          });
          console.log('[WebSocketEarnings] Updated user data:', lastMessage.data);
        }
        break;

      default:
        console.log('[WebSocketEarnings] Unhandled message type:', lastMessage.type);
    }
  }, [lastMessage]);

  // Update connection status
  useEffect(() => {
    setIsConnected(wsConnected);
  }, [wsConnected]);

  // Calculate real-time earnings from slots data
  const calculateRealTimeEarnings = useCallback(() => {
    if (slotsData.length === 0) return 0;

    const now = Date.now();
    let totalEarnings = 0;

    slotsData.forEach(slot => {
      const lastAccruedTime = new Date(slot.lastAccruedAt).getTime();
      const timeElapsedMs = now - lastAccruedTime;
      
      if (timeElapsedMs > 0) {
        const earnings = slot.earningsPerSecond * (timeElapsedMs / 1000);
        totalEarnings += earnings;
      }
    });

    return totalEarnings;
  }, [slotsData]);

  // Get current total earnings (WebSocket data + real-time calculation)
  const getTotalEarnings = useCallback(() => {
    const baseEarnings = earningsData?.earnings || 0;
    const realTimeEarnings = calculateRealTimeEarnings();
    return baseEarnings + realTimeEarnings;
  }, [earningsData, calculateRealTimeEarnings]);

  // Get current balance
  const getCurrentBalance = useCallback(() => {
    return earningsData?.balance || 0;
  }, [earningsData]);

  // Get last update time
  const getLastUpdate = useCallback(() => {
    return earningsData?.lastUpdate || new Date().toISOString();
  }, [earningsData]);

  return {
    isConnected,
    totalEarnings: getTotalEarnings(),
    currentBalance: getCurrentBalance(),
    lastUpdate: getLastUpdate(),
    slotsData,
    earningsData,
    // Real-time calculation methods
    calculateRealTimeEarnings,
    getTotalEarnings,
    getCurrentBalance,
    getLastUpdate
  };
};
