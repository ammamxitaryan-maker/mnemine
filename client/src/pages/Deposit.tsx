import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { PageHeader } from '@/components/PageHeader';

const depositFunds = async ({ telegramId, amount }: { telegramId: string, amount: number }) => {
  // In a real app, this would interact with a payment gateway.
  // Here, we simulate a successful deposit directly to the backend.
  const { data } = await api.post(`/user/${telegramId}/deposit`, { amount });
  return data;
};

const Deposit = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: depositFunds,
    onMutate: async () => {
      const toastId = showLoading(t('deposit.button.processing'));
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess(t('deposit.success'));
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['transactions', user?.telegramId] });
      navigate('/wallet');
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || t('deposit.error');
      showError(errorMessage);
    },
  });

  const handleDeposit = () => {
    const depositAmount = parseFloat(amount);
    if (user && depositAmount > 0) {
      mutation.mutate({ telegramId: user.telegramId, amount: depositAmount });
    } else {
      showError(t('deposit.invalidAmount'));
    }
  };

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="deposit.title" backTo="/wallet" />

        <Card className="bg-gray-900/80 border-primary">
          <CardHeader>
            <CardTitle>{t('deposit.cardTitle')}</CardTitle>
            <CardDescription className="text-gray-400">
              {t('deposit.cardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              type="number"
              placeholder={t('deposit.amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800 border-gray-700 text-xl h-12 text-center"
            />
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-base py-5"
              onClick={handleDeposit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : t('deposit.button.deposit')}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center mt-4 text-sm text-gray-500">
            <p>{t('deposit.disclaimer')}</p>
        </div>
      </div>
    </div>
  );
};

export default Deposit;