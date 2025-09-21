import { Loader2, CheckSquare, Target, Award } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTasksData, Task } from '@/hooks/useTasksData';
import { TaskCard } from '@/components/TaskCard';
import { PageLayout } from '@/components/PageLayout';
import { ModernCard } from '@/components/ModernCard';
import { motion } from 'framer-motion';

const Tasks = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksData(user?.telegramId); // Добавлен error

  const isLoading = authLoading || tasksLoading;

  const completedTasks = tasksData?.filter(task => task.isCompleted) ?? [];
  const activeTasks = tasksData?.filter(task => !task.isCompleted) ?? [];

  if (error) {
    console.error(`[Tasks] Error fetching tasks for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load tasks.</p>;
  }

  return (
    <PageLayout
      title={t('tasks.title')}
      subtitle={t('tasks.subtitle')}
      icon={CheckSquare}
      iconColor="from-green-500 to-emerald-600"
    >
      {isLoading ? (
        <motion.div 
          className="flex justify-center items-center py-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}...</p>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* Task Statistics */}
          <motion.section 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <ModernCard
              title={t('tasks.activeTasks')}
              icon={Target}
              iconColor="from-blue-500 to-indigo-600"
              delay={0.1}
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {activeTasks.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('tasks.availableToComplete')}
                </p>
              </div>
            </ModernCard>

            <ModernCard
              title={t('tasks.completedTasks')}
              icon={CheckSquare}
              iconColor="from-green-500 to-emerald-600"
              delay={0.2}
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {completedTasks.length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('tasks.finishedToday')}
                </p>
              </div>
            </ModernCard>

            <ModernCard
              title={t('tasks.totalRewards')}
              icon={Award}
              iconColor="from-purple-500 to-pink-600"
              delay={0.3}
            >
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {tasksData?.reduce((sum, task) => sum + (task.reward || 0), 0) || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('tasks.cfmAvailable')}
                </p>
              </div>
            </ModernCard>
          </motion.section>

          {/* Tasks List */}
          <motion.section
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <div className="space-y-4">
              {tasksData?.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ y: -2 }}
                  className="transform transition-transform duration-300"
                >
                  <TaskCard task={task} telegramId={user?.telegramId} />
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>
      )}
    </PageLayout>
  );
};

export default Tasks;