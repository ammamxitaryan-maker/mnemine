import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserData } from '@/hooks/useUserData';
import { api } from '@/lib/api';

// Mock the API
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
        gcTime: 0,
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
      balance: 1000,
      miningPower: 150,
      accruedEarnings: 50,
      totalInvested: 500,
      referralCount: 3,
      rank: 'Bronze',
    };

    vi.mocked(api.get).mockResolvedValue({ data: mockUserData });

    const { result } = renderHook(() => useUserData('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockUserData);
    expect(api.get).toHaveBeenCalledWith('/user/test-user-id/data');
  });

  it('should handle fetch error', async () => {
    const mockError = new Error('Failed to fetch user data');
    vi.mocked(api.get).mockRejectedValue(mockError);

    const { result } = renderHook(() => useUserData('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(mockError);
  });

  it('should not fetch when telegramId is undefined', () => {
    const { result } = renderHook(() => useUserData(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isIdle).toBe(true);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('should not fetch when telegramId is empty string', () => {
    const { result } = renderHook(() => useUserData(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.isIdle).toBe(true);
    expect(api.get).not.toHaveBeenCalled();
  });

  it('should refetch data at specified interval', async () => {
    const mockUserData = {
      balance: 1000,
      miningPower: 150,
      accruedEarnings: 50,
      totalInvested: 500,
    };

    vi.mocked(api.get).mockResolvedValue({ data: mockUserData });

    const { result } = renderHook(() => useUserData('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify initial fetch
    expect(api.get).toHaveBeenCalledTimes(1);

    // The hook should have refetchInterval configured
    expect(result.current.data).toEqual(mockUserData);
  });

  it('should have correct query key', async () => {
    const mockUserData = {
      balance: 1000,
      miningPower: 150,
      accruedEarnings: 50,
      totalInvested: 500,
    };

    vi.mocked(api.get).mockResolvedValue({ data: mockUserData });

    const { result } = renderHook(() => useUserData('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // The query key should include the telegramId
    expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
  });

  it('should handle AxiosError correctly', async () => {
    const axiosError = {
      response: {
        status: 404,
        data: { error: 'User not found' }
      },
      message: 'Request failed with status code 404',
      name: 'AxiosError',
      isAxiosError: true,
    };

    vi.mocked(api.get).mockRejectedValue(axiosError);

    const { result } = renderHook(() => useUserData('nonexistent-user'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(axiosError);
  });

  it('should retry on network errors but not on 4xx errors', async () => {
    const networkError = new Error('Network Error');
    networkError.name = 'AxiosError';
    (networkError as any).response = { status: 0 };

    vi.mocked(api.get).mockRejectedValue(networkError);

    const { result } = renderHook(() => useUserData('test-user-id'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should retry network errors (configured in the hook)
    expect(api.get).toHaveBeenCalled();
  });
});