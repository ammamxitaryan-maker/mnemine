// Common error types for API responses
export interface ApiError {
  response?: {
    data?: {
      error?: string;
      code?: string;
      details?: Record<string, unknown>;
    };
  };
  message?: string;
  code?: string;
  status?: number;
}

// Extended error types
export interface ValidationError extends ApiError {
  code: 'VALIDATION_ERROR';
  field?: string;
  details?: Record<string, string[]>;
}

export interface NetworkError extends ApiError {
  code: 'NETWORK_ERROR';
  message: 'Network request failed';
}

export interface AuthError extends ApiError {
  code: 'AUTH_ERROR';
  message: 'Authentication required';
}

export interface PermissionError extends ApiError {
  code: 'PERMISSION_ERROR';
  message: 'Insufficient permissions';
}

// Type guard to check if error is an API error
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
}

// Type guards for specific error types
export function isValidationError(error: unknown): error is ValidationError {
  return isApiError(error) && error.code === 'VALIDATION_ERROR';
}

export function isNetworkError(error: unknown): error is NetworkError {
  return isApiError(error) && error.code === 'NETWORK_ERROR';
}

export function isAuthError(error: unknown): error is AuthError {
  return isApiError(error) && error.code === 'AUTH_ERROR';
}

export function isPermissionError(error: unknown): error is PermissionError {
  return isApiError(error) && error.code === 'PERMISSION_ERROR';
}

// Utility function to extract error message
export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (isApiError(error)) {
    return error.response?.data?.error || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

// Utility function to get error code
export function getErrorCode(error: unknown): string | undefined {
  if (isApiError(error)) {
    return error.code || error.response?.data?.code;
  }
  return undefined;
}

// Utility function to check if error is retryable
export function isRetryableError(error: unknown): boolean {
  if (isNetworkError(error)) return true;
  if (isApiError(error) && error.status && error.status >= 500) return true;
  return false;
}
