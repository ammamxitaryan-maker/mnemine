/**
 * Admin authentication utilities
 */

export const ADMIN_PASSWORD = 'nemesisN3M3616';

/**
 * Check if admin password is verified in current session
 */
export const isAdminPasswordVerified = (): boolean => {
  const verified = sessionStorage.getItem('admin_password_verified') === 'true';
  console.log('[ADMIN_AUTH] Password verified:', verified);
  return verified;
};

/**
 * Set admin password as verified
 */
export const setAdminPasswordVerified = (): void => {
  sessionStorage.setItem('admin_password_verified', 'true');
  console.log('[ADMIN_AUTH] Password verification set to true');
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
  const isValid = password === ADMIN_PASSWORD;
  console.log('[ADMIN_AUTH] Password verification attempt:', isValid);
  return isValid;
};
