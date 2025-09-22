"use client";

import { Loader2, CheckSquare, Target, Award, Clock, Star } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useTasksData, Task } from '@/hooks/useTasksData';
import { TaskCard } from '@/components/TaskCard';
import { SmartCard } from '@/components/ui/smart-card';
import { CTAButton } from '@/components/ui/cta-button';
import { EnhancedTabs, EnhancedTabsList, EnhancedTabsTrigger, EnhancedTabsContent } from '@/components/ui/enhanced-tabs';
import { EnhancedAccordion, EnhancedAccordionItem, EnhancedAccordionTrigger, EnhancedAccordionContent } from '@/components/ui/enhanced-accordion';
import { motion } from 'framer-motion';

const SimplifiedTasks = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksData(user?.telegramId);

  const isLoading = authLoading || tasksLoading;

  const completedTasks = tasksData?.filter(task => task.isCompleted) ?? [];
  const activeTasks = tasksData?.filter(task => !task.isCompleted) ?? [];
  const totalRewards = tasksData?.reduce((sum, task) => sum + (task.reward || 0), 0) || 0;

  if (error) {
    console.error(`[SimplifiedTasks] Error fetching tasks for user ${user?.telegramId}:`, error);
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <SmartCard variant="glass" className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-500 mb-4">Error Loading Tasks</h2>
          <p className="text-red-400 mb-4">Could not load tasks data.</p>
          <CTAButton onClick={() => window.location.reload()}>
            Retry
          </CTAButton>
        </SmartCard>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header */}
        <motion.header 
          className="flex items-center gap-4 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <CheckSquare className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
            <p className="text-gray-600 dark:text-gray-400">Complete tasks to earn CFM rewards</p>
          </div>
        </motion.header>

        {/* Main Content with Tabs */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <EnhancedTabs defaultValue="overview" className="w-full">
            <EnhancedTabsList variant="pills" className="mb-6">
              <EnhancedTabsTrigger value="overview">Overview</EnhancedTabsTrigger>
              <EnhancedTabsTrigger value="active">Active Tasks</EnhancedTabsTrigger>
              <EnhancedTabsTrigger value="completed">Completed</EnhancedTabsTrigger>
            </EnhancedTabsList>

            {/* Overview Tab */}
            <EnhancedTabsContent value="overview" variant="card">
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SmartCard
                    title="Active Tasks"
                    icon={Target}
                    iconColor="from-blue-500 to-indigo-600"
                    variant="minimal"
                    size="sm"
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {activeTasks.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Available to complete
                    </p>
                  </SmartCard>

                  <SmartCard
                    title="Completed Tasks"
                    icon={CheckSquare}
                    iconColor="from-green-500 to-emerald-600"
                    variant="minimal"
                    size="sm"
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {completedTasks.length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Finished today
                    </p>
                  </SmartCard>

                  <SmartCard
                    title="Total Rewards"
                    icon={Award}
                    iconColor="from-purple-500 to-pink-600"
                    variant="minimal"
                    size="sm"
                  >
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {totalRewards.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      CFM available
                    </p>
                  </SmartCard>
                </div>

                {/* Quick Actions */}
                <SmartCard
                  title="Quick Actions"
                  icon={Star}
                  iconColor="from-orange-500 to-red-600"
                  variant="glass"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CTAButton
                      onClick={() => window.location.href = '/slots'}
                      icon={Target}
                      variant="primary"
                      fullWidth
                    >
                      Start Mining
                    </CTAButton>
                    <CTAButton
                      onClick={() => window.location.href = '/referrals'}
                      icon={Star}
                      variant="secondary"
                      fullWidth
                    >
                      Invite Friends
                    </CTAButton>
                  </div>
                </SmartCard>
              </div>
            </EnhancedTabsContent>

            {/* Active Tasks Tab */}
            <EnhancedTabsContent value="active" variant="card">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : activeTasks.length > 0 ? (
                <EnhancedAccordion type="single" collapsible defaultValue="active-tasks" className="w-full">
                  <EnhancedAccordionItem value="active-tasks" variant="card">
                    <EnhancedAccordionTrigger>
                      <div className="flex items-center gap-3">
                        <Target className="w-5 h-5 text-blue-600" />
                        <span>Active Tasks ({activeTasks.length})</span>
                      </div>
                    </EnhancedAccordionTrigger>
                    <EnhancedAccordionContent>
                      <div className="space-y-4">
                        {activeTasks.map((task: Task, index: number) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <TaskCard task={task} telegramId={user?.telegramId} />
                          </motion.div>
                        ))}
                      </div>
                    </EnhancedAccordionContent>
                  </EnhancedAccordionItem>
                </EnhancedAccordion>
              ) : (
                <div className="text-center py-10">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No active tasks available</p>
                  <CTAButton onClick={() => window.location.href = '/slots'}>
                    Start Your First Investment
                  </CTAButton>
                </div>
              )}
            </EnhancedTabsContent>

            {/* Completed Tasks Tab */}
            <EnhancedTabsContent value="completed" variant="card">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : completedTasks.length > 0 ? (
                <EnhancedAccordion type="single" collapsible className="w-full">
                  <EnhancedAccordionItem value="completed-tasks" variant="card">
                    <EnhancedAccordionTrigger>
                      <div className="flex items-center gap-3">
                        <CheckSquare className="w-5 h-5 text-green-600" />
                        <span>Completed Tasks ({completedTasks.length})</span>
                      </div>
                    </EnhancedAccordionTrigger>
                    <EnhancedAccordionContent>
                      <div className="space-y-4">
                        {completedTasks.map((task: Task, index: number) => (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <TaskCard task={task} telegramId={user?.telegramId} />
                          </motion.div>
                        ))}
                      </div>
                    </EnhancedAccordionContent>
                  </EnhancedAccordionItem>
                </EnhancedAccordion>
              ) : (
                <div className="text-center py-10">
                  <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No completed tasks yet</p>
                </div>
              )}
            </EnhancedTabsContent>
          </EnhancedTabs>
        </motion.section>
      </div>
    </motion.div>
  );
};

export default SimplifiedTasks;
