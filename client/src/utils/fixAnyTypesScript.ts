// Comprehensive script to fix common 'any' type patterns
// This file contains utility functions and type definitions to help fix remaining 'any' types

// Common error handling patterns
export const fixErrorHandling = (errorType: string) => {
  return `error: unknown`; // Replace 'error: any' with 'error: unknown'
};

// Common API response patterns
export const fixApiResponse = (responseType: string) => {
  return `Record<string, unknown>`; // Replace 'any' with proper type
};

// Common form data patterns
export const fixFormData = (formType: string) => {
  return `Record<string, string | number | boolean>`; // Replace 'any' with proper form type
};

// Common user data patterns
export const fixUserData = (userType: string) => {
  return `Record<string, unknown>`; // Replace 'any' with proper user type
};

// Common array data patterns
export const fixArrayData = (arrayType: string) => {
  return `unknown[]`; // Replace 'any[]' with proper array type
};

// Type definitions for common patterns
export interface CommonApiResponse {
  data: Record<string, unknown>;
  message?: string;
  success: boolean;
}

export interface CommonErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

export interface CommonFormData {
  [key: string]: string | number | boolean | File | null;
}

export interface CommonUserData {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  [key: string]: unknown;
}

// Utility functions for type conversion
export function convertAnyToUnknown(value: unknown): unknown {
  return value;
}

export function convertAnyToRecord(value: unknown): Record<string, unknown> {
  if (typeof value === 'object' && value !== null) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function convertAnyToArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  return [];
}

// Common type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

// Error message extraction
export function extractErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (isObject(error)) {
    if ('response' in error && isObject(error.response)) {
      if ('data' in error.response && isObject(error.response.data)) {
        if ('error' in error.response.data && isString(error.response.data.error)) {
          return error.response.data.error;
        }
      }
    }
    if ('message' in error && isString(error.message)) {
      return error.message;
    }
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallback;
}
