"use client";

import { useState, useEffect } from 'react';

interface UserStats {
  totalUsers: number;
  onlineUsers: number;
  newUsersToday: number;
  activeUsers: number;
  lastUpdate: string;
  isFictitious: boolean;
}

// Global state to ensure all components see the same data
let globalUserStats: UserStats = {
  totalUsers: 1250,
  onlineUsers: 150,
  newUsersToday: 45,
  activeUsers: 400,
  lastUpdate: new Date().toISOString(),
  isFictitious: true
};

const globalListeners: Set<() => void> = new Set();

// Centralized update function that all components will use
const updateGlobalStats = () => {
  const baseTotalUsers = 1250;
  const timeVariation = Math.sin(Date.now() / (1000 * 60 * 60)) * 50;
  const totalUsers = Math.floor(baseTotalUsers + timeVariation + Math.random() * 20);
  
  const onlinePercentage = 0.08 + (Math.random() * 0.07);
  const onlineUsers = Math.floor(totalUsers * onlinePercentage);
  
  const newUsersToday = Math.floor(totalUsers * (0.02 + Math.random() * 0.03));
  const activeUsers = Math.floor(totalUsers * (0.25 + Math.random() * 0.15));

  globalUserStats = {
    totalUsers,
    onlineUsers,
    newUsersToday,
    activeUsers,
    lastUpdate: new Date().toISOString(),
    isFictitious: true
  };

  // Notify all listeners
  globalListeners.forEach(listener => listener());
};

// Start the global update interval
let globalInterval: NodeJS.Timeout | null = null;

const startGlobalUpdates = () => {
  if (!globalInterval) {
    updateGlobalStats(); // Initial update
    globalInterval = setInterval(updateGlobalStats, 30000); // Update every 30 seconds
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

  useEffect(() => {
    // Start global updates if not already running
    startGlobalUpdates();
    setIsConnected(true);

    // Add this component as a listener
    const listener = () => setUserStats({ ...globalUserStats });
    globalListeners.add(listener);

    return () => {
      globalListeners.delete(listener);
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
    lastUpdate: userStats.lastUpdate
  };
};
