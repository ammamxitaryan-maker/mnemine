import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, retryRequest } from '@/lib/api';
import { AxiosError } from 'axios';

// Mock axios
vi.mock('axios');

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Request Interceptor', () => {
    it('should add timestamp to non-GET requests', () => {
      const mockRequest = {
        method: 'post',
        params: {},
        url: '/test',
        headers: {}
      };

      // Mock the interceptor
      const interceptor = api.interceptors.request.handlers[0];
      const result = interceptor.fulfilled(mockRequest);

      expect(result.params._t).toBeDefined();
      expect(typeof result.params._t).toBe('number');
    });

    it('should not add timestamp to GET requests', () => {
      const mockRequest = {
        method: 'get',
        params: {},
        url: '/test',
        headers: {}
      };

      const interceptor = api.interceptors.request.handlers[0];
      const result = interceptor.fulfilled(mockRequest);

      expect(result.params._t).toBeUndefined();
    });

    it('should add request ID header', () => {
      const mockRequest = {
        method: 'post',
        params: {},
        url: '/test',
        headers: {}
      };

      const interceptor = api.interceptors.request.handlers[0];
      const result = interceptor.fulfilled(mockRequest);

      expect(result.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
    });

    it('should add retry count header', () => {
      const mockRequest = {
        method: 'post',
        params: {},
        url: '/test',
        headers: {}
      };

      const interceptor = api.interceptors.request.handlers[0];
      const result = interceptor.fulfilled(mockRequest);

      expect(result.headers['X-Retry-Count']).toBe('0');
    });
  });

  describe('Response Interceptor', () => {
    it('should handle successful responses', () => {
      const mockResponse = {
        status: 200,
        config: { url: '/test' }
      };

      const interceptor = api.interceptors.response.handlers[0];
      const result = interceptor.fulfilled(mockResponse);

      expect(result).toBe(mockResponse);
    });

    it('should handle timeout errors', () => {
      const mockError = new AxiosError('Request timeout');
      mockError.code = 'ECONNABORTED';

      const interceptor = api.interceptors.response.handlers[0];
      const result = interceptor.rejected(mockError);

      expect(result.message).toBe('Request timeout. Please check your connection and try again.');
    });

    it('should handle 401 errors', () => {
      const mockError = new AxiosError('Unauthorized');
      mockError.response = { status: 401 } as any;

      const interceptor = api.interceptors.response.handlers[0];
      const result = interceptor.rejected(mockError);

      expect(result.message).toBe('Authentication required. Please log in again.');
    });

    it('should handle 403 errors', () => {
      const mockError = new AxiosError('Forbidden');
      mockError.response = { status: 403 } as any;

      const interceptor = api.interceptors.response.handlers[0];
      const result = interceptor.rejected(mockError);

      expect(result.message).toBe('Access denied. You do not have permission to perform this action.');
    });

    it('should handle 429 errors', () => {
      const mockError = new AxiosError('Too Many Requests');
      mockError.response = { status: 429 } as any;

      const interceptor = api.interceptors.response.handlers[0];
      const result = interceptor.rejected(mockError);

      expect(result.message).toBe('Too many requests. Please wait a moment and try again.');
    });

    it('should handle network errors', () => {
      const mockError = new AxiosError('Network Error');
      mockError.request = {} as any;

      const interceptor = api.interceptors.response.handlers[0];
      const result = interceptor.rejected(mockError);

      expect(result.message).toBe('Network error. Please check your connection and try again.');
    });
  });

  describe('Retry Request Utility', () => {
    it('should retry failed requests', async () => {
      let attemptCount = 0;
      const mockRequestFn = vi.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Network error');
        }
        return Promise.resolve('success');
      });

      const result = await retryRequest(mockRequestFn, 3, 10);

      expect(result).toBe('success');
      expect(mockRequestFn).toHaveBeenCalledTimes(3);
    });

    it('should not retry 4xx errors', async () => {
      const mockRequestFn = vi.fn().mockRejectedValue(
        new AxiosError('Bad Request', undefined, undefined, undefined, {
          status: 400,
          data: { error: 'Bad Request' }
        } as any)
      );

      await expect(retryRequest(mockRequestFn, 3, 10)).rejects.toThrow();
      expect(mockRequestFn).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retries', async () => {
      const mockRequestFn = vi.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(retryRequest(mockRequestFn, 2, 10)).rejects.toThrow('Persistent error');
      expect(mockRequestFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track request duration', () => {
      const performanceSpy = vi.spyOn(performance, 'now')
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(1500);

      const mockRequest = { url: '/test' };
      const mockResponse = { config: { url: '/test' }, status: 200 };

      const requestInterceptor = api.interceptors.request.handlers[0];
      requestInterceptor.fulfilled(mockRequest);

      const responseInterceptor = api.interceptors.response.handlers[0];
      responseInterceptor.fulfilled(mockResponse);

      expect(performanceSpy).toHaveBeenCalledTimes(2);
    });
  });
});