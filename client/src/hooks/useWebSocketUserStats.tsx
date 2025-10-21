"use client";

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

// Fake user algorithm constants (same as server)
const BASE_TOTAL_USERS = 10000;
const DAILY_USER_GROWTH = 300; // 300 users per day
const MINUTE_USER_GROWTH = 0.208; // 12.5/60 = 0.208 users per minute

// Online users will be calculated as 4-7% of total users

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

// Calculate total users with deterministic growth (same algorithm as server)
const calculateTotalUsers = (now: Date): number => {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minutesSinceDayStart = (now.getTime() - dayStart.getTime()) / (1000 * 60);

  // Use deterministic calculation based on current time (same as server)
  const growthSinceDayStart = minutesSinceDayStart * MINUTE_USER_GROWTH;
  const totalUsers = Math.floor(BASE_TOTAL_USERS + growthSinceDayStart);

  return totalUsers;
};

// Calculate online users as 4-7% of total users (same as server)
const calculateOnlineUsers = (now: Date, totalUsers: number): number => {
  // Online users calculation: 4-7% of total users
  const MIN_ONLINE_PERCENTAGE = 0.04; // 4%
  const MAX_ONLINE_PERCENTAGE = 0.07; // 7%
  
  // Calculate base online users as percentage of total users
  const baseOnlinePercentage = MIN_ONLINE_PERCENTAGE + 
    (Math.random() * (MAX_ONLINE_PERCENTAGE - MIN_ONLINE_PERCENTAGE));
  
  let onlineUsers = Math.floor(totalUsers * baseOnlinePercentage);
  
  // Add small random variation (±1%) for more frequent updates
  const randomVariation = (Math.random() - 0.5) * 0.02; // ±1%
  onlineUsers = Math.floor(onlineUsers * (1 + randomVariation));
  
  // Ensure minimum of 1 online user
  return Math.max(1, onlineUsers);
};

// Calculate new users today (same algorithm as server)
const calculateNewUsersToday = (now: Date): number => {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minutesSinceDayStart = (now.getTime() - dayStart.getTime()) / (1000 * 60);

  const newUsersToday = Math.floor(minutesSinceDayStart * MINUTE_USER_GROWTH);

  return Math.max(0, newUsersToday);
};

// Fetch fake stats from server (for real-time updates every 10 seconds)
const fetchFakeStatsFromServer = async (): Promise<UserStats | null> => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';

    // Try the new fake data endpoint first
    const endpoints = [
      `${backendUrl}/api/stats/fake`, // New dedicated fake data endpoint
      `${backendUrl}/api/stats/enhanced`,
      `${backendUrl}/api/stats/simple`,
      `${backendUrl}/api/health`
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`[UserStats] Trying endpoint: ${endpoint}`);
        const response = await fetch(endpoint);

        if (response.ok) {
          const data = await response.json();
          console.log(`[UserStats] Success with ${endpoint}:`, data);

          // Check if this is a stats endpoint
          if (data.data && data.data.totalUsers) {
            const stats = data.data;
            return {
              totalUsers: stats.totalUsers,
              onlineUsers: stats.onlineUsers,
              newUsersToday: stats.newUsersToday,
              activeUsers: stats.activeUsers,
              lastUpdate: stats.lastUpdate,
              isFictitious: !stats.isRealData || stats.dataSource === 'fake-realtime'
            };
          }

          // If this is a health endpoint, we'll continue to next endpoint
          if (data.status === 'ok') {
            console.log(`[UserStats] Health endpoint works, but no stats data`);
            continue;
          }
        } else {
          console.log(`[UserStats] Endpoint ${endpoint} failed with status: ${response.status}`);
        }
      } catch (endpointError) {
        console.log(`[UserStats] Endpoint ${endpoint} error:`, endpointError);
      }
    }

    console.log('[UserStats] All server endpoints failed, using local calculation');
  } catch (error) {
    console.log('[UserStats] Server not available, using local calculation:', error);
  }
  return null;
};

// Centralized update function that fetches fake data from server every 10 seconds
const updateGlobalStats = async () => {
  const now = new Date();

  // Try to get fake data from server first (for consistency across all users)
  const serverStats = await fetchFakeStatsFromServer();

  if (serverStats) {
    // Use server fake data (consistent for all users)
    globalUserStats = {
      ...serverStats,
      isFictitious: true // Always mark as fake data
    };
    console.log('[UserStats] Updated with server fake data:', globalUserStats);
  } else {
    // Fallback to local calculation with cached total users
    const totalUsers = calculateTotalUsers(now);
    const onlineUsers = calculateOnlineUsers(now, totalUsers);
    const newUsersToday = calculateNewUsersToday(now);
    const activeUsers = Math.floor(totalUsers * 0.35); // 35% active users

    globalUserStats = {
      totalUsers,
      onlineUsers,
      newUsersToday,
      activeUsers,
      lastUpdate: now.toISOString(),
      isFictitious: true // Always use fake data
    };
    console.log('[UserStats] Updated with local fake data:', globalUserStats);
  }

  // Notify all listeners
  globalListeners.forEach(listener => listener());
};

// Start the global update interval
let globalInterval: NodeJS.Timeout | null = null;

const startGlobalUpdates = () => {
  if (!globalInterval) {
    updateGlobalStats(); // Initial update
    globalInterval = setInterval(updateGlobalStats, 10000); // Update every 10 seconds for real-time fake data
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
    // Clear any old localStorage data that might interfere with new logic
    localStorage.removeItem('fakeTotalUsers');
    localStorage.removeItem('fakeTotalUsersTime');

    // Start fetching fake data immediately when app opens
    console.log('[UserStats] App opened - starting immediate fake data fetch');
    updateGlobalStats(); // Immediate fetch on app open

    // Try to connect to WebSocket for real-time updates
    const connectWebSocket = () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';
        const wsUrl = backendUrl.replace('http', 'ws') + '/ws';

        // Add type parameter to the URL
        const wsWithType = `${wsUrl}?type=userstats&token=anonymous`;
        const ws = new WebSocket(wsWithType);

        ws.onopen = () => {
          console.log('[UserStats] WebSocket connected');
          setIsConnected(true);
          setWsConnection(ws);

          // No need to request stats - we use only fake data
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'userStats') {
              // Use server data for consistency across all users
              globalUserStats = {
                ...data.data,
                isFictitious: true // Always mark as fake data
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

  // Function to refresh fake user counter (for admin use)
  const refreshFakeUserCounter = () => {
    // Clear any old localStorage data that might interfere
    localStorage.removeItem('fakeTotalUsers');
    localStorage.removeItem('fakeTotalUsersTime');

    // Force refresh - no localStorage needed since we use deterministic calculation
    updateGlobalStats();
  };

  return {
    totalUsers: userStats.totalUsers,
    onlineUsers: userStats.onlineUsers,
    newUsersToday: userStats.newUsersToday,
    activeUsers: userStats.activeUsers,
    isConnected,
    lastUpdate: userStats.lastUpdate,
    userGrowthRate: userStats.userGrowthRate,
    peakHours: userStats.peakHours,
    timezone: userStats.timezone,
    refreshFakeUserCounter // Expose refresh function
  };
};
