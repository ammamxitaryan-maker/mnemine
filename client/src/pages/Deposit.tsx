import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCachedExchangeRate } from '@/hooks/useCachedExchangeRate';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { api } from '@/lib/api';
import { dismissToast, showError, showLoading, showSuccess } from '@/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

const createUSDTPayment = async ({ telegramId, mneAmount }: { telegramId: string, mneAmount: number }) => {
  // Create USDT payment for MNE purchase
  const { data } = await api.post('/payments/usdt/create', {
    telegramId,
    mneAmount,
    description: `MNE Purchase: ${mneAmount.toFixed(6)} MNE`
  });
  return data;
};

const Deposit = () => {
  const { user } = useTelegramAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const { t } = useTranslation();
  const { convertMNEToUSD, rate, isLoading: rateLoading } = useCachedExchangeRate(user?.telegramId || '');

  // Calculate USD equivalent
  const mneAmount = parseFloat(amount) || 0;
  const usdEquivalent = convertMNEToUSD(mneAmount);

  const mutation = useMutation({
    mutationFn: createUSDTPayment,
    onMutate: async () => {
      const toastId = showLoading('Creating USDT payment...');
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('USDT payment created successfully!');
      // Store payment info for the payment page
      localStorage.setItem('currentPayment', JSON.stringify(data));
      navigate('/payment/usdt', { state: { paymentData: data } });
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Failed to create payment';
      showError(errorMessage);
    },
  });

  const handleDeposit = () => {
    const mneAmount = parseFloat(amount);
    if (user && mneAmount > 0) {
      mutation.mutate({ telegramId: user.telegramId, mneAmount });
    } else {
      showError('Please enter a valid MNE amount');
    }
  };

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="deposit.title" backTo="/wallet" />

        <Card className="bg-gray-900/80 border-primary">
          <CardHeader>
            <CardTitle>Deposit MNE</CardTitle>
            <CardDescription className="text-gray-400">
              Enter the amount of MNE you want to deposit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                type="number"
                step="0.000001"
                placeholder="Enter MNE amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-xl h-12 text-center"
              />
              <div className="text-center mt-2 text-sm text-gray-400">
                MNE Amount
              </div>
            </div>

            {/* USD Equivalent Display */}
            {amount && mneAmount > 0 && (
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-300">USD Equivalent</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium text-green-500">
                      ${usdEquivalent.toFixed(2)} USD
                    </div>
                    {rate > 0 && (
                      <div className="text-xs text-gray-400">
                        Rate: {rate.toFixed(6)} MNE/USD
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {rateLoading && (
              <div className="text-center text-sm text-gray-400">
                Loading exchange rate...
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-base py-5"
              onClick={handleDeposit}
              disabled={mutation.isPending || rateLoading || !amount || mneAmount <= 0}
            >
              {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Deposit MNE'}
            </Button>
          </CardFooter>
        </Card>

        <div className="text-center mt-4 text-sm text-gray-500">
          <p>Your MNE will be converted to USD at the current exchange rate set by the admin.</p>
        </div>
      </div>
    </div>
  );
};

export default Deposit;