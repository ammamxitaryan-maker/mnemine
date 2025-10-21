import { useEffect, useState } from 'react'

interface UseSmoothNumberOptions {
  duration?: number
  easing?: (t: number) => number
  precision?: number
}

// Easing functions for smooth animations
const easingFunctions = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutQuart: (t: number) => 1 - Math.pow(1 - t, 4),
}

export const useSmoothNumber = (
  targetValue: number,
  options: UseSmoothNumberOptions = {}
) => {
  const {
    duration = 800,
    easing = easingFunctions.easeOutCubic,
    precision = 6
  } = options

  const [currentValue, setCurrentValue] = useState(targetValue)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (currentValue === targetValue) return

    setIsAnimating(true)
    const startValue = currentValue
    const difference = targetValue - startValue
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      const easedProgress = easing(progress)
      const newValue = startValue + (difference * easedProgress)
      
      setCurrentValue(Number(newValue.toFixed(precision)))

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsAnimating(false)
      }
    }

    requestAnimationFrame(animate)
  }, [targetValue, duration, easing, precision, currentValue])

  return {
    value: currentValue,
    isAnimating,
    formatted: currentValue.toFixed(precision)
  }
}

// Hook specifically for earnings with optimized settings
export const useSmoothEarnings = (earnings: number) => {
  return useSmoothNumber(earnings, {
    duration: 600,
    easing: easingFunctions.easeOutCubic,
    precision: 6
  })
}

// Hook for USD values with different precision
export const useSmoothUSD = (usdValue: number) => {
  return useSmoothNumber(usdValue, {
    duration: 500,
    easing: easingFunctions.easeOut,
    precision: 4
  })
}
