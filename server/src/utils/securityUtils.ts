/**
 * Security Utilities
 * Functions for generating secure keys and validating security configurations
 */

import crypto from 'crypto';

export class SecurityUtils {
  /**
   * Generate a secure random key
   */
  static generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64');
  }

  /**
   * Generate JWT secret (64 bytes for HS256)
   */
  static generateJWTSecret(): string {
    return crypto.randomBytes(64).toString('base64');
  }

  /**
   * Generate encryption key (32 bytes for AES-256)
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Generate session secret
   */
  static generateSessionSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Generate webhook secret
   */
  static generateWebhookSecret(): string {
    return crypto.randomBytes(32).toString('base64');
  }

  /**
   * Validate key strength
   */
  static validateKeyStrength(key: string, minLength: number = 32): boolean {
    if (!key || key.length < minLength) {
      return false;
    }

    // Check for common weak patterns
    const weakPatterns = [
      'password',
      'secret',
      'key',
      'admin',
      '123456',
      'abcdef',
      'qwerty',
    ];

    const lowerKey = key.toLowerCase();
    return !weakPatterns.some(pattern => lowerKey.includes(pattern));
  }

  /**
   * Generate secure admin password
   */
  static generateSecurePassword(length: number = 16): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';

    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password must be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Password should contain lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Password should contain uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Password should contain special characters');

    // Common password check
    const commonPasswords = [
      'password', '123456', 'admin', 'qwerty', 'letmein',
      'welcome', 'monkey', 'dragon', 'master', 'hello'
    ];

    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      score -= 2;
      feedback.push('Password contains common words');
    }

    return {
      isValid: score >= 4 && feedback.length === 0,
      score,
      feedback,
    };
  }

  /**
   * Generate all required security keys
   */
  static generateAllKeys() {
    return {
      JWT_SECRET: this.generateJWTSecret(),
      ENCRYPTION_KEY: this.generateEncryptionKey(),
      SESSION_SECRET: this.generateSessionSecret(),
      TELEGRAM_WEBHOOK_SECRET: this.generateWebhookSecret(),
      ADMIN_PASSWORD: this.generateSecurePassword(),
    };
  }

  /**
   * Log security configuration (without exposing secrets)
   */
  static logSecurityConfig() {
    const config = {
      hasJWTSecret: !!process.env.JWT_SECRET,
      jwtSecretLength: process.env.JWT_SECRET?.length || 0,
      hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
      encryptionKeyLength: process.env.ENCRYPTION_KEY?.length || 0,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      sessionSecretLength: process.env.SESSION_SECRET?.length || 0,
      hasWebhookSecret: !!process.env.TELEGRAM_WEBHOOK_SECRET,
      webhookSecretLength: process.env.TELEGRAM_WEBHOOK_SECRET?.length || 0,
      hasAdminPassword: !!process.env.ADMIN_PASSWORD,
      adminPasswordLength: process.env.ADMIN_PASSWORD?.length || 0,
    };

    console.log('[SECURITY] Configuration status:', config);

    // Check for weak configurations
    const warnings: string[] = [];

    if (config.jwtSecretLength < 32) {
      warnings.push('JWT_SECRET is too short (minimum 32 characters)');
    }

    if (config.encryptionKeyLength !== 32) {
      warnings.push('ENCRYPTION_KEY must be exactly 32 characters');
    }

    if (config.adminPasswordLength < 8) {
      warnings.push('ADMIN_PASSWORD is too short (minimum 8 characters)');
    }

    if (warnings.length > 0) {
      console.warn('[SECURITY] Warnings:', warnings);
    } else {
      console.log('[SECURITY] All security configurations are properly set');
    }
  }
}
