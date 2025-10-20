/**
 * Client-side earnings calculation utilities
 * Centralizes earnings calculation logic to eliminate duplication
 */

export interface SlotEarningsData {
  principal: number;
  effectiveWeeklyRate: number;
  startAt: string | Date;
  lastAccruedAt?: string | Date;
  isActive: boolean;
  expiresAt?: string | Date;
}

export interface EarningsCalculationResult {
  earnings: number;
  timeElapsedMs: number;
  timeElapsedHours: number;
  hourlyRate: number;
  isValid: boolean;
}

/**
 * Calculate earnings from a mining slot (client-side)
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

  // Convert string dates to Date objects
  const startDate = typeof startAt === 'string' ? new Date(startAt) : startAt;
  const lastAccruedDate = lastAccruedAt ? (typeof lastAccruedAt === 'string' ? new Date(lastAccruedAt) : lastAccruedAt) : startDate;

  const timeElapsedMs = currentTime.getTime() - lastAccruedDate.getTime();
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
 * Calculate total invested amount in active slots
 * @param slots Array of slot data
 * @returns Total invested amount
 */
export const calculateTotalInvested = (slots: SlotEarningsData[]): number => {
  const activeSlots = slots.filter(slot =>
    slot.isActive &&
    (!slot.expiresAt || new Date(slot.expiresAt) > new Date())
  );

  return activeSlots.reduce((sum, slot) => sum + (slot.principal || 0), 0);
};

/**
 * Calculate active slots count
 * @param slots Array of slot data
 * @returns Number of active slots
 */
export const calculateActiveSlotsCount = (slots: SlotEarningsData[]): number => {
  return slots.filter(slot =>
    slot.isActive &&
    (!slot.expiresAt || new Date(slot.expiresAt) > new Date())
  ).length;
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

  const startDate = typeof startAt === 'string' ? new Date(startAt) : startAt;
  const lastAccruedDate = lastAccruedAt ? (typeof lastAccruedAt === 'string' ? new Date(lastAccruedAt) : lastAccruedAt) : startDate;

  const timeElapsedMs = currentTime.getTime() - lastAccruedDate.getTime();
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
 * Format earnings for display
 * @param earnings Earnings amount
 * @param currency Currency code
 * @param decimals Number of decimal places
 * @returns Formatted earnings string
 */
export const formatEarnings = (earnings: number, currency: string = 'NON', decimals: number = 4): string => {
  return `${earnings.toFixed(decimals)} ${currency}`;
};

/**
 * Calculate earnings per hour for a slot
 * @param slotData Slot data
 * @returns Earnings per hour
 */
export const calculateEarningsPerHour = (slotData: SlotEarningsData): number => {
  const { principal, effectiveWeeklyRate } = slotData;
  const hourlyRate = effectiveWeeklyRate / (24 * 7);
  return principal * hourlyRate;
};

/**
 * Calculate time until next earnings update
 * @param lastAccruedAt Last accrued time
 * @param updateIntervalHours Update interval in hours
 * @returns Time until next update in milliseconds
 */
export const calculateTimeUntilNextUpdate = (
  lastAccruedAt: string | Date,
  updateIntervalHours: number = 1
): number => {
  const lastAccrued = typeof lastAccruedAt === 'string' ? new Date(lastAccruedAt) : lastAccruedAt;
  const nextUpdate = new Date(lastAccrued.getTime() + (updateIntervalHours * 60 * 60 * 1000));
  const now = new Date();

  return Math.max(0, nextUpdate.getTime() - now.getTime());
};
