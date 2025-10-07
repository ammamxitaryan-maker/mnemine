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
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Нет заданий</h3>
              <p className="text-gray-400 text-sm">
                В текущее время нет доступных заданий.<br />
                Следите за обновлениями!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;