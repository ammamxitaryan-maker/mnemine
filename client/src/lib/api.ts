import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? `https://${window.location.hostname}` : 'http://localhost:10112');

if (!import.meta.env.VITE_BACKEND_URL) {
  console.warn(
    "WARNING: The VITE_BACKEND_URL environment variable is not set. Using default localhost URL."
  );
}

const baseURL = `${backendUrl}/api`;

// Performance monitoring
const performanceMonitor = {
  startTime: 0,
  startRequest: (url: string) => {
    performanceMonitor.startTime = performance.now();
    if (import.meta.env.DEV) {
      console.log(`[API] Starting request to: ${url}`);
    }
  },
  endRequest: (url: string, status: number) => {
    const duration = performance.now() - performanceMonitor.startTime;
    if (import.meta.env.DEV) {
      console.log(`[API] Request to ${url} completed in ${duration.toFixed(2)}ms with status ${status}`);
    }
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`[API] Slow request detected: ${url} took ${duration.toFixed(2)}ms`);
    }
  },
};

export const api = axios.create({
  baseURL: baseURL,
  timeout: 15000, // 15 second timeout for better reliability
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  // Add request/response transformation
  transformRequest: [(data) => {
    if (data && typeof data === 'object') {
      return JSON.stringify(data);
    }
    return data;
  }],
  transformResponse: [(data) => {
    try {
      return JSON.parse(data);
    } catch (error) {
      return data;
    }
  }],
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add timestamp to prevent caching
    config.params = { ...config.params, _t: Date.now() };
    
    // Start performance monitoring
    if (config.url) {
      performanceMonitor.startRequest(config.url);
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('[API] Request interceptor error:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // End performance monitoring
    if (response.config.url) {
      performanceMonitor.endRequest(response.config.url, response.status);
    }
    return response;
  },
  (error: AxiosError) => {
    // End performance monitoring for errors
    if (error.config?.url) {
      performanceMonitor.endRequest(error.config.url, error.response?.status || 0);
    }

    // Enhanced error handling
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout');
      error.message = 'Request timeout. Please check your connection and try again.';
    } else if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;
      
      console.error('[API] Server responded with error:', status, data);
      
      // Handle specific status codes
      switch (status) {
        case 401:
          error.message = 'Authentication required. Please log in again.';
          break;
        case 403:
          error.message = 'Access denied. You do not have permission to perform this action.';
          break;
        case 404:
          error.message = 'Resource not found.';
          break;
        case 429:
          error.message = 'Too many requests. Please wait a moment and try again.';
          break;
        case 500:
          error.message = 'Server error. Please try again later.';
          break;
        default:
          error.message = data?.message || `Server error (${status})`;
      }
    } else if (error.request) {
      console.error('[API] No response received from server');
      error.message = 'Network error. Please check your connection and try again.';
    } else {
      console.error('[API] Error setting up request:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Retry utility function
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error instanceof AxiosError && error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
};