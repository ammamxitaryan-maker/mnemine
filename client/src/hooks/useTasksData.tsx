import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface Task {
  id: string;
  taskId: string;
  title: string;
  description: string;
  reward: number;
  link: string;
  isCompleted: boolean;
}

const fetchTasksData = async (telegramId: string): Promise<Task[]> => {
  // Исправлено: убран лишний '/api/' из пути, так как он уже есть в baseURL.
  const { data } = await api.get(`/tasks/${telegramId}`);
  return data;
};

export const useTasksData = (telegramId: string | undefined) => {
  return useQuery<Task[], Error>({
    queryKey: ['tasks', telegramId],
    queryFn: () => fetchTasksData(telegramId!),
    enabled: !!telegramId,
    refetchInterval: 60000, // Refetch every minute
  });
};