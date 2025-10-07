// Utility script to help identify and fix common 'any' type patterns
// This is a reference file for common type patterns used in the codebase

// Common API response types
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  success: boolean;
}

// Common user data types
export interface UserData {
  id: string;
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  [key: string]: unknown;
}

// Common error types
export interface ErrorResponse {
  error: string;
  message?: string;
  code?: string;
}

// Common form data types
export interface FormData {
  [key: string]: string | number | boolean | File | null;
}

// Common state types
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// Common pagination types
export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Common filter types
export interface FilterOptions {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: unknown;
}

// Type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
