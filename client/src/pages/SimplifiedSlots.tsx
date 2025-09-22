"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Loader2, Server, PlusCircle, ArrowLeft, TrendingUp, Zap } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useSlotsData, MiningSlot } from '@/hooks/useSlotsData';
import SlotCard from '@/components/SlotCard';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { useUserData } from '@/hooks/useUserData';
import { SmartCard } from '@/components/ui/smart-card';
import { CTAButton } from '@/components/ui/cta-button';
import { EnhancedTabs, EnhancedTabsList, EnhancedTabsTrigger, EnhancedTabsContent } from '@/components/ui/enhanced-tabs';
import { EnhancedAccordion, EnhancedAccordionItem, EnhancedAccordionTrigger, EnhancedAccordionContent } from '@/components/ui/enhanced-accordion';
import { Input } from '@/components/ui/input';
import { UpgradeSlotDialog } from '@/components/UpgradeSlotDialog';
import { motion } from 'framer-motion';

const buyNewSlot = async ({ telegramId, amount }: { telegramId: string, amount: number }) => {
  const { data } = await api.post(`/user/${telegramId}/slots/buy`, { amount });
  return data;
};

const SimplifiedSlots = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: slotsData, isLoading: slotsLoading, error } = useSlotsData(user?.telegramId);
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [slotToUpgrade, setSlotToUpgrade] = useState<MiningSlot | null>(null);
  const [searchParams] = useSearchParams();

  // Pre-fill amount from URL parameters
  useEffect(() => {
    const amountParam = searchParams.get('amount');
    if (amountParam) {
      setAmount(amountParam);
    }
  }, [searchParams]);

  const isLoading = authLoading || slotsLoading || userDataLoading;

  if (error) {
    console.error(`[SimplifiedSlots] Error fetching slots for user ${user?.telegramId}:`, error);
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
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header Section */}
        <motion.header 
          className="flex items-center justify-between mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <CTAButton
            onClick={() => window.history.back()}
            icon={ArrowLeft}
            variant="ghost"
            size="md"
          >
            Back
          </CTAButton>
          
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

        {/* Main Content with Tabs */}
        <motion.section
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <EnhancedTabs defaultValue="invest" className="w-full">
            <EnhancedTabsList variant="pills" className="mb-6">
              <EnhancedTabsTrigger value="invest">Invest</EnhancedTabsTrigger>
              <EnhancedTabsTrigger value="active">Active Slots</EnhancedTabsTrigger>
              <EnhancedTabsTrigger value="history">History</EnhancedTabsTrigger>
            </EnhancedTabsList>

            {/* Invest Tab */}
            <EnhancedTabsContent value="invest" variant="card">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Investment Form */}
                <SmartCard
                  title="New Investment"
                  icon={PlusCircle}
                  iconColor="from-blue-500 to-indigo-600"
                  variant="glass"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-lg h-12 flex-grow"
                      />
                      <CTAButton 
                        variant="outline"
                        onClick={() => setAmount(currentBalance.toFixed(4))}
                        size="md"
                      >
                        Max
                      </CTAButton>
                    </div>
                    
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p>Available Balance: {currentBalance.toFixed(4)} CFM</p>
                      <p>Investment Term: 7 days</p>
                      <p>Expected Return: 30%</p>
                    </div>

                    <CTAButton
                      onClick={handleBuySlot}
                      loading={mutation.isPending}
                      disabled={!canInvest}
                      fullWidth
                      size="lg"
                    >
                      <PlusCircle className="w-5 h-5 mr-2" />
                      Invest in New Slot
                    </CTAButton>
                  </div>
                </SmartCard>

                {/* Investment Stats */}
                <SmartCard
                  title="Investment Overview"
                  icon={TrendingUp}
                  iconColor="from-green-500 to-emerald-600"
                  variant="glass"
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {activeSlots.length}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Active Slots</p>
                      </div>
                      <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {userData?.totalInvested?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Invested</p>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-200">Mining Power</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {((userData?.miningPower ?? 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </SmartCard>
              </div>
            </EnhancedTabsContent>

            {/* Active Slots Tab */}
            <EnhancedTabsContent value="active" variant="card">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : activeSlots.length > 0 ? (
                <EnhancedAccordion type="single" collapsible defaultValue="active-slots" className="w-full">
                  <EnhancedAccordionItem value="active-slots" variant="card">
                    <EnhancedAccordionTrigger>
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-green-600" />
                        <span>Active Mining Slots ({activeSlots.length})</span>
                      </div>
                    </EnhancedAccordionTrigger>
                    <EnhancedAccordionContent>
                      <div className="space-y-4">
                        {activeSlots.map((slot: MiningSlot) => (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SlotCard slot={slot} onUpgradeClick={setSlotToUpgrade} />
                          </motion.div>
                        ))}
                      </div>
                    </EnhancedAccordionContent>
                  </EnhancedAccordionItem>
                </EnhancedAccordion>
              ) : (
                <div className="text-center py-10">
                  <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">No active mining slots</p>
                  <CTAButton onClick={() => setAmount('')}>
                    Start Your First Investment
                  </CTAButton>
                </div>
              )}
            </EnhancedTabsContent>

            {/* History Tab */}
            <EnhancedTabsContent value="history" variant="card">
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : inactiveSlots.length > 0 ? (
                <EnhancedAccordion type="single" collapsible className="w-full">
                  <EnhancedAccordionItem value="inactive-slots" variant="card">
                    <EnhancedAccordionTrigger>
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-gray-600" />
                        <span>Completed Slots ({inactiveSlots.length})</span>
                      </div>
                    </EnhancedAccordionTrigger>
                    <EnhancedAccordionContent>
                      <div className="space-y-4">
                        {inactiveSlots.map((slot: MiningSlot) => (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <SlotCard slot={slot} onUpgradeClick={setSlotToUpgrade} />
                          </motion.div>
                        ))}
                      </div>
                    </EnhancedAccordionContent>
                  </EnhancedAccordionItem>
                </EnhancedAccordion>
              ) : (
                <div className="text-center py-10">
                  <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500 dark:text-gray-400">No completed slots yet</p>
                </div>
              )}
            </EnhancedTabsContent>
          </EnhancedTabs>
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
    </motion.div>
  );
};

export default SimplifiedSlots;
