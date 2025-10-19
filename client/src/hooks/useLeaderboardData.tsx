import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

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
    refetchInterval: 300000, // Refetch every 5 minutes (optimized)
  });
};