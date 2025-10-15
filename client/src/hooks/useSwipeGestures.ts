"use client";

import { useRef, useEffect, useCallback } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  preventDefault?: boolean;
}

export const useSwipeGestures = (options: SwipeOptions = {}) => {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefault = true
  } = options;

  const elementRef = useRef<HTMLElement>(null);
  const startPos = useRef({ x: 0, y: 0 });
  const endPos = useRef({ x: 0, y: 0 });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
  }, [preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
    const touch = e.changedTouches[0];
    endPos.current = { x: touch.clientX, y: touch.clientY };

    const deltaX = endPos.current.x - startPos.current.x;
    const deltaY = endPos.current.y - startPos.current.y;

    // Determine if it's a horizontal or vertical swipe
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal swipe
      if (Math.abs(deltaX) > threshold) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }
    } else {
      // Vertical swipe
      if (Math.abs(deltaY) > threshold) {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
        }
      }
    }
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold, preventDefault]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefault });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd, preventDefault]);

  return elementRef;
};
