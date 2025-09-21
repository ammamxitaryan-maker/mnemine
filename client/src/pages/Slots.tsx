import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { Loader2, Server, Info, PlusCircle, ArrowLeft, Zap, TrendingUp } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useSlotsData, MiningSlot } from '@/hooks/useSlotsData';
import SlotCard from '@/components/SlotCard';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { useUserData } from '@/hooks/useUserData';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import AnimatedProfitDisplay from '@/components/AnimatedProfitDisplay';
import { UpgradeSlotDialog } from '@/components/UpgradeSlotDialog';
import { TouchButton } from '@/components/FullscreenSection';
import { motion } from 'framer-motion';

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
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 dark:from-slate-900 dark:via-blue-900/20 dark:to-indigo-900/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {/* Design System Container */}
      <div className="w-full max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section - Perfectly Centered */}
        <motion.header 
          className="flex items-center justify-between py-6 mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <TouchButton
            onClick={() => window.history.back()}
            className="group relative px-4 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl text-gray-700 dark:text-gray-300 rounded-xl hover:bg-white dark:hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
            <span className="font-medium">Back</span>
          </TouchButton>
          
          <div className="text-center">
            <motion.div 
              className="flex items-center justify-center space-x-3 mb-2"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div 
                className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Server className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Mining Slots</h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Invest in mining slots to earn 30% returns over 7 days
                </p>
              </div>
            </motion.div>
          </div>
          
          <div className="w-24"></div> {/* Spacer for perfect centering */}
        </motion.header>

        {/* Main Content Grid - Perfectly Symmetric */}
        <div className="space-y-8">
          
          {/* Profit Overview */}
          <motion.section 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Current Profit Card */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <motion.div 
                      className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl mr-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <TrendingUp className="w-6 h-6 text-white" />
                    </motion.div>
                    {t('slots.currentProfit')}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
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
            </motion.div>

            {/* Investment Card */}
            <motion.div
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Card className="h-full bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-500">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <motion.div 
                      className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl mr-3"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <PlusCircle className="w-6 h-6 text-white" />
                    </motion.div>
                    {t('slots.investTitle')}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">
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
                      className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-lg h-12 flex-grow"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setAmount(currentBalance.toFixed(4))}
                      className="h-12"
                    >
                      {t('slots.maxButton')}
                    </Button>
                  </div>
                  <div className="flex justify-around text-sm text-gray-600 dark:text-gray-400">
                    <span>{t('slots.termInfo')}</span>
                    <span>{t('slots.profitInfo')}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-base py-5"
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
            </motion.div>
          </motion.section>

          {/* Mining Slots Section */}
          <motion.section
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
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
          </motion.section>

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
      </div>
    </motion.div>
  );
};

export default Slots;