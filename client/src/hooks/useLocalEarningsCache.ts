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

  // Smooth animation function
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

  // Sync with server data
  const syncWithServer = useCallback(() => {
    const hasServerDataChanged = 
      serverEarnings !== lastServerEarnings.current ||
      JSON.stringify(serverSlotsData) !== JSON.stringify(lastServerSlots.current);
    
    if (hasServerDataChanged) {
      // Update local cache
      lastServerEarnings.current = serverEarnings;
      lastServerSlots.current = serverSlotsData;
      
      // Reset animation with new base value
      setLocalEarnings(serverEarnings);
      animationStartTime.current = Date.now();
      
      // Restart animation if it was running
      if (isAnimating) {
        startAnimation();
      }
    }
  }, [serverEarnings, serverSlotsData, isAnimating, startAnimation]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAnimation();
      if (syncTimeoutId.current) {
        clearTimeout(syncTimeoutId.current);
      }
    };
  }, [stopAnimation]);

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
