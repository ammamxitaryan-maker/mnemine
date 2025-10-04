import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Gift, Info, Loader2 } from 'lucide-react';
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
    <Card className="bg-gray-900/80 border-primary text-white h-full">
      <CardContent className="p-3 flex items-center justify-between h-full">
        <div className="flex items-center gap-3">
          <Gift className="w-6 h-6 text-gold" />
          <div>
            <p className="font-bold text-white text-sm">{task.title}</p>
            <p className="text-xs text-gray-400">{task.description}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold text-gold text-sm">
            {task.reward.toFixed(2)} CFM
          </div>
          <p className="text-xs text-gray-400">
            {task.isCompleted ? "Completed" : "Available"}
          </p>
        </div>
      </CardContent>
    </Card>
  );

  const Back = (
    <Card className="bg-gray-900/80 border-primary h-full">
      <CardContent className="p-3 flex flex-col justify-center h-full">
        <div className="text-center mb-3">
          <Info className="w-6 h-6 mb-1 text-accent mx-auto" />
          <p className="font-semibold text-white text-sm">Social Tasks</p>
          <p className="text-xs text-gray-400">Complete simple social tasks to earn quick rewards and help the project grow.</p>
        </div>
        {task.isCompleted ? (
          <Button className="w-full bg-emerald text-white font-bold text-sm py-2" disabled>
            <CheckCircle className="w-4 h-4 mr-2" />
            Completed
          </Button>
        ) : (
          <Button 
            onClick={handleClaim}
            disabled={mutation.isPending}
            className="w-full bg-accent hover:bg-accent/90 text-white font-bold text-sm py-2"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Go & Claim'}
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return <FlippableCard id={task.id} frontContent={Front} backContent={Back} />;
};