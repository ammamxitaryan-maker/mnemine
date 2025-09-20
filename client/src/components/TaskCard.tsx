import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Gift, Info } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Task } from '@/hooks/useTasksData';
import { FlippableCard } from './FlippableCard';

interface TaskCardProps {
  task: Task;
  telegramId: string | undefined;
}

const claimTask = async ({ telegramId, taskId }: { telegramId: string, taskId: string }) => {
  const { data } = await api.post(`/user/${telegramId}/claim-task`, { taskId });
  return data;
};

export const TaskCard = ({ task, telegramId }: TaskCardProps) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: claimTask,
    onMutate: async () => {
      const toastId = showLoading('Claiming reward...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Reward claimed!');
      queryClient.invalidateQueries({ queryKey: ['tasks', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Failed to claim. Please try again.';
      showError(errorMessage);
    },
  });

  const handleClaim = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(task.link, '_blank');
    if (telegramId) {
      mutation.mutate({ telegramId, taskId: task.taskId });
    }
  };

  const Front = (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-accent text-white h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="text-gold" />
          {task.title}
        </CardTitle>
        <CardDescription className="text-gray-400">{task.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">Reward: <span className="text-gold">{task.reward.toFixed(2)} CFM</span></p>
      </CardContent>
      <CardFooter>
        {task.isCompleted ? (
          <Button className="w-full bg-emerald" disabled>
            <CheckCircle className="w-5 h-5 mr-2" />
            Completed
          </Button>
        ) : (
          <Button
            className="w-full bg-accent hover:bg-accent/90"
            onClick={handleClaim}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Claiming...' : 'Go & Claim'}
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  const Back = (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-accent h-full flex flex-col items-center justify-center text-center">
      <CardContent className="p-4">
        <Info className="w-8 h-8 mb-2 text-accent mx-auto" />
        <p className="font-semibold text-white">Social Tasks</p>
        <p className="text-sm text-gray-400 mt-1">Complete simple social tasks to earn quick rewards and help the project grow.</p>
      </CardContent>
    </Card>
  );

  return <FlippableCard id={task.id} frontContent={Front} backContent={Back} />;
};