import { useState, useEffect, useCallback, useRef } from 'react';
import { useSlotsData } from './useSlotsData';
import { useUserData } from './useUserData';
import { calculateTotalEarnings, calculateSlotEarnings, MiningSlot } from '@/utils/earningsCalculator';

interface PersistentEarningsState {
  totalEarnings: number;
  perSecondRate: number;
  lastUpdateTime: number;
  isActive: boolean;
}

const STORAGE_KEY = 'persistent_earnings';
const UPDATE_INTERVAL = 1000; // 1 second

export const usePersistentEarnings = (telegramId: string) => {
  const { data: slotsData } = useSlotsData(telegramId);
  const { data: userData } = useUserData(telegramId);
  const [earnings, setEarnings] = useState<PersistentEarningsState>({
    totalEarnings: 0,
    perSecondRate: 0,
    lastUpdateTime: Date.now(),
    isActive: false
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSlotsDataRef = useRef<any[]>([]);

  // Load saved earnings from localStorage
  const loadSavedEarnings = useCallback(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_${telegramId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        const now = Date.now();
        const timeDiff = (now - parsed.lastUpdateTime) / 1000; // seconds
        
        // Calculate earnings accumulated while away
        const accumulatedEarnings = parsed.perSecondRate * timeDiff;
        
        return {
          totalEarnings: parsed.totalEarnings + accumulatedEarnings,
          perSecondRate: parsed.perSecondRate,
          lastUpdateTime: now,
          isActive: parsed.isActive
        };
      }
    } catch (error) {
      console.error('Error loading saved earnings:', error);
    }
    
    return {
      totalEarnings: 0,
      perSecondRate: 0,
      lastUpdateTime: Date.now(),
      isActive: false
    };
  }, [telegramId]);

  // Save earnings to localStorage
  const saveEarnings = useCallback((state: PersistentEarningsState) => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${telegramId}`, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving earnings:', error);
    }
  }, [telegramId]);

  // Calculate per-second rate using precise algorithm
  const calculatePerSecondRate = useCallback((slots: MiningSlot[]) => {
    if (!slots || slots.length === 0) return 0;
    
    const { totalPerSecondRate } = calculateTotalEarnings(slots);
    return totalPerSecondRate;
  }, []);

  // Initialize earnings state
  useEffect(() => {
    const savedEarnings = loadSavedEarnings();
    setEarnings(savedEarnings);
  }, [loadSavedEarnings]);

  // Update per-second rate when slots data changes
  useEffect(() => {
    if (!slotsData || !Array.isArray(slotsData)) return;

    const newPerSecondRate = calculatePerSecondRate(slotsData);
    const slotsChanged = JSON.stringify(slotsData) !== JSON.stringify(lastSlotsDataRef.current);
    
    if (slotsChanged) {
      lastSlotsDataRef.current = slotsData;
      
      setEarnings(prev => {
        const newState = {
          ...prev,
          perSecondRate: newPerSecondRate,
          isActive: newPerSecondRate > 0,
          lastUpdateTime: Date.now()
        };
        
        // If slots changed, reset total earnings to server value
        if (newPerSecondRate > 0) {
          newState.totalEarnings = userData?.accruedEarnings || 0;
        }
        
        saveEarnings(newState);
        return newState;
      });
    }
  }, [slotsData, calculatePerSecondRate, saveEarnings, userData?.accruedEarnings]);

  // Start/stop the earnings counter
  useEffect(() => {
    if (earnings.isActive && earnings.perSecondRate > 0) {
      intervalRef.current = setInterval(() => {
        setEarnings(prev => {
          const newState = {
            ...prev,
            totalEarnings: prev.totalEarnings + prev.perSecondRate,
            lastUpdateTime: Date.now()
          };
          saveEarnings(newState);
          return newState;
        });
      }, UPDATE_INTERVAL);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [earnings.isActive, earnings.perSecondRate, saveEarnings]);

  // Save earnings on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveEarnings(earnings);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [earnings, saveEarnings]);

  // Reset earnings (for testing or manual reset)
  const resetEarnings = useCallback(() => {
    const newState = {
      totalEarnings: userData?.accruedEarnings || 0,
      perSecondRate: calculatePerSecondRate(slotsData || []),
      lastUpdateTime: Date.now(),
      isActive: (slotsData || []).some(slot => 
        slot.isActive && new Date(slot.expiresAt) > new Date()
      )
    };
    
    setEarnings(newState);
    saveEarnings(newState);
  }, [userData?.accruedEarnings, calculatePerSecondRate, slotsData, saveEarnings]);

  return {
    totalEarnings: earnings.totalEarnings,
    perSecondRate: earnings.perSecondRate,
    isActive: earnings.isActive,
    resetEarnings
  };
};
