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
  const weeklyRate = slot.effectiveWeeklyRate || 0.30; // Use actual rate from slot or fallback to 30%
  const totalReturn = principal * (1 + weeklyRate); // principal + weekly rate
  
  // Рассчитываем скорость дохода
  let dailyReturn = 0;
  let perSecondRate = 0;
  
  if (slot.isActive && remainingSeconds > 0) {
    // Calculate per-second rate using the same formula as server
    perSecondRate = (principal * weeklyRate) / (7 * 24 * 60 * 60);
    dailyReturn = perSecondRate * (24 * 60 * 60);
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
