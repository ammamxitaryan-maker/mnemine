import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
}

interface UseWebSocketOptions {
  url: string;
  telegramId: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocketOptimized = ({
  url,
  telegramId,
  reconnectInterval = 5000,
  maxReconnectAttempts = 5
}: UseWebSocketOptions) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  // Используем useRef для предотвращения пересоздания соединения
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const isManualCloseRef = useRef(false);
  const messageHandlersRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set());

  // Мемоизированная функция подключения
  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      return; // Уже подключен
    }

    setConnectionStatus('connecting');
    console.log('🔄 Connecting to WebSocket...');

    try {
      const wsUrl = `${url}?telegramId=${telegramId}`;
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setConnectionStatus('connected');
        setSocket(ws);
        socketRef.current = ws;
        reconnectAttemptsRef.current = 0; // Сброс счетчика попыток
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Уведомляем всех подписчиков
          messageHandlersRef.current.forEach(handler => {
            try {
              handler(message);
            } catch (error) {
              console.error('Error in message handler:', error);
            }
          });
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setSocket(null);
        socketRef.current = null;
        
        if (!isManualCloseRef.current) {
          setConnectionStatus('disconnected');
          attemptReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionStatus('error');
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionStatus('error');
      attemptReconnect();
    }
  }, [url, telegramId]);

  // Мемоизированная функция переподключения
  const attemptReconnect = useCallback(() => {
    if (isManualCloseRef.current || reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('🚫 Max reconnection attempts reached or manual close');
      setConnectionStatus('disconnected');
      return;
    }

    reconnectAttemptsRef.current++;
    console.log(`🔄 Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts}...`);
    
    setConnectionStatus('connecting');
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectInterval);
  }, [connect, reconnectInterval, maxReconnectAttempts]);

  // Мемоизированная функция отправки сообщений
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('❌ Error sending WebSocket message:', error);
        return false;
      }
    } else {
      console.warn('⚠️ WebSocket not connected, message not sent');
      return false;
    }
  }, []);

  // Мемоизированная функция подписки на сообщения
  const subscribe = useCallback((handler: (message: WebSocketMessage) => void) => {
    messageHandlersRef.current.add(handler);
    
    // Возвращаем функцию отписки
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Мемоизированная функция отключения
  const disconnect = useCallback(() => {
    isManualCloseRef.current = true;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    
    setIsConnected(false);
    setSocket(null);
    setConnectionStatus('disconnected');
  }, []);

  // Подключение при монтировании
  useEffect(() => {
    if (telegramId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [telegramId, connect, disconnect]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    socket,
    isConnected,
    lastMessage,
    connectionStatus,
    sendMessage,
    subscribe,
    disconnect,
    reconnect: connect
  };
};
