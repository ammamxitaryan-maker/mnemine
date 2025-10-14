/**
 * Console replacement utility
 * Provides drop-in replacement for console methods with structured logging
 */

import { logger, LogContext } from './logger.js';

// Store original console methods
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug,
};

// Context detection from stack trace
const detectContext = (): LogContext => {
  const stack = new Error().stack;
  if (!stack) return LogContext.SERVER;

  // Simple context detection based on file path
  if (stack.includes('websocket')) return LogContext.WEBSOCKET;
  if (stack.includes('database') || stack.includes('prisma')) return LogContext.DATABASE;
  if (stack.includes('auth') || stack.includes('login')) return LogContext.AUTH;
  if (stack.includes('telegram') || stack.includes('bot')) return LogContext.TELEGRAM;
  if (stack.includes('api') || stack.includes('routes')) return LogContext.API;
  if (stack.includes('performance')) return LogContext.PERFORMANCE;
  if (stack.includes('security')) return LogContext.SECURITY;
  if (stack.includes('business') || stack.includes('slot') || stack.includes('lottery')) return LogContext.BUSINESS;
  
  return LogContext.SERVER;
};

// Enhanced console replacement
export const replaceConsole = (): void => {
  // Only replace in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_CONSOLE_REPLACEMENT) {
    return;
  }

  console.log = (...args: any[]) => {
    const context = detectContext();
    const message = args.length > 0 ? String(args[0]) : '';
    const data = args.length > 1 ? args.slice(1) : undefined;
    
    logger.info(context, message, data);
  };

  console.info = (...args: any[]) => {
    const context = detectContext();
    const message = args.length > 0 ? String(args[0]) : '';
    const data = args.length > 1 ? args.slice(1) : undefined;
    
    logger.info(context, message, data);
  };

  console.warn = (...args: any[]) => {
    const context = detectContext();
    const message = args.length > 0 ? String(args[0]) : '';
    const data = args.length > 1 ? args.slice(1) : undefined;
    
    logger.warn(context, message, data);
  };

  console.error = (...args: any[]) => {
    const context = detectContext();
    const message = args.length > 0 ? String(args[0]) : '';
    const data = args.length > 1 ? args.slice(1) : undefined;
    
    logger.error(context, message, data);
  };

  console.debug = (...args: any[]) => {
    const context = detectContext();
    const message = args.length > 0 ? String(args[0]) : '';
    const data = args.length > 1 ? args.slice(1) : undefined;
    
    logger.debug(context, message, data);
  };
};

// Restore original console methods
export const restoreConsole = (): void => {
  console.log = originalConsole.log;
  console.info = originalConsole.info;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.debug = originalConsole.debug;
};

// Smart console replacement that preserves important logs
export const smartConsoleReplacement = (): void => {
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_CONSOLE_REPLACEMENT) {
    return;
  }

  const originalLog = console.log;
  
  console.log = (...args: any[]) => {
    const message = String(args[0] || '');
    
    // Preserve important logs even in production
    if (message.includes('[CRITICAL]') || 
        message.includes('[ERROR]') || 
        message.includes('[WARN]') ||
        message.includes('Failed to') ||
        message.includes('Error:') ||
        message.includes('Exception:')) {
      originalLog(...args);
      return;
    }

    // Replace with structured logging
    const context = detectContext();
    const data = args.length > 1 ? args.slice(1) : undefined;
    logger.info(context, message, data);
  };
};

// Export for easy import
export default {
  replaceConsole,
  restoreConsole,
  smartConsoleReplacement,
};
