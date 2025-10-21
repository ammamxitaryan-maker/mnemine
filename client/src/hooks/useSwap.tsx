import { api } from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

interface SwapParams {
  telegramId: string;
  amount: number;
}

interface SwapResult {
  message: string;
  USDEquivalent?: number;
  NONAmount: number;
  rate: number;
}

interface ExchangeRate {
  rate: number;
  baseRate: number;
  variation: number;
  lastUpdated: string;
}

// Convert NON to USD equivalent (display only)
const swapNONoNON = async ({ telegramId, amount }: SwapParams): Promise<SwapResult> => {
  const { data } = await api.post(`/user/${telegramId}/swap/USD-to-NON`, { amount });
  return data;
};

// Convert NON to USD equivalent (display only)
const swapNONToUSD = async ({ telegramId, amount }: SwapParams): Promise<SwapResult> => {
  const { data } = await api.post(`/user/${telegramId}/swap/NON-to-USD`, { amount });
  return data;
};

// Get current exchange rate
const fetchExchangeRate = async (telegramId: string): Promise<ExchangeRate> => {
  const { data } = await api.get(`/user/${telegramId}/swap/rate`);
  return data;
};

export const useSwapNONoNON = (telegramId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => swapNONoNON({ telegramId, amount }),
    onSuccess: () => {
      // Invalidate user data to refresh balances
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['walletData', telegramId] });
    }
  });
};

export const useSwapNONToUSD = (telegramId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (amount: number) => swapNONToUSD({ telegramId, amount }),
    onSuccess: () => {
      // Invalidate user data to refresh balances
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['walletData', telegramId] });
    }
  });
};

export const useExchangeRate = (telegramId: string) => {
  return useQuery<ExchangeRate, Error>({
    queryKey: ['exchangeRate', telegramId],
    queryFn: () => fetchExchangeRate(telegramId),
    enabled: !!telegramId,
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes for rate updates
  });
};


