"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Loader2, 
  CheckSquare, 
  Target, 
  Award, 
  Star
} from 'lucide-react';

import { TabbedPageLayout } from '@/components/pages/TabbedPageLayout';
import { SmartCard } from '@/components/ui/smart-card';
import { CTAButton } from '@/components/ui/cta-button';
import { EnhancedAccordion, EnhancedAccordionItem, EnhancedAccordionTrigger, EnhancedAccordionContent } from '@/components/ui/enhanced-accordion';
import { usePageData } from '@/hooks/usePageData';
import { useTasksData, Task } from '@/hooks/useTasksData';
import { TaskCard } from '@/components/TaskCard';
import { motion } from 'framer-motion';

const UnifiedTasks: React.FC = () => {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = usePageData();
  const { data: tasksData, isLoading: tasksLoading, error } = useTasksData(user?.telegramId);

  const isLoading = authLoading || tasksLoading;

  const completedTasks = tasksData?.filter(task => task.isCompleted) ?? [];
  const activeTasks = tasksData?.filter(task => !task.isCompleted) ?? [];
  const totalRewards = tasksData?.reduce((sum, task) => sum + (task.reward || 0), 0) || 0;

  if (error) {
    console.error(`[UnifiedTasks] Error fetching tasks for user ${user?.telegramId}:`, error);
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

  const handleBack = () => window.history.back();

  const tabs = [
    {
      value: "overview",
      label: "Overview",
      content: (
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
      )
    },
    {
      value: "active",
      label: "Active Tasks",
      content: isLoading ? (
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
      )
    },
    {
      value: "completed",
      label: "Completed",
      content: isLoading ? (
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
      )
    }
  ];

  if (isLoading && !tasksData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen text-white p-4">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        <p className="text-gray-400 text-center">Loading tasks...</p>
      </div>
    );
  }

  return (
    <TabbedPageLayout
      title="Tasks"
      subtitle="Complete tasks to earn CFM rewards"
      icon={CheckSquare}
      iconColor="from-green-500 to-emerald-600"
      onBack={handleBack}
      tabs={tabs}
      defaultTab="overview"
    />
  );
};

export default UnifiedTasks;
