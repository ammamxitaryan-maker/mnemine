"use client";

import { useState, useEffect } from 'react';
import { usePersistentState } from './usePersistentState';

const INITIAL_TOTAL_USERS = 1000;
const MIN_ONLINE_PERCENTAGE = 0.07; // 7%
const MAX_ONLINE_PERCENTAGE = 0.15; // 15%
const TOTAL_USERS_INCREMENT_MIN = 2;
const TOTAL_USERS_INCREMENT_MAX = 3;
const TOTAL_USERS_UPDATE_INTERVAL_MS = 60 * 60 * 1000; // Every hour
const ONLINE_USERS_UPDATE_INTERVAL_MS = 30 * 1000; // Every 30 seconds

export const useFictitiousUsers = () => {
  const [totalUsers, setTotalUsers] = usePersistentState('fictitiousTotalUsers', INITIAL_TOTAL_USERS);
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [lastTotalUpdate, setLastTotalUpdate] = usePersistentState('fictitiousLastTotalUpdate', Date.now());

  // Effect for updating total users
  useEffect(() => {
    const updateTotalUsers = () => {
      const now = Date.now();
      const elapsedHours = Math.floor((now - lastTotalUpdate) / TOTAL_USERS_UPDATE_INTERVAL_MS);

      if (elapsedHours > 0) {
        setTotalUsers(prev => {
          let newTotal = prev;
          for (let i = 0; i < elapsedHours; i++) {
            newTotal += Math.floor(Math.random() * (TOTAL_USERS_INCREMENT_MAX - TOTAL_USERS_INCREMENT_MIN + 1)) + TOTAL_USERS_INCREMENT_MIN;
          }
          return newTotal;
        });
        setLastTotalUpdate(now);
      }
    };

    updateTotalUsers(); // Initial check
    const totalUsersInterval = setInterval(updateTotalUsers, TOTAL_USERS_UPDATE_INTERVAL_MS);
    return () => clearInterval(totalUsersInterval);
  }, [lastTotalUpdate, setTotalUsers, setLastTotalUpdate]);

  // Effect for updating online users based on current total users
  useEffect(() => {
    const updateOnlineUsers = () => {
      const percentage = Math.random() * (MAX_ONLINE_PERCENTAGE - MIN_ONLINE_PERCENTAGE) + MIN_ONLINE_PERCENTAGE;
      setOnlineUsers(Math.floor(totalUsers * percentage));
    };

    updateOnlineUsers(); // Initial calculation
    const onlineUsersInterval = setInterval(updateOnlineUsers, ONLINE_USERS_UPDATE_INTERVAL_MS);
    return () => clearInterval(onlineUsersInterval);
  }, [totalUsers]);

  return { totalUsers, onlineUsers };
};