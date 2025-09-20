import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, retryRequest } from './api';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    })),
  },
}));

describe('API Configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create axios instance with correct configuration', () => {
    expect(api).toBeDefined();
    expect(api.defaults.baseURL).toBeDefined();
    expect(api.defaults.timeout).toBe(15000);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should handle missing backend URL', () => {
    const originalEnv = import.meta.env.VITE_BACKEND_URL;
    // @ts-ignore
    import.meta.env.VITE_BACKEND_URL = undefined;
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Re-import to test the error
    require('./api');
    
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('FATAL ERROR: The VITE_BACKEND_URL environment variable is not set')
    );
    
    consoleSpy.mockRestore();
    // @ts-ignore
    import.meta.env.VITE_BACKEND_URL = originalEnv;
  });
});

describe('retryRequest', () => {
  it('should succeed on first attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    
    const result = await retryRequest(mockFn);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');
    
    const result = await retryRequest(mockFn, 3, 10);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should not retry on 4xx errors', async () => {
    const error = new Error('Client error');
    // @ts-ignore
    error.response = { status: 400 };
    // @ts-ignore
    error.isAxiosError = true;
    
    const mockFn = vi.fn().mockRejectedValue(error);
    
    await expect(retryRequest(mockFn, 3, 10)).rejects.toThrow('Client error');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should fail after max retries', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Persistent error'));
    
    await expect(retryRequest(mockFn, 2, 10)).rejects.toThrow('Persistent error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
