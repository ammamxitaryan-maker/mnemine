import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserData } from '@/hooks/useUserData';
import { api } from '@/lib/api';

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user data successfully', async () => {
    const mockUserData = {
      balance: 100,
      miningPower: 50,
      accruedEarnings: 25,
      totalInvested: 200,
      referralCount: 5,
      rank: 'Gold Magnate',
    };

    vi.mocked(api.get).mockResolvedValueOnce({ data: mockUserData });

    const { result } = renderHook(() => useUserData('123456789'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUserData);
    expect(api.get).toHaveBeenCalledWith('/user/123456789/data');
  });

  it('should not fetch when telegramId is undefined', () => {
    const { result } = renderHook(() => useUserData(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isPending).toBe(true); // Changed from isIdle to isPending
    expect(api.get).not.toHaveBeenCalled();
  });

  it('should handle fetch errors', async () => {
    const error = new Error('Network error');
    vi.mocked(api.get).mockRejectedValueOnce(error);

    const { result } = renderHook(() => useUserData('123456789'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it('should refetch at specified interval', async () => {
    const mockUserData = {
      balance: 100,
      miningPower: 50,
      accruedEarnings: 25,
      totalInvested: 200,
    };

    vi.mocked(api.get).mockResolvedValue({ data: mockUserData });

    const { result } = renderHook(() => useUserData('123456789'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should be called initially
    expect(api.get).toHaveBeenCalledTimes(1);

    // Fast-forward time to trigger refetch
    vi.advanceTimersByTime(60000);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });
});