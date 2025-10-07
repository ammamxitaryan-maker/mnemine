// Common error types for API responses
export interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

// Type guard to check if error is an API error
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
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
