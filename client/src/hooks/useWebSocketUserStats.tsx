"use client";

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  newUsersToday: number;
  activeUsers: number;
  lastUpdate: string;
  isFictitious: boolean;
  userGrowthRate?: number;
  peakHours?: { start: number; end: number; description: string };
  timezone?: string;
}

// Global state to ensure all components see the same data
let globalUserStats: UserStats = {
  totalUsers: 10000,
  onlineUsers: 150,
  newUsersToday: 45,
  activeUsers: 400,
  lastUpdate: new Date().toISOString(),
  isFictitious: true
};

const globalListeners: Set<() => void> = new Set();

// Fetch stats from server
const fetchServerStats = async (): Promise<UserStats | null> => {
  try {
    const response = await api.get('/stats/users');
    if (response.data.success) {
      return response.data.data;
    }
  } catch (error) {
    console.error('[UserStats] Failed to fetch server stats:', error);
  }
  return null;
};

// Centralized update function that fetches from server
const updateGlobalStats = async () => {
  const serverStats = await fetchServerStats();

  if (serverStats) {
    globalUserStats = {
      ...serverStats,
      isFictitious: false // Server stats are real
    };
  } else {
    // Fallback to local calculation if server is unavailable
    // Only calculate total users locally, keep other stats from server if available
    const baseTotalUsers = 10000;
    const timeVariation = Math.sin(Date.now() / (1000 * 60 * 60)) * 50;
    const totalUsers = Math.floor(baseTotalUsers + timeVariation + Math.random() * 20);

    // Use cached server stats for online users if available, otherwise use fallback
    const onlineUsers = globalUserStats?.onlineUsers || 150; // Default fallback
    const newUsersToday = globalUserStats?.newUsersToday || 45; // Default fallback
    const activeUsers = globalUserStats?.activeUsers || 400; // Default fallback

    globalUserStats = {
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      lastUpdate: new Date().toISOString(),
      isFictitious: true
    };
  }

  // Notify all listeners
  globalListeners.forEach(listener => listener());
};

// Start the global update interval
let globalInterval: NodeJS.Timeout | null = null;

const startGlobalUpdates = () => {
  if (!globalInterval) {
    updateGlobalStats(); // Initial update
    globalInterval = setInterval(updateGlobalStats, 120000); // Update every 2 minutes
  }
};

const stopGlobalUpdates = () => {
  if (globalInterval) {
    clearInterval(globalInterval);
    globalInterval = null;
  }
};

export const useWebSocketUserStats = () => {
  const [userStats, setUserStats] = useState<UserStats>(globalUserStats);
  const [isConnected, setIsConnected] = useState(false);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);

  useEffect(() => {
    // Try to connect to WebSocket for real-time updates
    const connectWebSocket = () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';
        const wsUrl = backendUrl.replace('http', 'ws') + '/ws/userstats';

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log('[UserStats] WebSocket connected');
          setIsConnected(true);
          setWsConnection(ws);

          // Request initial stats
          ws.send(JSON.stringify({ type: 'requestStats' }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'userStats') {
              globalUserStats = {
                ...data.data,
                isFictitious: false
              };
              setUserStats({ ...globalUserStats });
              globalListeners.forEach(listener => listener());
            }
          } catch (error) {
            console.error('[UserStats] Error parsing WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          console.log('[UserStats] WebSocket disconnected');
          setIsConnected(false);
          setWsConnection(null);

          // Fallback to HTTP polling
          startGlobalUpdates();
        };

        ws.onerror = (error) => {
          console.error('[UserStats] WebSocket error:', error);
          setIsConnected(false);
          setWsConnection(null);

          // Fallback to HTTP polling
          startGlobalUpdates();
        };

      } catch (error) {
        console.error('[UserStats] Failed to create WebSocket connection:', error);
        // Fallback to HTTP polling
        startGlobalUpdates();
      }
    };

    // Try WebSocket connection first
    connectWebSocket();

    // Add this component as a listener
    const listener = () => setUserStats({ ...globalUserStats });
    globalListeners.add(listener);

    return () => {
      globalListeners.delete(listener);

      // Close WebSocket connection
      if (wsConnection) {
        wsConnection.close();
        setWsConnection(null);
      }

      // Only stop global updates if no other components are listening
      if (globalListeners.size === 0) {
        stopGlobalUpdates();
        setIsConnected(false);
      }
    };
  }, []);

  return {
    totalUsers: userStats.totalUsers,
    onlineUsers: userStats.onlineUsers,
    newUsersToday: userStats.newUsersToday,
    activeUsers: userStats.activeUsers,
    isConnected,
    lastUpdate: userStats.lastUpdate,
    userGrowthRate: userStats.userGrowthRate,
    peakHours: userStats.peakHours,
    timezone: userStats.timezone
  };
};
