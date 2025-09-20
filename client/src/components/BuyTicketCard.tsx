import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Shuffle } from 'lucide-react';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { LOTTERY_TICKET_COST } from 'shared';

interface BuyTicketCardProps {
  telegramId: string; // Add telegramId as a prop
}

const buyTicket = async ({ telegramId, numbers }: { telegramId: string; numbers: number[] }) => {
  const { data } = await api.post(`/lottery/${telegramId}/buy`, { numbers });
  return data;
};

export const BuyTicketCard = ({ telegramId }: BuyTicketCardProps) => { // Accept telegramId as prop
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const numbersToPick = 6;
  const maxNumber = 49;

  const mutation = useMutation({
    mutationFn: buyTicket,
    onMutate: async () => {
      const toastId = showLoading('Purchasing ticket...');
      return { toastId };
    },
    onSuccess: () => {
      dismissToast(mutation.context?.toastId);
      showSuccess('Ticket purchased successfully!');
      setSelectedNumbers([]);
      queryClient.invalidateQueries({ queryKey: ['userLotteryTickets', telegramId] }); // Use prop telegramId
      queryClient.invalidateQueries({ queryKey: ['userData', telegramId] }); // Use prop telegramId
      queryClient.invalidateQueries({ queryKey: ['lotteryStatus'] });
    },
    onError: (error: any) => {
      dismissToast(mutation.context?.toastId);
      showError(error.response?.data?.error || 'Failed to purchase ticket.');
    },
  });

  const handleNumberClick = (num: number) => {
    setSelectedNumbers(prev =>
      prev.includes(num)
        ? prev.filter(n => n !== num)
        : prev.length < numbersToPick
        ? [...prev, num]
        : prev
    );
  };

  const handleQuickPick = () => {
    const picked = new Set<number>();
    while (picked.size < numbersToPick) {
      picked.add(Math.floor(Math.random() * maxNumber) + 1);
    }
    setSelectedNumbers(Array.from(picked));
  };

  const handleBuy = () => {
    if (telegramId && selectedNumbers.length === numbersToPick) { // Use prop telegramId
      mutation.mutate({ telegramId, numbers: selectedNumbers });
    }
  };

  return (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-accent">
      <CardHeader>
        <CardTitle>{t('lottery.buyTicket')}</CardTitle>
        <CardDescription className="text-gray-400">{t('lottery.pickNumbers', { count: numbersToPick })}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {Array.from({ length: maxNumber }, (_, i) => i + 1).map(num => (
            <Button
              key={num}
              variant={selectedNumbers.includes(num) ? 'default' : 'outline'}
              size="icon"
              className={`w-9 h-9 rounded-full ${selectedNumbers.includes(num) ? 'bg-accent' : 'border-gray-600'}`}
              onClick={() => handleNumberClick(num)}
            >
              {num}
            </Button>
          ))}
        </div>
        <div className="flex justify-center">
            <Button variant="ghost" onClick={handleQuickPick}>
                <Shuffle className="w-4 h-4 mr-2" />
                {t('lottery.quickPick')}
            </Button>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full bg-accent hover:bg-accent/90 text-lg py-6"
          disabled={selectedNumbers.length !== numbersToPick || mutation.isPending}
          onClick={handleBuy}
        >
          {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : t('lottery.buyFor', { cost: LOTTERY_TICKET_COST.toFixed(2) })}
        </Button>
      </CardFooter>
    </Card>
  );
};