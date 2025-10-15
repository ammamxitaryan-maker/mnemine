/**
 * Точный калькулятор дохода для майнинг слотов
 * Алгоритм: за 7 дней инвестор получает свою сумму + 30%
 */

export interface SlotEarnings {
  principal: number; // Основная сумма инвестиции
  totalReturn: number; // Общая сумма возврата (principal + 30%)
  dailyReturn: number; // Дневной доход
  perSecondRate: number; // Доход в секунду
  weeklyRate: number; // Недельная ставка (30%)
  remainingDays: number; // Оставшиеся дни
  remainingSeconds: number; // Оставшиеся секунды
  isActive: boolean; // Активен ли слот
}

export interface MiningSlot {
  id: string;
  principal: number;
  isActive: boolean;
  expiresAt: string;
  effectiveWeeklyRate?: number;
}

/**
 * Рассчитывает точные параметры дохода для слота
 */
export const calculateSlotEarnings = (slot: MiningSlot): SlotEarnings => {
  const now = new Date();
  const expiresAt = new Date(slot.expiresAt);
  const remainingMs = expiresAt.getTime() - now.getTime();
  const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const remainingDays = Math.max(0, remainingMs / (1000 * 60 * 60 * 24));
  
  // Основные параметры
  const principal = slot.principal;
  const weeklyRate = 0.30; // 30% за неделю
  const totalReturn = principal * (1 + weeklyRate); // principal + 30%
  const totalEarnings = totalReturn - principal; // 30% от principal
  
  // Рассчитываем скорость дохода
  let dailyReturn = 0;
  let perSecondRate = 0;
  
  if (slot.isActive && remainingSeconds > 0) {
    // Если слот активен и время не истекло
    if (remainingDays >= 7) {
      // Если осталось 7+ дней - используем стандартную скорость
      dailyReturn = totalEarnings / 7; // 30% / 7 дней
      perSecondRate = dailyReturn / (24 * 60 * 60); // в секунду
    } else {
      // Если осталось меньше 7 дней - ускоряем для завершения
      const remainingEarnings = totalEarnings * (remainingDays / 7);
      dailyReturn = remainingEarnings / remainingDays;
      perSecondRate = remainingEarnings / remainingSeconds;
    }
  }
  
  return {
    principal,
    totalReturn,
    dailyReturn,
    perSecondRate,
    weeklyRate,
    remainingDays,
    remainingSeconds,
    isActive: slot.isActive && remainingSeconds > 0
  };
};

/**
 * Рассчитывает общий доход для всех активных слотов
 */
export const calculateTotalEarnings = (slots: MiningSlot[]): {
  totalPerSecondRate: number;
  totalDailyReturn: number;
  totalPrincipal: number;
  totalExpectedReturn: number;
  activeSlots: SlotEarnings[];
} => {
  const activeSlots = slots
    .map(calculateSlotEarnings)
    .filter(slot => slot.isActive);
  
  const totalPerSecondRate = activeSlots.reduce((sum, slot) => sum + slot.perSecondRate, 0);
  const totalDailyReturn = activeSlots.reduce((sum, slot) => sum + slot.dailyReturn, 0);
  const totalPrincipal = activeSlots.reduce((sum, slot) => sum + slot.principal, 0);
  const totalExpectedReturn = activeSlots.reduce((sum, slot) => sum + slot.totalReturn, 0);
  
  return {
    totalPerSecondRate,
    totalDailyReturn,
    totalPrincipal,
    totalExpectedReturn,
    activeSlots
  };
};

/**
 * Рассчитывает доход за определенный период времени
 */
export const calculateEarningsForPeriod = (
  slots: MiningSlot[], 
  seconds: number
): number => {
  const { totalPerSecondRate } = calculateTotalEarnings(slots);
  return totalPerSecondRate * seconds;
};

/**
 * Рассчитывает, сколько времени нужно для достижения определенной суммы
 */
export const calculateTimeToReachAmount = (
  slots: MiningSlot[], 
  targetAmount: number
): number => {
  const { totalPerSecondRate } = calculateTotalEarnings(slots);
  
  if (totalPerSecondRate <= 0) {
    return Infinity; // Невозможно достичь
  }
  
  return targetAmount / totalPerSecondRate; // секунды
};

/**
 * Форматирует время в читаемый вид
 */
export const formatTime = (seconds: number): string => {
  if (seconds === Infinity) return '∞';
  
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
};

/**
 * Проверяет, правильно ли настроен слот
 */
export const validateSlot = (slot: MiningSlot): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];
  
  if (slot.principal <= 0) {
    issues.push('Principal must be greater than 0');
  }
  
  if (!slot.isActive) {
    issues.push('Slot is not active');
  }
  
  const now = new Date();
  const expiresAt = new Date(slot.expiresAt);
  
  if (expiresAt <= now) {
    issues.push('Slot has expired');
  }
  
  const remainingDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  
  if (remainingDays > 7) {
    issues.push('Slot duration exceeds 7 days');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
};
