import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseWebSocketOptions {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  onMessage?: (message: WebSocketMessage) => void;
}

export const useWebSocket = ({
  url,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5,
  onOpen,
  onClose,
  onError,
  onMessage
}: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onOpen?.();
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onClose?.();

        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else {
          setConnectionStatus('error');
          setError('Max reconnection attempts reached');
        }
      };

      wsRef.current.onerror = (event) => {
        setConnectionStatus('error');
        setError('WebSocket connection error');
        onError?.(event);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      setConnectionStatus('error');
      setError('Failed to create WebSocket connection');
    }
  }, [url, reconnectInterval, maxReconnectAttempts, onOpen, onClose, onError, onMessage]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    error,
    sendMessage,
    connect,
    disconnect
  };
};

// Specialized hook for real-time financial data
export const useRealTimeWebSocket = (telegramId: string) => {
  const [userData, setUserData] = useState<any>(null);
  const [marketData, setMarketData] = useState<any>(null);
  const [slotsData, setSlotsData] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'user_data_update':
        setUserData(message.data);
        break;
      case 'market_data_update':
        setMarketData(message.data);
        break;
      case 'slots_data_update':
        setSlotsData(message.data);
        break;
      case 'activity_update':
        setActivities(prev => [message.data, ...prev.slice(0, 49)]); // Keep last 50 activities
        break;
      case 'balance_update':
        setUserData(prev => prev ? { ...prev, balance: message.data.balance } : null);
        break;
      case 'earnings_update':
        setUserData(prev => prev ? { ...prev, accruedEarnings: message.data.earnings } : null);
        break;
    }
  }, []);

  const wsUrl = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? `wss://${window.location.hostname}/ws` : `ws://${window.location.hostname}:10112/ws`);
  
  const { isConnected, connectionStatus, error, sendMessage } = useWebSocket({
    url: `${wsUrl}/${telegramId}`,
    onMessage: handleMessage,
    reconnectInterval: 3000,
    maxReconnectAttempts: 10
  });

  const subscribeToUpdates = useCallback((types: string[]) => {
    sendMessage({
      type: 'subscribe',
      data: { types }
    });
  }, [sendMessage]);

  const unsubscribeFromUpdates = useCallback((types: string[]) => {
    sendMessage({
      type: 'unsubscribe',
      data: { types }
    });
  }, [sendMessage]);

  return {
    isConnected,
    connectionStatus,
    error,
    userData,
    marketData,
    slotsData,
    activities,
    subscribeToUpdates,
    unsubscribeFromUpdates,
    sendMessage
  };
};

// Hook for real-time notifications
export const useNotificationWebSocket = () => {
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (message.type === 'notification') {
      setNotifications(prev => [message.data, ...prev.slice(0, 99)]); // Keep last 100 notifications
    }
  }, []);

  const wsUrl = import.meta.env.VITE_WS_URL || (import.meta.env.PROD ? `wss://${window.location.hostname}/ws` : `ws://${window.location.hostname}:10112/ws`);
  
  const { isConnected, sendMessage } = useWebSocket({
    url: `${wsUrl}/notifications`,
    onMessage: handleMessage
  });

  const markAsRead = useCallback((notificationId: string) => {
    sendMessage({
      type: 'mark_read',
      data: { notificationId }
    });
  }, [sendMessage]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    sendMessage({
      type: 'clear_all',
      data: {}
    });
  }, [sendMessage]);

  return {
    isConnected,
    notifications,
    markAsRead,
    clearAll
  };
};

