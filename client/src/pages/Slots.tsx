import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Loader2, Server, Info, PlusCircle } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useSlotsData, MiningSlot } from '@/hooks/useSlotsData';
import SlotCard from '@/components/SlotCard';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { useUserData } from '@/hooks/useUserData';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AnimatedProfitDisplay from '@/components/AnimatedProfitDisplay';
import { UpgradeSlotDialog } from '@/components/UpgradeSlotDialog';

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
  const [slotToUpgrade, setSlotToUpgrade] = useState<MiningSlot | null>(null);

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
    if (user && investmentAmount > 0) {
      mutation.mutate({ telegramId: user.telegramId, amount: investmentAmount });
    } else {
      showError('Please enter a valid amount.');
    }
  };

  const currentBalance = userData?.balance ?? 0;
  const canInvest = parseFloat(amount) > 0 && parseFloat(amount) <= currentBalance;

  const activeSlots = slotsData?.filter(slot => slot.isActive && new Date(slot.expiresAt) > new Date()) ?? [];
  const inactiveSlots = slotsData?.filter(slot => !slot.isActive || new Date(slot.expiresAt) <= new Date()) ?? [];

  return (
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="slots.title" />

      <Card className="bg-gray-900/80 backdrop-blur-sm border-primary mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{t('slots.currentProfit')}</span>
            <Info className="w-4 h-4 text-gray-400" />
          </CardTitle>
          <CardDescription className="text-gray-400 mb-4">
            {t('slots.profitProjectionDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AnimatedProfitDisplay
            baseValue={currentBalance}
            weeklyGrowthRate={userData?.miningPower ?? 0}
            currencySymbol="CFM"
          />
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 backdrop-blur-sm border-primary mb-6">
        <CardHeader>
          <CardTitle>{t('slots.investTitle')}</CardTitle>
          <CardDescription className="text-gray-400 mb-4">
            {t('slots.investDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder={t('slots.amountPlaceholder')}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-gray-800 border-gray-700 text-lg h-12 flex-grow"
            />
            <Button variant="outline" onClick={() => setAmount(currentBalance.toFixed(4))}>{t('slots.maxButton')}</Button>
          </div>
          <div className="flex justify-around text-sm text-gray-300">
            <span>{t('slots.termInfo')}</span>
            <span>{t('slots.profitInfo')}</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full bg-primary hover:bg-primary/90 text-base py-5"
            onClick={handleBuySlot}
            disabled={mutation.isPending || !canInvest}
          >
            {mutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                <PlusCircle className="w-5 h-5 mr-2" />
                {t('slots.investButton')}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {isLoading ? (
        <div className="flex justify-center pt-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center">Could not load your mining slots.</p>
      ) : (
        <>
          {activeSlots.length > 0 && (
            <Accordion type="single" collapsible defaultValue="active-slots" className="w-full mb-4">
              <AccordionItem value="active-slots" className="border-b border-gray-700">
                <AccordionTrigger className="text-xl font-semibold text-white hover:no-underline py-4">
                  {t('slots.yourActive')}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2 space-y-4">
                  {activeSlots.map((slot: MiningSlot) => <SlotCard key={slot.id} slot={slot} onUpgradeClick={setSlotToUpgrade} />)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {inactiveSlots.length > 0 && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="inactive-slots" className="border-b border-gray-700">
                <AccordionTrigger className="text-xl font-semibold text-white hover:no-underline py-4">
                  {t('slots.inactiveExpired')}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2 space-y-4">
                  {inactiveSlots.map((slot: MiningSlot) => <SlotCard key={slot.id} slot={slot} onUpgradeClick={setSlotToUpgrade} />)}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {activeSlots.length === 0 && inactiveSlots.length === 0 && (
            <div className="text-center py-10 text-gray-500">
              <Server className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">{t('slots.noActive')}</p>
            </div>
          )}
        </>
      )}

      {slotToUpgrade && user && (
        <UpgradeSlotDialog
          slot={slotToUpgrade}
          isOpen={!!slotToUpgrade}
          onClose={() => setSlotToUpgrade(null)}
          telegramId={user.telegramId}
          currentBalance={currentBalance}
        />
      )}
    </div>
  );
};

export default Slots;