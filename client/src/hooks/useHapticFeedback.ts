"use client";

import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useHapticFeedback = () => {
  const triggerHaptic = useCallback((type: HapticType = 'light') => {
    // Check if device supports haptic feedback
    if (!('vibrate' in navigator)) return;

    const patterns: Record<HapticType, number | number[]> = {
      light: 10,
      medium: 20,
      heavy: 50,
      success: [10, 50, 10],
      warning: [20, 50, 20],
      error: [50, 100, 50]
    };

    try {
      navigator.vibrate(patterns[type]);
    } catch (error) {
      console.warn('Haptic feedback not supported:', error);
    }
  }, []);

  const hapticSuccess = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const hapticWarning = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);
  const hapticError = useCallback(() => triggerHaptic('error'), [triggerHaptic]);
  const hapticLight = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const hapticMedium = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const hapticHeavy = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);

  return {
    triggerHaptic,
    hapticSuccess,
    hapticWarning,
    hapticError,
    hapticLight,
    hapticMedium,
    hapticHeavy
  };
};
