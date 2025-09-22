import { useTranslation } from 'react-i18next';
import { 
  CheckSquare, 
  Target, 
  Award, 
  Clock,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTasksData, Task } from '@/hooks/useTasksData';
import { TaskCard } from '@/components/TaskCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TouchButton } from '@/components/FullscreenSection';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

const TasksSimplified = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksData(user?.telegramId);

  const isLoading = authLoading || tasksLoading;

  if (error) {
    console.error(`[Tasks] Error fetching tasks for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load tasks.</p>;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading tasks...</p>
      </div>
    );
  }

  const completedTasks = tasksData?.filter(task => task.isCompleted) ?? [];
  const activeTasks = tasksData?.filter(task => !task.isCompleted) ?? [];

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-6">
        
        {/* Header */}
        <motion.header 
          className="flex items-center justify-between py-6 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <TouchButton
            onClick={() => window.history.back()}
            className="group relative px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Back</span>
          </TouchButton>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tasks</h1>
            <p className="text-gray-600 dark:text-gray-400">Complete tasks to earn rewards</p>
          </div>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </motion.header>

        {/* Task Statistics */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8"
        >
          <div className="grid grid-cols-3 gap-4">
            {[
              { 
                label: 'Active', 
                value: activeTasks.length, 
                icon: Target, 
                color: 'blue',
                description: 'Available to complete'
              },
              { 
                label: 'Completed', 
                value: completedTasks.length, 
                icon: CheckSquare, 
                color: 'green',
                description: 'Finished tasks'
              },
              { 
                label: 'Total Rewards', 
                value: `${tasksData?.reduce((sum, task) => sum + (task.reward || 0), 0).toFixed(2) || '0.00'} CFM`, 
                icon: Award, 
                color: 'purple',
                description: 'Potential earnings'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardContent className="p-4 text-center">
                    <div className={`p-3 bg-${stat.color}-100 dark:bg-${stat.color}-900/30 rounded-xl mx-auto mb-3 w-fit`}>
                      <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                      {stat.value}
                    </h3>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {stat.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Tasks Tabs */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="active" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Active ({activeTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Completed ({completedTasks.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-6">
              {activeTasks.length > 0 ? (
                <div className="space-y-4">
                  {activeTasks.map((task: Task, index: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <TaskCard 
                        task={task} 
                        onClaimReward={() => {}} 
                        isClaiming={false}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardContent className="p-8 text-center">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Active Tasks
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      All tasks are completed! Check back later for new tasks.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-6">
              {completedTasks.length > 0 ? (
                <div className="space-y-4">
                  {completedTasks.map((task: Task, index: number) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                    >
                      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">
                                  {task.title}
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {task.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700">
                                Completed
                              </Badge>
                              <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-1">
                                +{task.reward?.toFixed(2) || '0.00'} CFM
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl">
                  <CardContent className="p-8 text-center">
                    <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      No Completed Tasks
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete some tasks to see them here.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default TasksSimplified;
