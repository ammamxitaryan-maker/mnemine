import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, retryRequest } from '../../lib/api';

// Mock axios
const mockAxios = {
  create: vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    defaults: {
      baseURL: 'http://localhost:10112',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    },
  })),
};

vi.mock('axios', () => ({
  default: mockAxios,
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

  it('should handle missing backend URL gracefully', () => {
    const originalEnv = import.meta.env.VITE_BACKEND_URL;
    // @ts-ignore
    import.meta.env.VITE_BACKEND_URL = undefined;
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Re-import to test the error handling
    require('../../lib/api');
    
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

  it('should not retry on 5xx errors after max attempts', async () => {
    const error = new Error('Server error');
    // @ts-ignore
    error.response = { status: 500 };
    // @ts-ignore
    error.isAxiosError = true;
    
    const mockFn = vi.fn().mockRejectedValue(error);
    
    await expect(retryRequest(mockFn, 2, 10)).rejects.toThrow('Server error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on network errors after max attempts', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Network Error'));
    
    await expect(retryRequest(mockFn, 2, 10)).rejects.toThrow('Network Error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle non-Axios errors', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Generic error'));
    
    await expect(retryRequest(mockFn, 2, 10)).rejects.toThrow('Generic error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should respect custom retry count', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Persistent error'));
    
    await expect(retryRequest(mockFn, 5, 10)).rejects.toThrow('Persistent error');
    expect(mockFn).toHaveBeenCalledTimes(5);
  });

  it('should handle successful retry after multiple failures', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue('success');
    
    const result = await retryRequest(mockFn, 4, 10);
    
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(4);
  });
});

describe('API Error Handling', () => {
  it('should handle timeout errors', async () => {
    const timeoutError = new Error('timeout of 15000ms exceeded');
    // @ts-ignore
    timeoutError.code = 'ECONNABORTED';
    // @ts-ignore
    timeoutError.isAxiosError = true;
    
    const mockFn = vi.fn().mockRejectedValue(timeoutError);
    
    await expect(retryRequest(mockFn, 2, 10)).rejects.toThrow('timeout of 15000ms exceeded');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should handle connection errors', async () => {
    const connectionError = new Error('Network Error');
    // @ts-ignore
    connectionError.code = 'ECONNREFUSED';
    // @ts-ignore
    connectionError.isAxiosError = true;
    
    const mockFn = vi.fn().mockRejectedValue(connectionError);
    
    await expect(retryRequest(mockFn, 2, 10)).rejects.toThrow('Network Error');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});
