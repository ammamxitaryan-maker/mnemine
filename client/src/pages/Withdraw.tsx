import { PageHeader } from '@/components/PageHeader';
import { WithdrawalChecklist } from '@/components/business/WithdrawalChecklist';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useStatsData } from '@/hooks/useStatsData';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData } from '@/hooks/useUserData';
import { api } from '@/lib/api';
import {
  FIRST_100_WITHDRAWALS_LIMIT,
  MINIMUM_WITHDRAWAL_FIRST_100,
  MINIMUM_WITHDRAWAL_REGULAR,
  WITHDRAWAL_FEE_PERCENTAGE,
  WITHDRAWAL_MIN_BALANCE_REQUIREMENT
} from '@/shared/constants';
import { dismissToast, showError, showLoading, showSuccess } from '@/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const withdrawFunds = async ({ telegramId, amount, address }: { telegramId: string, amount: number, address: string }) => {
  const { data } = await api.post(`/user/${telegramId}/withdraw`, { amount, address });
  return data;
};

const Withdraw = () => {
  const { user } = useTelegramAuth();
  const { data: userData } = useUserData(user?.telegramId);
  const { data: userStats } = useStatsData(user?.telegramId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const { t } = useTranslation();

  const mutation = useMutation({
    mutationFn: withdrawFunds,
    onMutate: async () => {
      const toastId = showLoading(t('withdraw.button.processing'));
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess(data.message || t('withdraw.success'));
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['activity', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['stats', user?.telegramId] });
      navigate('/wallet');
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || t('withdraw.error');
      showError(errorMessage);
    },
  });

  const handleWithdraw = () => {
    const withdrawAmount = parseFloat(amount);
    if (!user) {
      showError(t('withdraw.notAuthenticated'));
      return;
    }
    if (!withdrawAmount || withdrawAmount <= 0) {
      showError(t('withdraw.invalidAmount'));
      return;
    }
    if (!address) {
      showError(t('withdraw.invalidAddress'));
      return;
    }
    mutation.mutate({ telegramId: user.telegramId, amount: withdrawAmount, address });
  };

  const feePercentage = WITHDRAWAL_FEE_PERCENTAGE;
  const fee = amount ? (parseFloat(amount) * feePercentage).toFixed(4) : '0.0000';
  const receiving = amount ? (parseFloat(amount) * (1 - feePercentage)).toFixed(4) : '0.0000';

  const totalWithdrawalsMade = userStats?.totalSystemWithdrawals ?? 0;
  const minimumWithdrawal = totalWithdrawalsMade < FIRST_100_WITHDRAWALS_LIMIT
    ? MINIMUM_WITHDRAWAL_FIRST_100
    : MINIMUM_WITHDRAWAL_REGULAR;

  const currentBalance = userData?.availableBalance ?? 0;
  const parsedAmount = parseFloat(amount);

  const isWithdrawButtonDisabled = mutation.isPending ||
    !userStats?.isEligible ||
    userStats?.isSuspicious ||
    currentBalance < WITHDRAWAL_MIN_BALANCE_REQUIREMENT ||
    isNaN(parsedAmount) || parsedAmount <= 0 ||
    parsedAmount > currentBalance ||
    parsedAmount < minimumWithdrawal ||
    !address;

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="withdraw.title" backTo="/wallet" />

        <Card className="bg-gray-900/80 border-primary mb-6">
          <CardHeader>
            <CardTitle>{t('withdraw.cardTitle')}</CardTitle>
            <CardDescription className="text-gray-400">
              {t('withdraw.currentBalance')} <span className="text-gold font-bold">{currentBalance.toFixed(4)} USD</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">{t('withdraw.addressLabel')}</Label>
              <Input
                id="address"
                placeholder="T..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-gray-800 border-gray-700 h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">{t('withdraw.amountLabel')}</Label>
              <Input
                id="amount"
                type="number"
                placeholder={t('withdraw.amountPlaceholder', { amount: minimumWithdrawal.toFixed(2) })}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 h-11"
              />
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <p>{t('withdraw.fee', { feePercentage: feePercentage * 100 })} <span className="font-mono text-destructive">{fee} USD</span></p>
              <p>{t('withdraw.receiving')} <span className="font-mono text-emerald">{receiving} USD</span></p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-base py-5"
              onClick={handleWithdraw}
              disabled={isWithdrawButtonDisabled}
            >
              {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (userStats?.isEligible && !userStats?.isSuspicious ? t('withdraw.button.withdraw') : t('withdraw.button.blocked'))}
            </Button>
          </CardFooter>
        </Card>

        <WithdrawalChecklist userData={userData} userStats={userStats} />

      </div>
    </div>
  );
};

export default Withdraw;
