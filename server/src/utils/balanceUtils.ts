/**
 * Utility functions for balance calculations
 * Centralizes balance calculation logic to avoid duplication
 */

/**
 * Calculate available balance from user wallets
 * @param wallets Array of user wallets
 * @returns Available balance in NON currency
 */
export const calculateAvailableBalance = (wallets: Array<{ currency: string; balance: number }>): number => {
  return wallets
    .filter(w => w.currency === 'NON')
    .reduce((sum, w) => sum + w.balance, 0);
};

/**
 * Calculate USD balance from user wallets
 * @param wallets Array of user wallets
 * @returns USD balance
 */
export const calculateUSDBalance = (wallets: Array<{ currency: string; balance: number }>): number => {
  return wallets
    .filter(w => w.currency === 'USD')
    .reduce((sum, w) => sum + w.balance, 0);
};

/**
 * Validate balance operation
 * @param currentBalance Current balance
 * @param amount Amount to validate (can be negative for withdrawals)
 * @returns Validation result object
 */
export const validateBalanceOperation = (currentBalance: number, amount: number): { isValid: boolean; isNegative: boolean } => {
  const isNegative = currentBalance + amount < 0;
  const isValid = !isNegative && amount !== 0;
  
  return { isValid, isNegative };
};