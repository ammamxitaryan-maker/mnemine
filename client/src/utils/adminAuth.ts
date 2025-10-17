/**
 * Admin authentication utilities
 */

export const ADMIN_PASSWORD = 'nemesisN3M3616';

/**
 * Check if admin password is verified in current session
 */
export const isAdminPasswordVerified = (): boolean => {
  return sessionStorage.getItem('admin_password_verified') === 'true';
};

/**
 * Set admin password as verified
 */
export const setAdminPasswordVerified = (): void => {
  sessionStorage.setItem('admin_password_verified', 'true');
};

/**
 * Clear admin password verification (logout)
 */
export const clearAdminPasswordVerification = (): void => {
  sessionStorage.removeItem('admin_password_verified');
};

/**
 * Verify admin password
 */
export const verifyAdminPassword = (password: string): boolean => {
  return password === ADMIN_PASSWORD;
};
