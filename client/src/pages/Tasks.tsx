import { Loader2 } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTasksData, Task } from '@/hooks/useTasksData'; // Импортируем Task
import { TaskCard } from '@/components/TaskCard';
import { PageHeader } from '@/components/PageHeader';

const Tasks = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksData(user?.telegramId); // Добавлен error

  const isLoading = authLoading || tasksLoading;

  if (error) {
    console.error(`[Tasks] Error fetching tasks for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load tasks.</p>;
  }

  return (
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="tasks.title" />

      {isLoading ? (
        <div className="flex justify-center pt-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {tasksData?.map((task) => (
            <TaskCard key={task.id} task={task} telegramId={user?.telegramId} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tasks;