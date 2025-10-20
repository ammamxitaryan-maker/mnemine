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

/**
 * Calculate total balance from all wallets
 * @param wallets Array of user wallets
 * @returns Total balance across all currencies
 */
export const calculateTotalBalance = (wallets: Array<{ currency: string; balance: number }>): number => {
  return wallets.reduce((sum, w) => sum + w.balance, 0);
};

/**
 * Calculate balance by currency
 * @param wallets Array of user wallets
 * @param currency Currency to calculate balance for
 * @returns Balance for specified currency
 */
export const calculateBalanceByCurrency = (
  wallets: Array<{ currency: string; balance: number }>,
  currency: string
): number => {
  return wallets
    .filter(w => w.currency === currency)
    .reduce((sum, w) => sum + w.balance, 0);
};

/**
 * Format balance for display
 * @param balance Balance amount
 * @param currency Currency code
 * @param decimals Number of decimal places
 * @returns Formatted balance string
 */
export const formatBalance = (balance: number, currency: string = 'NON', decimals: number = 4): string => {
  return `${balance.toFixed(decimals)} ${currency}`;
};

/**
 * Check if user has sufficient balance
 * @param currentBalance Current balance
 * @param requiredAmount Required amount
 * @returns Whether user has sufficient balance
 */
export const hasSufficientBalance = (currentBalance: number, requiredAmount: number): boolean => {
  return currentBalance >= requiredAmount;
};