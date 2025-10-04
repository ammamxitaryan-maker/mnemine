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
    <div className="page-container flex flex-col text-white min-h-screen">
      <div className="w-full max-w-md mx-auto px-2 py-2">
        <PageHeader titleKey="tasks.title" />

        {isLoading ? (
          <div className="flex justify-center pt-6">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {tasksData?.map((task) => (
              <div key={task.id} className="w-full">
                <TaskCard task={task} telegramId={user?.telegramId} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;