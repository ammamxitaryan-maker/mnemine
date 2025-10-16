import React, { useEffect, useState } from 'react';
import { useWebSocketEarnings } from '@/hooks/useWebSocketEarnings';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';

export const WebSocketTest = () => {
  const { user } = useTelegramAuth();
  const { isConnected, lastUpdate, reconnectAttempts } = useWebSocketEarnings(user?.telegramId);
  const [connectionLog, setConnectionLog] = useState<string[]>([]);

  useEffect(() => {
    const log = `WebSocket Status: ${isConnected ? 'Connected' : 'Disconnected'} | Last Update: ${lastUpdate || 'None'} | Reconnect Attempts: ${reconnectAttempts}`;
    setConnectionLog(prev => [log, ...prev.slice(0, 9)]); // Keep last 10 logs
  }, [isConnected, lastUpdate, reconnectAttempts]);

  return (
    <div className="minimal-card">
      <h3 className="text-lg font-medium mb-4">WebSocket Earnings Connection Test</h3>
      
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        <div className="text-sm text-gray-600">
          Last Update: {lastUpdate || 'None'}
        </div>
        
        <div className="text-sm text-gray-600">
          Reconnect Attempts: {reconnectAttempts}
        </div>
        
        <div className="text-sm text-gray-600">
          User ID: {user?.telegramId || 'Not authenticated'}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Connection Log:</h4>
        <div className="bg-gray-100 p-2 rounded text-xs font-mono max-h-32 overflow-y-auto">
          {connectionLog.map((log, index) => (
            <div key={index} className="text-gray-700">
              {new Date().toLocaleTimeString()}: {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
