import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Loader2, Server, Info, PlusCircle, TrendingUp, Zap } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useSlotsData, MiningSlot } from '@/hooks/useSlotsData';
import SlotCard from '@/components/SlotCard';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { useUserData } from '@/hooks/useUserData';
import { PageHeader } from '@/components/PageHeader';
import EarningsSummary from '@/components/EarningsSummary';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AnimatedProfitDisplay from '@/components/AnimatedProfitDisplay';

const buyNewSlot = async ({ telegramId, amount }: { telegramId: string, amount: number }) => {
  const { data } = await api.post(`/user/${telegramId}/slots/buy`, { amount });
  return data;
};

const Slots = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: slotsData, isLoading: slotsLoading, error } = useSlotsData(user?.telegramId);
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');

  const isLoading = authLoading || slotsLoading || userDataLoading;

  if (error) {
    console.error(`[Slots] Error fetching slots for user ${user?.telegramId}:`, error);
  }

  const mutation = useMutation({
    mutationFn: buyNewSlot,
    onMutate: async () => {
      const toastId = showLoading('Purchasing new slot...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('New slot purchased successfully!');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['slotsData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['stats', user?.telegramId] });
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Failed to purchase slot.';
      showError(errorMessage);
    },
  });

  const handleBuySlot = () => {
    const investmentAmount = parseFloat(amount);
    
    // Validate input
    if (!amount || isNaN(investmentAmount)) {
      showError('Please enter a valid number.');
      return;
    }
    
    if (investmentAmount <= 0) {
      showError('Amount must be greater than zero.');
      return;
    }
    
    if (investmentAmount > currentBalance) {
      showError(`Insufficient balance. You have ${currentBalance.toFixed(2)} MNE available.`);
      return;
    }
    
    if (!user) {
      showError('User not authenticated.');
      return;
    }
    
    mutation.mutate({ telegramId: user.telegramId, amount: investmentAmount });
  };

  const currentBalance = userData?.mneBalance ?? 0;
  const canInvest = parseFloat(amount) > 0 && parseFloat(amount) <= currentBalance;

  const activeSlots = slotsData?.filter(slot => slot.isActive && new Date(slot.expiresAt) > new Date()) ?? [];
  const inactiveSlots = slotsData?.filter(slot => !slot.isActive || new Date(slot.expiresAt) <= new Date()) ?? [];
  
  // Animated total earnings instead of real-time calculation
  const [totalDynamicEarnings, setTotalDynamicEarnings] = useState(0);
  const [animationStartTime] = useState(Date.now());
  
  useEffect(() => {
    if (activeSlots.length === 0) {
      setTotalDynamicEarnings(0);
      return;
    }
    
    const timer = setInterval(() => {
      // Animated total earnings - just for visual effect
      const now = Date.now();
      const elapsed = (now - animationStartTime) / 1000; // seconds since mount
      
      let total = 0;
      activeSlots.forEach(slot => {
        const earningsPerSecond = (slot.principal * slot.effectiveWeeklyRate) / (7 * 24 * 60 * 60);
        const animatedEarnings = earningsPerSecond * elapsed;
        total += animatedEarnings;
      });
      
      setTotalDynamicEarnings(total);
    }, 100); // Update every 100ms for smooth animation
    
    return () => clearInterval(timer);
  }, [activeSlots, animationStartTime]);

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
      <PageHeader titleKey="slots.title" />

      {/* Total Dynamic Earnings Display */}
      {activeSlots.length > 0 && (
        <Card className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border-emerald-700/50 mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-sm">
              <Zap className="w-4 h-4 mr-2 text-emerald-400" />
              <span>Total Dynamic Earnings</span>
            </CardTitle>
            <CardDescription className="text-emerald-300 text-xs">
              Real-time earnings from all active slots
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 animate-pulse">
                +{totalDynamicEarnings.toFixed(4)} MNE
              </div>
              <div className="text-sm text-emerald-300 mt-1">
                From {activeSlots.length} active slot{activeSlots.length > 1 ? 's' : ''}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900/80 border-primary mb-3">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <span>{t('slots.currentProfit')}</span>
            <Info className="w-4 h-4 text-gray-400" />
          </CardTitle>
          <CardDescription className="text-gray-400 mb-2 text-xs">
            {t('slots.profitProjectionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3">
          <AnimatedProfitDisplay
            baseValue={currentBalance}
            weeklyGrowthRate={userData?.miningPower ?? 0}
            currencySymbol="MNE"
          />
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 border-primary mb-3">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t('slots.investTitle')}</CardTitle>
          <CardDescription className="text-gray-400 mb-2 text-xs">
            {t('slots.investDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={t('slots.amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800 border-gray-700 text-base h-10 flex-grow"
            />
            <Button variant="outline" onClick={() => setAmount(currentBalance.toFixed(4))} className="text-xs">{t('slots.maxButton')}</Button>
          </div>
          <div className="flex justify-around text-xs text-gray-300">
            <span>{t('slots.termInfo')}</span>
            <span>{t('slots.profitInfo')}</span>
          </div>
        </CardContent>
        <CardFooter className="p-3">
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-sm py-3"
            onClick={handleBuySlot}
            disabled={mutation.isPending || !canInvest}
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <>
                <PlusCircle className="w-4 h-4 mr-1" />
                {t('slots.investButton')}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {isLoading ? (
        <div className="flex justify-center pt-6">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center text-sm">Could not load your mining slots.</p>
      ) : (
        <>
          {/* Earnings Summary */}
          <div className="mb-4">
            <EarningsSummary telegramId={user?.telegramId} />
          </div>

          {activeSlots.length > 0 && (
            <Accordion type="single" collapsible defaultValue="active-slots" className="w-full mb-3">
              <AccordionItem value="active-slots" className="border-b border-gray-700">
                <AccordionTrigger className="text-base font-semibold text-white hover:no-underline py-2">
                  {t('slots.yourActive')}
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 space-y-2">
                  {activeSlots.map((slot: MiningSlot) => <SlotCard key={slot.id} slot={slot} telegramId={user?.telegramId} />)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {inactiveSlots.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="inactive-slots" className="border-b border-gray-700">
                <AccordionTrigger className="text-base font-semibold text-white hover:no-underline py-2">
                  {t('slots.inactiveExpired')}
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 space-y-2">
                  {inactiveSlots.map((slot: MiningSlot) => <SlotCard key={slot.id} slot={slot} telegramId={user?.telegramId} />)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {activeSlots.length === 0 && inactiveSlots.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <Server className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">{t('slots.noActive')}</p>
            </div>
          )}
        </>
      )}

      </div>
    </div>
  );
};

export default Slots;
