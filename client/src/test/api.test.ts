import { describe, it, expect, vi, beforeEach } from 'vitest';
import { api, retryRequest } from '@/lib/api';

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

  it('should have correct base configuration', () => {
    expect(api).toBeDefined();
    expect(api.defaults.timeout).toBe(15000);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should retry requests correctly', async () => {
    const mockRequest = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: 'success' });

    const result = await retryRequest(mockRequest, 3, 100);
    
    expect(result).toBe('success');
    expect(mockRequest).toHaveBeenCalledTimes(3);
  });

  it('should not retry on 4xx errors', async () => {
    const mockRequest = vi.fn().mockRejectedValue({
      response: { status: 400 },
      message: 'Bad Request'
    });

    await expect(retryRequest(mockRequest, 3, 100)).rejects.toThrow('Bad Request');
    expect(mockRequest).toHaveBeenCalledTimes(1);
  });

  it('should handle retry exhaustion', async () => {
    const mockRequest = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(retryRequest(mockRequest, 2, 10)).rejects.toThrow('Network error');
    expect(mockRequest).toHaveBeenCalledTimes(2);
  });
});
