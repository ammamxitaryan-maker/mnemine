import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useTelegramAuth } from './useTelegramAuth';
import { Lottery, LotteryTicket } from './useLotteryData';

export interface LotteryDrawWithTickets extends Lottery {
  tickets: LotteryTicket[];
}

const fetchLotteryHistory = async (telegramId: string): Promise<LotteryDrawWithTickets[]> => {
  const { data } = await api.get(`/lottery/${telegramId}/history`);
  return data;
};

export const useLotteryHistory = () => {
  const { user } = useTelegramAuth();

  return useQuery<LotteryDrawWithTickets[], Error>({
    queryKey: ['lotteryHistory', user?.telegramId],
    queryFn: () => fetchLotteryHistory(user?.telegramId || 'guest_fallback'),
    enabled: !!user,
  });
};