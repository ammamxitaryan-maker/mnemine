import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface SwapParams {
  telegramId: string;
  amount: number;
}

interface SwapResult {
  message: string;
  cfmAmount: number;
  cfmtAmount: number;
  rate: number;
}

interface ExchangeRate {
  rate: number;
  baseRate: number;
  variation: number;
  lastUpdated: string;
}

// Swap CFM to CFMT
const swapCfmToCfmt = async ({ telegramId, amount }: SwapParams): Promise<SwapResult> => {
  const { data } = await api.post(`/user/${telegramId}/swap/cfm-to-cfmt`, { amount });
  return data;
};

// Swap CFMT to CFM
const swapCfmtToCfm = async ({ telegramId, amount }: SwapParams): Promise<SwapResult> => {
  const { data } = await api.post(`/user/${telegramId}/swap/cfmt-to-cfm`, { amount });
  return data;
};

// Get current exchange rate
const fetchExchangeRate = async (telegramId: string): Promise<ExchangeRate> => {
  const { data } = await api.get(`/user/${telegramId}/swap/rate`);
  return data;
};

export const useSwapCfmToCfmt = (telegramId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (amount: number) => swapCfmToCfmt({ telegramId, amount }),
    onSuccess: () => {
      // Invalidate user data to refresh balances
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['walletData', telegramId] });
    }
  });
};

export const useSwapCfmtToCfm = (telegramId: string) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (amount: number) => swapCfmtToCfm({ telegramId, amount }),
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

