import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface LeaderboardUser { // Добавлено 'export'
  firstName: string;
  username?: string;
  balance: number;
}

const fetchLeaderboardData = async (): Promise<LeaderboardUser[]> => {
  const { data } = await api.get(`/api/leaderboard`);
  return data;
};

export const useLeaderboardData = () => {
  return useQuery<LeaderboardUser[], Error>({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboardData,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};