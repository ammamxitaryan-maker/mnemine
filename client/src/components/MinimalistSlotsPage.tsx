"use client";

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { 
  Server, 
  Plus, 
  Zap, 
  Clock,
  Loader2,
  History
} from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useSlotsData, MiningSlot } from '@/hooks/useSlotsData';
import { useUserData } from '@/hooks/useUserData';
import { useEarnings } from '@/hooks/useEarnings';
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BackButton } from './BackButton';
import { calculateSlotEarnings, formatTime } from '@/utils/earningsCalculator';
import { RealTimeEarnings } from './RealTimeEarnings';

const buyNewSlot = async ({ telegramId, amount }: { telegramId: string, amount: number }) => {
  const { data } = await api.post(`/user/${telegramId}/slots/buy`, { amount });
  return data;
};

export const MinimalistSlotsPage = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { data: slotsData, isLoading: slotsLoading, error } = useSlotsData(user?.telegramId);
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);
  const { totalEarnings: liveEarnings, perSecondRate, isActive } = useEarnings();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  const isLoading = slotsLoading || userDataLoading;
  const currentBalance = userData?.mneBalance ?? 0;
  const canInvest = parseFloat(amount) > 0 && parseFloat(amount) <= currentBalance;

  const activeSlots = slotsData?.filter(slot => slot.isActive && new Date(slot.expiresAt) > new Date()) ?? [];
  const inactiveSlots = slotsData?.filter(slot => !slot.isActive || new Date(slot.expiresAt) <= new Date()) ?? [];

  const mutation = useMutation({
    mutationFn: buyNewSlot,
    onMutate: async () => {
      const toastId = showLoading(t('purchasingSlot'));
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess(t('slotPurchasedSuccess'));
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['slotsData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = (error as any)?.response?.data?.error || t('failedToPurchaseSlot');
      showError(errorMessage);
    },
  });

  const handleBuySlot = () => {
    const investmentAmount = parseFloat(amount);
    
    if (!amount || isNaN(investmentAmount) || investmentAmount <= 0) {
      showError(t('pleaseEnterValidAmount'));
      return;
    }
    
    if (investmentAmount > currentBalance) {
      showError(t('insufficientBalance', { balance: currentBalance.toFixed(2) }));
      return;
    }
    
    if (!user) {
      showError(t('userNotAuthenticated'));
      return;
    }
    
    mutation.mutate({ telegramId: user.telegramId, amount: investmentAmount });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-lg text-muted-foreground">{t('loadingSlots')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Server className="w-8 h-8 text-destructive" />
          </div>
          <p className="text-lg text-destructive mb-4">{t('couldNotLoadSlots')}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="mt-2"
          >
            {t('retry')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-4 sm:px-6 pt-6 pb-6 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            <BackButton />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Server className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{t('miningSlots')}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {activeSlots.length} {t('activeSlots')}
                </p>
              </div>
            </div>
          </div>
          {inactiveSlots.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
            >
              <History className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{t('history')} ({inactiveSlots.length})</span>
              <span className="sm:hidden">({inactiveSlots.length})</span>
            </Button>
          )}
        </div>
      </header>

      {/* Statistics Section */}
      {slotsData && slotsData.length > 0 && (
        <div className="px-4 sm:px-6 mb-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="minimal-card p-4 text-center hover:shadow-md transition-all duration-200 animate-in fade-in-0 slide-in-from-left-4">
              <div className="text-2xl font-bold text-primary mb-1">
                {activeSlots.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('activeSlotsCount')}
              </div>
            </div>
            <div className="minimal-card p-4 text-center hover:shadow-md transition-all duration-200 animate-in fade-in-0 slide-in-from-left-4 delay-100">
              <div className="text-2xl font-bold text-green-500 mb-1">
                {inactiveSlots.length}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('completedSlotsCount')}
              </div>
            </div>
            <div className="minimal-card p-4 text-center hover:shadow-md transition-all duration-200 animate-in fade-in-0 slide-in-from-left-4 delay-200">
              <div className="text-2xl font-bold text-blue-500 mb-1">
                {slotsData.reduce((sum, slot) => sum + slot.principal, 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('totalInvested')} MNE
              </div>
            </div>
            <div className="minimal-card p-4 text-center hover:shadow-md transition-all duration-200 animate-in fade-in-0 slide-in-from-left-4 delay-300">
              <div className="text-2xl font-bold text-yellow-500 mb-1">
                {slotsData.length > 0 ? (slotsData.reduce((sum, slot) => sum + slot.principal, 0) * 0.3).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-muted-foreground">
                {t('totalEarnings')} MNE
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Earnings Display */}
      <div className="px-6 mb-4">
        <RealTimeEarnings />
      </div>

      {/* Buy New Slot */}
      <div className="px-4 sm:px-6 mb-8">
        <div className="minimal-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Plus className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{t('buyNewSlot')}</h3>
                <p className="text-sm text-muted-foreground">{t('investAndEarn')}</p>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-sm text-muted-foreground">{t('available')}</div>
              <div className="text-lg font-semibold text-primary">
                {currentBalance.toFixed(2)} MNE
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="number"
                placeholder={t('amountMNE')}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 h-12 text-lg"
                min="0.01"
                step="0.01"
              />
              <Button
                variant="outline"
                onClick={() => setAmount(currentBalance.toFixed(4))}
                className="h-12 px-4 sm:px-6 whitespace-nowrap"
              >
                {t('max')}
              </Button>
            </div>

            <Button
              onClick={handleBuySlot}
              disabled={mutation.isPending || !canInvest}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  {t('purchasing')}...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  {t('buySlot')}
                </>
              )}
            </Button>

            <div className="flex items-center justify-center gap-4 sm:gap-6 py-3 bg-muted/30 rounded-lg">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">{t('return')}</div>
                <div className="text-lg font-semibold text-green-500">30%</div>
              </div>
              <div className="w-px h-8 bg-border hidden sm:block"></div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">{t('duration')}</div>
                <div className="text-lg font-semibold text-blue-500">7 {t('days')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Slots Summary */}
      {activeSlots.length > 0 && (
        <div className="px-4 sm:px-6 mb-6">
          <div className="minimal-card p-4 sm:p-6 bg-gradient-to-r from-yellow-500/5 to-yellow-400/5 border border-yellow-500/20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Server className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{t('totalActiveEarnings')}</h3>
                  <p className="text-sm text-muted-foreground">{t('fromAllSlots')}</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <div className="text-xl sm:text-2xl font-bold text-yellow-500">
                  {activeSlots.reduce((sum, slot) => {
                    const slotEarnings = calculateSlotEarnings(slot);
                    return sum + slotEarnings.totalReturn;
                  }, 0).toFixed(6)} MNE
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Slots */}
      {activeSlots.length > 0 && (
        <div className="px-4 sm:px-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Server className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{t('activeSlots')}</h2>
              <p className="text-sm text-muted-foreground">{t('currentlyMining')}</p>
            </div>
          </div>
          <div className="space-y-4">
            {activeSlots.map((slot: MiningSlot) => {
              const slotEarnings = calculateSlotEarnings(slot);
              const expectedReturn = slot.principal * 1.3; // 30% return
              const timeToComplete = formatTime(slotEarnings.remainingSeconds);
              const progress = (slotEarnings.totalReturn / expectedReturn) * 100;
              
              return (
                <div key={slot.id} className="minimal-card p-4 sm:p-6 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in-0 slide-in-from-bottom-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Server className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{t('slotNumber')}{slot.id.slice(-4)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {slot.principal.toFixed(2)} MNE {t('invested')}
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-lg sm:text-xl font-bold text-primary animate-pulse">
                        {slotEarnings.totalReturn.toFixed(6)} MNE
                      </div>
                      <div className="text-sm text-muted-foreground">
                        → {expectedReturn.toFixed(2)} MNE {t('target')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>{t('progress')}</span>
                      <span>{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="flex items-center justify-center gap-3 sm:gap-4 py-4 sm:py-5 bg-gradient-to-r from-blue-500/15 to-blue-400/15 rounded-xl border-2 border-blue-500/40 mb-4 shadow-lg">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-blue-500 mb-1">
                        {timeToComplete}
                      </div>
                      <div className="text-xs sm:text-sm text-blue-500/90 font-medium">
                        {t('left')} • {t('completionMessage')}
                      </div>
                    </div>
                  </div>

                  {/* Final Amount Info */}
                  <div className="text-center py-2 bg-green-500/5 rounded-lg border border-green-500/20">
                    <span className="text-sm text-green-500 font-medium">
                      {t('willReceive')} {expectedReturn.toFixed(2)} MNE {t('afterCompletion')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Section */}
      {showHistory && inactiveSlots.length > 0 && (
        <div className="px-4 sm:px-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-muted/50 rounded-lg">
              <History className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">{t('history')}</h2>
              <p className="text-sm text-muted-foreground">{t('completedSlots')}</p>
            </div>
          </div>
          <div className="space-y-3">
            {inactiveSlots.map((slot: MiningSlot) => (
              <div key={slot.id} className="minimal-card p-4 opacity-75 hover:opacity-100 transition-opacity">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <Server className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{t('slotNumber')}{slot.id.slice(-4)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {slot.principal.toFixed(2)} MNE {t('invested')}
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <div className="text-sm font-medium text-green-500">{t('completed')}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(slot.expiresAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeSlots.length === 0 && inactiveSlots.length === 0 && (
        <div className="px-4 sm:px-6 mb-8">
          <div className="minimal-card text-center py-8 sm:py-12">
            <div className="p-4 bg-muted/20 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 flex items-center justify-center">
              <Server className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-3">{t('noMiningSlots')}</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm sm:text-base">
              {t('startMiningDescription')}
            </p>
            <Button
              onClick={() => setAmount('10')}
              className="h-10 sm:h-12 px-6 sm:px-8 text-base sm:text-lg font-semibold"
              size="lg"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              {t('buyFirstSlot')}
            </Button>
          </div>
        </div>
      )}

      {/* Bottom spacing */}
      <div className="h-20" />
    </div>
  );
};