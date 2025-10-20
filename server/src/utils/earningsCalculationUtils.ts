/**
 * Centralized utilities for earnings calculations
 * Eliminates duplication of earnings calculation logic across the codebase
 */

export interface SlotEarningsData {
  principal: number;
  effectiveWeeklyRate: number;
  startAt: Date;
  lastAccruedAt?: Date;
  isActive: boolean;
}

export interface EarningsCalculationResult {
  earnings: number;
  timeElapsedMs: number;
  timeElapsedHours: number;
  hourlyRate: number;
  isValid: boolean;
}

/**
 * Calculate earnings from a mining slot
 * @param slotData Slot data for calculation
 * @param currentTime Current time (defaults to now)
 * @returns Earnings calculation result
 */
export const calculateSlotEarnings = (
  slotData: SlotEarningsData,
  currentTime: Date = new Date()
): EarningsCalculationResult => {
  const { principal, effectiveWeeklyRate, startAt, lastAccruedAt, isActive } = slotData;

  // Check if slot is active
  if (!isActive) {
    return {
      earnings: 0,
      timeElapsedMs: 0,
      timeElapsedHours: 0,
      hourlyRate: 0,
      isValid: false
    };
  }

  // Use lastAccruedAt if available, otherwise use startAt
  const lastAccrued = lastAccruedAt || startAt;
  const timeElapsedMs = currentTime.getTime() - lastAccrued.getTime();
  const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

  // Minimum 1 hour between processing
  if (timeElapsedHours < 1) {
    return {
      earnings: 0,
      timeElapsedMs,
      timeElapsedHours,
      hourlyRate: 0,
      isValid: false
    };
  }

  // Calculate hourly rate from weekly rate
  const hourlyRate = effectiveWeeklyRate / (24 * 7);

  // Calculate earnings
  const earnings = principal * hourlyRate * timeElapsedHours;

  return {
    earnings: Math.max(0, earnings),
    timeElapsedMs,
    timeElapsedHours,
    hourlyRate,
    isValid: true
  };
};

/**
 * Calculate earnings for multiple slots
 * @param slots Array of slot data
 * @param currentTime Current time (defaults to now)
 * @returns Array of earnings calculation results
 */
export const calculateMultipleSlotEarnings = (
  slots: SlotEarningsData[],
  currentTime: Date = new Date()
): EarningsCalculationResult[] => {
  return slots.map(slot => calculateSlotEarnings(slot, currentTime));
};

/**
 * Calculate total earnings for a user from all their slots
 * @param slots Array of user's slot data
 * @param currentTime Current time (defaults to now)
 * @returns Total earnings amount
 */
export const calculateUserTotalEarnings = (
  slots: SlotEarningsData[],
  currentTime: Date = new Date()
): number => {
  const results = calculateMultipleSlotEarnings(slots, currentTime);
  return results.reduce((total, result) => total + result.earnings, 0);
};

/**
 * Calculate earnings with different rate strategies
 * @param slotData Slot data for calculation
 * @param strategy Rate calculation strategy
 * @param currentTime Current time (defaults to now)
 * @returns Earnings calculation result
 */
export const calculateSlotEarningsWithStrategy = (
  slotData: SlotEarningsData,
  strategy: 'weekly' | 'daily' | 'hourly' = 'weekly',
  currentTime: Date = new Date()
): EarningsCalculationResult => {
  const { principal, effectiveWeeklyRate, startAt, lastAccruedAt, isActive } = slotData;

  if (!isActive) {
    return {
      earnings: 0,
      timeElapsedMs: 0,
      timeElapsedHours: 0,
      hourlyRate: 0,
      isValid: false
    };
  }

  const lastAccrued = lastAccruedAt || startAt;
  const timeElapsedMs = currentTime.getTime() - lastAccrued.getTime();
  const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

  if (timeElapsedHours < 1) {
    return {
      earnings: 0,
      timeElapsedMs,
      timeElapsedHours,
      hourlyRate: 0,
      isValid: false
    };
  }

  let rate: number;
  let timeMultiplier: number;

  switch (strategy) {
    case 'weekly':
      rate = effectiveWeeklyRate;
      timeMultiplier = timeElapsedHours / (24 * 7);
      break;
    case 'daily':
      rate = effectiveWeeklyRate / 7;
      timeMultiplier = timeElapsedHours / 24;
      break;
    case 'hourly':
      rate = effectiveWeeklyRate / (24 * 7);
      timeMultiplier = timeElapsedHours;
      break;
    default:
      rate = effectiveWeeklyRate;
      timeMultiplier = timeElapsedHours / (24 * 7);
  }

  const earnings = principal * rate * timeMultiplier;
  const hourlyRate = effectiveWeeklyRate / (24 * 7);

  return {
    earnings: Math.max(0, earnings),
    timeElapsedMs,
    timeElapsedHours,
    hourlyRate,
    isValid: true
  };
};

/**
 * Calculate compound earnings (earnings on earnings)
 * @param slotData Slot data for calculation
 * @param compoundFrequency How often to compound (in hours)
 * @param currentTime Current time (defaults to now)
 * @returns Earnings calculation result with compound interest
 */
export const calculateCompoundSlotEarnings = (
  slotData: SlotEarningsData,
  compoundFrequency: number = 24, // Daily compounding
  currentTime: Date = new Date()
): EarningsCalculationResult => {
  const { principal, effectiveWeeklyRate, startAt, lastAccruedAt, isActive } = slotData;

  if (!isActive) {
    return {
      earnings: 0,
      timeElapsedMs: 0,
      timeElapsedHours: 0,
      hourlyRate: 0,
      isValid: false
    };
  }

  const lastAccrued = lastAccruedAt || startAt;
  const timeElapsedMs = currentTime.getTime() - lastAccrued.getTime();
  const timeElapsedHours = timeElapsedMs / (1000 * 60 * 60);

  if (timeElapsedHours < 1) {
    return {
      earnings: 0,
      timeElapsedMs,
      timeElapsedHours,
      hourlyRate: 0,
      isValid: false
    };
  }

  const hourlyRate = effectiveWeeklyRate / (24 * 7);
  const compoundPeriods = Math.floor(timeElapsedHours / compoundFrequency);
  const remainingHours = timeElapsedHours % compoundFrequency;

  let earnings = 0;
  let currentPrincipal = principal;

  // Calculate compound earnings for each period
  for (let i = 0; i < compoundPeriods; i++) {
    const periodEarnings = currentPrincipal * hourlyRate * compoundFrequency;
    earnings += periodEarnings;
    currentPrincipal += periodEarnings;
  }

  // Add earnings for remaining time
  if (remainingHours > 0) {
    earnings += currentPrincipal * hourlyRate * remainingHours;
  }

  return {
    earnings: Math.max(0, earnings),
    timeElapsedMs,
    timeElapsedHours,
    hourlyRate,
    isValid: true
  };
};

/**
 * Validate earnings calculation parameters
 * @param slotData Slot data to validate
 * @returns Validation result
 */
export const validateEarningsCalculation = (slotData: SlotEarningsData): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (slotData.principal <= 0) {
    errors.push('Principal must be greater than 0');
  }

  if (slotData.effectiveWeeklyRate < 0) {
    errors.push('Weekly rate cannot be negative');
  }

  if (slotData.effectiveWeeklyRate > 1) {
    errors.push('Weekly rate cannot exceed 100%');
  }

  if (slotData.startAt > new Date()) {
    errors.push('Start date cannot be in the future');
  }

  if (slotData.lastAccruedAt && slotData.lastAccruedAt > new Date()) {
    errors.push('Last accrued date cannot be in the future');
  }

  if (slotData.lastAccruedAt && slotData.lastAccruedAt < slotData.startAt) {
    errors.push('Last accrued date cannot be before start date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
