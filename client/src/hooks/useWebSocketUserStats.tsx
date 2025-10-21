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

// Time-based variation for online users (UTC time)
const PEAK_HOURS = { start: 14, end: 22 }; // 2 PM - 10 PM UTC
const MIN_ONLINE_USERS = 50; // Minimum online users
const MAX_ONLINE_USERS = 180; // Maximum online users

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

// Calculate total users with persistent growth (same algorithm as server)
const calculateTotalUsers = (now: Date): number => {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minutesSinceDayStart = (now.getTime() - dayStart.getTime()) / (1000 * 60);

  // Get last saved total users from localStorage
  const lastSavedUsers = localStorage.getItem('fakeTotalUsers');
  const lastSavedTime = localStorage.getItem('fakeTotalUsersTime');

  let baseUsers = BASE_TOTAL_USERS;

  if (lastSavedUsers && lastSavedTime) {
    const lastTime = new Date(lastSavedTime);
    const timeDiff = now.getTime() - lastTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);

    // Calculate growth since last save
    const growthSinceLastSave = minutesDiff * MINUTE_USER_GROWTH;
    baseUsers = Math.floor(parseInt(lastSavedUsers) + growthSinceLastSave);

    // Save updated value
    localStorage.setItem('fakeTotalUsers', baseUsers.toString());
    localStorage.setItem('fakeTotalUsersTime', now.toISOString());
  } else {
    // First time or no saved data - use day-based calculation
    const growthSinceDayStart = minutesSinceDayStart * MINUTE_USER_GROWTH;
    baseUsers = Math.floor(BASE_TOTAL_USERS + growthSinceDayStart);

    // Save initial value
    localStorage.setItem('fakeTotalUsers', baseUsers.toString());
    localStorage.setItem('fakeTotalUsersTime', now.toISOString());
  }

  return baseUsers;
};

// Calculate online users with time-based variation (50-180 range, same as server)
const calculateOnlineUsers = (now: Date, totalUsers: number): number => {
  const hour = now.getUTCHours();

  // Calculate time-based online users (50-180 range)
  let onlineUsers = MIN_ONLINE_USERS;

  if (hour >= PEAK_HOURS.start && hour <= PEAK_HOURS.end) {
    // Peak hours: linear increase from min to max
    const peakProgress = (hour - PEAK_HOURS.start) / (PEAK_HOURS.end - PEAK_HOURS.start);
    onlineUsers = MIN_ONLINE_USERS +
      (MAX_ONLINE_USERS - MIN_ONLINE_USERS) * peakProgress;
  } else if (hour > PEAK_HOURS.end) {
    // After peak hours: gradual decrease
    const hoursAfterPeak = hour - PEAK_HOURS.end;
    const decreaseFactor = Math.max(0, 1 - (hoursAfterPeak / 8));
    onlineUsers = MAX_ONLINE_USERS * decreaseFactor +
      MIN_ONLINE_USERS * (1 - decreaseFactor);
  } else {
    // Before peak hours: gradual increase
    const hoursBeforePeak = PEAK_HOURS.start - hour;
    const increaseFactor = Math.max(0, 1 - (hoursBeforePeak / 8));
    onlineUsers = MIN_ONLINE_USERS +
      (MAX_ONLINE_USERS - MIN_ONLINE_USERS) * increaseFactor;
  }

  // Add small random variation (±3%) for realism
  const randomVariation = (Math.random() - 0.5) * 0.06; // ±3%
  onlineUsers = Math.floor(onlineUsers * (1 + randomVariation));

  // Ensure within bounds
  return Math.max(MIN_ONLINE_USERS, Math.min(MAX_ONLINE_USERS, onlineUsers));
};

// Calculate new users today (same algorithm as server)
const calculateNewUsersToday = (now: Date): number => {
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const minutesSinceDayStart = (now.getTime() - dayStart.getTime()) / (1000 * 60);

  const newUsersToday = Math.floor(minutesSinceDayStart * MINUTE_USER_GROWTH);

  return Math.max(0, newUsersToday);
};

// Fetch stats from server (for initial connection)
const fetchServerStats = async (): Promise<UserStats | null> => {
  try {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:10112';
    const response = await fetch(`${backendUrl}/api/stats/enhanced`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        const stats = data.data;
        return {
          totalUsers: stats.totalUsers,
          onlineUsers: stats.onlineUsers,
          newUsersToday: stats.newUsersToday,
          activeUsers: stats.activeUsers,
          lastUpdate: stats.lastUpdate,
          isFictitious: !stats.isRealData
        };
      }
    }
  } catch (error) {
    console.log('[UserStats] Server not available, using local calculation');
  }
  return null;
};

// Centralized update function that tries server first, then uses cached data
const updateGlobalStats = async () => {
  const now = new Date();

  // Try to get data from server first (for consistency across all users)
  const serverStats = await fetchServerStats();

  if (serverStats) {
    // Use server data (consistent for all users)
    globalUserStats = {
      ...serverStats,
      isFictitious: true // Always mark as fake data
    };
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
  }

  // Notify all listeners
  globalListeners.forEach(listener => listener());
};

// Start the global update interval
let globalInterval: NodeJS.Timeout | null = null;

const startGlobalUpdates = () => {
  if (!globalInterval) {
    updateGlobalStats(); // Initial update
    globalInterval = setInterval(updateGlobalStats, 60000); // Update every 1 minute to match server cache
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

  // Function to reset fake user counter (for admin use)
  const resetFakeUserCounter = () => {
    localStorage.removeItem('fakeTotalUsers');
    localStorage.removeItem('fakeTotalUsersTime');
    // Force refresh
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
    resetFakeUserCounter // Expose reset function
  };
};
