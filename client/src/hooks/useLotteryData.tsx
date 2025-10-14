import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';

export interface Lottery {
  id: string;
  drawDate: string;
  jackpot: number;
  winningNumbers?: string | null;
}

export interface LotteryTicket {
  id: string;
  numbers: string; // Comma-separated
}

const fetchLotteryStatus = async (): Promise<Lottery> => {
  const { data } = await api.get('/lottery/status');
  return data;
};

const fetchUserTickets = async (telegramId: string): Promise<LotteryTicket[]> => {
  const { data } = await api.get(`/lottery/${telegramId}/tickets`);
  return data;
};

const fetchLastDraw = async (): Promise<Lottery | null> => {
  const { data } = await api.get('/lottery/last-draw');
  return data;
};

export const useLotteryData = () => {
  const { user } = useTelegramAuth();

  const statusQuery = useQuery<Lottery, Error>({
    queryKey: ['lotteryStatus'],
    queryFn: fetchLotteryStatus,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const ticketsQuery = useQuery<LotteryTicket[], Error>({
    queryKey: ['userLotteryTickets', user?.telegramId],
    queryFn: () => fetchUserTickets(user?.telegramId || 'guest_fallback'),
    enabled: !!user,
  });

  const lastDrawQuery = useQuery<Lottery | null, Error>({
    queryKey: ['lastLotteryDraw'],
    queryFn: fetchLastDraw,
    refetchInterval: 60000, // Refetch every minute
  });

  return {
    lottery: statusQuery.data,
    tickets: ticketsQuery.data,
    lastDraw: lastDrawQuery.data,
    isLoading: statusQuery.isLoading || ticketsQuery.isLoading || lastDrawQuery.isLoading,
    error: statusQuery.error || ticketsQuery.error || lastDrawQuery.error,
  };
};