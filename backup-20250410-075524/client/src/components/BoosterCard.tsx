import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Info } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Booster as BoosterType } from '@/hooks/useBoostersData';
import { FlippableCard } from './FlippableCard';

interface BoosterCardProps {
  booster: BoosterType;
  currentBalance: number | undefined;
  telegramId: string | undefined;
}

const buyBooster = async ({ telegramId, boosterId }: { telegramId: string, boosterId: string }) => {
  const { data } = await api.post(`/user/${telegramId}/buy-booster`, { boosterId });
  return data;
};

export const BoosterCard = ({ booster, currentBalance, telegramId }: BoosterCardProps) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: buyBooster,
    onMutate: async () => {
      const toastId = showLoading('Processing purchase...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Booster purchased successfully!');
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] });
      queryClient.invalidateQueries({ queryKey: ['boosters'] });
      queryClient.invalidateQueries({ queryKey: ['achievements', telegramId] });
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Purchase failed. Please try again.';
      showError(errorMessage);
    },
  });

  const canAfford = currentBalance !== undefined && currentBalance >= booster.price;

  const Front = (
    <Card className="bg-gray-900/80 border-primary text-white h-full flex flex-col justify-between">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="text-gold" />
          {booster.name}
        </CardTitle>
        <CardDescription className="text-gray-400">
          Increases mining power by {(booster.powerIncrease * 100).toFixed(0)}% weekly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">Cost: <span className="text-gold">{booster.price.toFixed(2)} CFM</span></p>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-accent hover:bg-accent/90"
          onClick={(e) => {
            e.stopPropagation();
            if (telegramId) mutation.mutate({ telegramId, boosterId: booster.boosterId });
          }}
          disabled={!canAfford || mutation.isPending}
        >
          {mutation.isPending ? 'Processing...' : (canAfford ? 'Buy Now' : 'Insufficient Funds')}
        </Button>
      </CardFooter>
    </Card>
  );

  const Back = (
    <Card className="bg-gray-900/80 border-primary h-full flex flex-col items-center justify-center text-center">
      <CardContent className="p-4">
        <Info className="w-8 h-8 mb-2 text-accent mx-auto" />
        <p className="font-semibold text-white">Boost Your Mining</p>
        <p className="text-sm text-gray-400 mt-1">Boosters permanently increase the weekly percentage of one of your mining slots.</p>
      </CardContent>
    </Card>
  );

  return <FlippableCard id={booster.id} frontContent={Front} backContent={Back} />;
};