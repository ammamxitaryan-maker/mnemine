export function validateEnvironment() {
  const requiredEnvVars = [
    'DATABASE_URL'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Optional but recommended environment variables
  const recommendedEnvVars = [
    'JWT_SECRET',
    'ENCRYPTION_KEY',
    'SESSION_SECRET'
  ];

  const missingRecommended = recommendedEnvVars.filter(varName => !process.env[varName]);
  
  if (missingRecommended.length > 0) {
    console.warn(`[VALIDATION] Missing recommended environment variables: ${missingRecommended.join(', ')}`);
    console.warn('[VALIDATION] These variables will use default values, which is not recommended for production');
  }

  // Validate JWT secret length if provided
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate encryption key length if provided
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    console.error('[ENV] ENCRYPTION_KEY value:', process.env.ENCRYPTION_KEY);
    console.error('[ENV] ENCRYPTION_KEY length:', process.env.ENCRYPTION_KEY.length);
    console.warn('[ENV] ENCRYPTION_KEY is not 32 characters, using fallback');
    process.env.ENCRYPTION_KEY = 'mnemine-encryption-key-32chars-1234';
  }

  // Validate database URL format
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.startsWith('postgresql://')) {
    console.warn('Warning: DATABASE_URL should be a valid PostgreSQL connection string');
  }

  console.log('[VALIDATION] Environment variables validated successfully');
}

export function validateAmount(amount: any): boolean {
  return typeof amount === 'number' && 
         !isNaN(amount) && 
         isFinite(amount) && 
         amount >= 0.001 && // Very low minimum
         amount <= 1000000; // Max 1M USD
}

export function validateAddress(address: string): boolean {
  // USD TRC20 address validation
  return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
}

export function sanitizeInput(input: string): string | null {
  if (!input || typeof input !== 'string') return null;
  
  // Remove potentially dangerous characters
  const sanitized = input
    .replace(/[<>"'%;()&+]/g, '') // Remove dangerous characters
    .trim()
    .substring(0, 1000); // Limit length
  
  return sanitized.length > 0 ? sanitized : null;
}

export function validateTelegramId(telegramId: string): boolean {
  return /^\d+$/.test(telegramId) && telegramId.length >= 5 && telegramId.length <= 20;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function validatePassword(password: string): boolean {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

