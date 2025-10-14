import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SwapParams {
  telegramId: string;
  amount: number;
}

interface SwapResult {
  message: string;
  USDAmount: number;
  MNEAmount: number;
  rate: number;
}

interface ExchangeRate {
  rate: number;
  baseRate: number;
  variation: number;
  lastUpdated: string;
}

// Swap USD to MNE
const swapMNEoMNE = async ({ telegramId, amount }: SwapParams): Promise<SwapResult> => {
  const { data } = await api.post(`/user/${telegramId}/swap/USD-to-MNE`, { amount });
  return data;
};

// Swap MNE to USD
const swapMNEToUSD = async ({ telegramId, amount }: SwapParams): Promise<SwapResult> => {
  const { data } = await api.post(`/user/${telegramId}/swap/MNE-to-USD`, { amount });
  return data;
};

// Get current exchange rate
const fetchExchangeRate = async (telegramId: string): Promise<ExchangeRate> => {
  const { data } = await api.get(`/user/${telegramId}/swap/rate`);
  return data;
};

export const useSwapMNEoMNE = (telegramId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (amount: number) => swapMNEoMNE({ telegramId, amount }),
    onSuccess: () => {
      // Invalidate user data to refresh balances
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['walletData', telegramId] });
    }
  });
};

export const useSwapMNEToUSD = (telegramId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (amount: number) => swapMNEToUSD({ telegramId, amount }),
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
    refetchInterval: 5000, // Refresh every 5 seconds for rate updates
  });
};


