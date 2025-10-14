/**
 * Centralized API types for Mnemine application
 * Provides strict typing for all API requests and responses
 */

// Base API response structure
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Common query parameters
export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export interface UserFilterParams {
  userId?: string;
  telegramId?: string;
  role?: string;
  isActive?: boolean;
}

// Request context types
export interface RequestContext {
  userId?: string;
  telegramId?: string;
  role?: string;
  requestId: string;
  ip?: string;
  userAgent?: string;
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
  timestamp: string;
}

export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  field: string;
  value?: unknown;
}

export interface AuthenticationError extends ApiError {
  code: 'AUTHENTICATION_ERROR' | 'AUTHORIZATION_ERROR';
}

export interface BusinessLogicError extends ApiError {
  code: 'BUSINESS_LOGIC_ERROR';
  context?: Record<string, unknown>;
}

// Success response helpers
export const createSuccessResponse = <T>(
  data: T,
  message?: string,
  requestId?: string
): ApiResponse<T> => ({
  success: true,
  data,
  message,
  timestamp: new Date().toISOString(),
  requestId,
});

export const createErrorResponse = (
  error: string,
  code?: string,
  requestId?: string
): ApiResponse => ({
  success: false,
  error,
  timestamp: new Date().toISOString(),
  requestId,
});

// Type guards
export const isApiResponse = <T>(response: unknown): response is ApiResponse<T> => {
  return (
    typeof response === 'object' &&
    response !== null &&
    'success' in response &&
    'timestamp' in response
  );
};

export const isPaginatedResponse = <T>(response: unknown): response is PaginatedResponse<T> => {
  return isApiResponse<T[]>(response) && 'pagination' in response;
};

export const isApiError = (error: unknown): error is ApiError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'timestamp' in error
  );
};
