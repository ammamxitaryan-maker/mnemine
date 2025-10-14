import { useState, useEffect, useRef, useCallback } from 'react';

interface LocalEarningsData {
  baseEarnings: number;
  lastSyncTime: number;
  earningsPerSecond: number;
  totalSlots: number;
  activeSlots: number;
}

interface SlotData {
  id: string;
  isActive: boolean;
  earningsPerSecond: number;
  [key: string]: unknown;
}

interface UseLocalEarningsCacheProps {
  serverEarnings: number;
  serverSlotsData: SlotData[];
  syncInterval?: number; // Default 30 seconds
  animationInterval?: number; // Default 100ms for smooth animation
}

export const useLocalEarningsCache = ({
  serverEarnings,
  serverSlotsData,
  syncInterval = 30000, // 30 seconds
  animationInterval = 100 // 100ms for smooth animation
}: UseLocalEarningsCacheProps) => {
  const [localEarnings, setLocalEarnings] = useState(serverEarnings);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastServerEarnings = useRef(serverEarnings);
  const lastServerSlots = useRef(serverSlotsData);
  const animationStartTime = useRef<number>(Date.now());
  const animationFrameId = useRef<number | null>(null);
  const syncTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const lastSyncTime = useRef<number>(Date.now());

  // Calculate earnings per second from slots data
  const calculateEarningsPerSecond = useCallback((slots: SlotData[]) => {
    if (!slots || slots.length === 0) return 0;
    
    const now = new Date();
    let totalEarningsPerSecond = 0;
    
    slots.forEach(slot => {
      if (slot.isActive && typeof slot.expiresAt === 'string' && new Date(slot.expiresAt) > now) {
        // All slots have 30% weekly rate (0.3)
        const weeklyRate = 0.3;
        const principal = typeof slot.principal === 'number' ? slot.principal : 0;
        const earningsPerSecond = (principal * weeklyRate) / (7 * 24 * 60 * 60);
        totalEarningsPerSecond += earningsPerSecond;
      }
    });
    
    return totalEarningsPerSecond;
  }, []);

  // Calculate accumulated earnings since last sync
  const calculateAccumulatedEarnings = useCallback((baseEarnings: number, slots: SlotData[], timeSinceLastSync: number) => {
    const earningsPerSecond = calculateEarningsPerSecond(slots);
    const accumulatedEarnings = earningsPerSecond * timeSinceLastSync;
    return baseEarnings + accumulatedEarnings;
  }, [calculateEarningsPerSecond]);

  // Smooth animation function - memoized to prevent memory leaks
  const animateEarnings = useCallback(() => {
    const now = Date.now();
    const elapsedTime = now - animationStartTime.current;
    const elapsedSeconds = elapsedTime / 1000;
    
    const earningsPerSecond = calculateEarningsPerSecond(lastServerSlots.current);
    const animatedEarnings = lastServerEarnings.current + (earningsPerSecond * elapsedSeconds);
    
    setLocalEarnings(animatedEarnings);
    
    if (isAnimating) {
      animationFrameId.current = requestAnimationFrame(animateEarnings);
    }
  }, [calculateEarningsPerSecond, isAnimating]);

  // Start animation
  const startAnimation = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
    }
    
    setIsAnimating(true);
    animationStartTime.current = Date.now();
    animationFrameId.current = requestAnimationFrame(animateEarnings);
  }, [animateEarnings]);

  // Stop animation
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
  }, []);

  // Sync with server data - optimized to avoid expensive JSON.stringify
  const syncWithServer = useCallback(() => {
    const hasServerDataChanged = 
      serverEarnings !== lastServerEarnings.current ||
      serverSlotsData.length !== lastServerSlots.current.length ||
      serverSlotsData.some((slot, index) => {
        const lastSlot = lastServerSlots.current[index];
        return !lastSlot || 
               slot.id !== lastSlot.id || 
               slot.isActive !== lastSlot.isActive ||
               slot.principal !== lastSlot.principal ||
               slot.expiresAt !== lastSlot.expiresAt;
      });
    
    if (hasServerDataChanged) {
      const now = Date.now();
      const timeSinceLastSync = (now - lastSyncTime.current) / 1000; // Convert to seconds
      
      // Calculate accumulated earnings since last sync
      const accumulatedEarnings = calculateAccumulatedEarnings(
        serverEarnings, 
        serverSlotsData, 
        timeSinceLastSync
      );
      
      // Update local cache
      lastServerEarnings.current = serverEarnings;
      lastServerSlots.current = serverSlotsData;
      lastSyncTime.current = now;
      
      // Set earnings to accumulated value immediately
      setLocalEarnings(accumulatedEarnings);
      animationStartTime.current = now;
      
      // Restart animation if it was running
      if (isAnimating) {
        startAnimation();
      }
    }
  }, [serverEarnings, serverSlotsData, isAnimating, startAnimation, calculateAccumulatedEarnings]);

  // Initial sync to calculate accumulated earnings immediately
  useEffect(() => {
    // Calculate accumulated earnings from the start
    const now = Date.now();
    const timeSinceLastSync = (now - lastSyncTime.current) / 1000;
    const accumulatedEarnings = calculateAccumulatedEarnings(
      serverEarnings, 
      serverSlotsData, 
      timeSinceLastSync
    );
    
    setLocalEarnings(accumulatedEarnings);
    lastSyncTime.current = now;
    animationStartTime.current = now;
  }, [serverEarnings, serverSlotsData, calculateAccumulatedEarnings]);

  // Auto-sync with server every 30 seconds
  useEffect(() => {
    const scheduleNextSync = () => {
      syncTimeoutId.current = setTimeout(() => {
        syncWithServer();
        scheduleNextSync();
      }, syncInterval);
    };

    scheduleNextSync();

    return () => {
      if (syncTimeoutId.current) {
        clearTimeout(syncTimeoutId.current);
      }
    };
  }, [syncWithServer, syncInterval]);

  // Start/stop animation based on active slots
  useEffect(() => {
    const activeSlots = serverSlotsData?.filter(slot => 
      slot.isActive && typeof slot.expiresAt === 'string' && new Date(slot.expiresAt) > new Date()
    ) || [];
    
    if (activeSlots.length > 0) {
      startAnimation();
    } else {
      stopAnimation();
    }
  }, [serverSlotsData, startAnimation, stopAnimation]);

  // Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
      if (syncTimeoutId.current) {
        clearTimeout(syncTimeoutId.current);
        syncTimeoutId.current = null;
      }
    };
  }, []);

  // Manual sync function for immediate updates
  const forceSync = useCallback(() => {
    syncWithServer();
  }, [syncWithServer]);

  return {
    localEarnings,
    isAnimating,
    forceSync,
    earningsPerSecond: calculateEarningsPerSecond(serverSlotsData),
    activeSlotsCount: serverSlotsData?.filter(slot => 
      slot.isActive && typeof slot.expiresAt === 'string' && new Date(slot.expiresAt) > new Date()
    ).length || 0
  };
};
