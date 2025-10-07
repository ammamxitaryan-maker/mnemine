import { getErrorMessage } from '../types/errors';

// Common error handling patterns for API calls
export const handleApiError = (error: unknown, fallbackMessage: string): string => {
  return getErrorMessage(error, fallbackMessage);
};

// Type for API error responses
export interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message?: string;
}

// Type guard for API errors
export function isApiErrorResponse(error: unknown): error is ApiErrorResponse {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('response' in error || 'message' in error)
  );
}

// Utility for handling mutation errors in React Query
export const handleMutationError = (error: unknown, fallbackMessage: string): string => {
  if (isApiErrorResponse(error)) {
    return error.response?.data?.error || error.message || fallbackMessage;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallbackMessage;
};
