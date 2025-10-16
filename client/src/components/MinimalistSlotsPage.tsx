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
  Loader2
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
      const toastId = showLoading('Purchasing new slot...');
      return { toastId };
    },
    onSuccess: (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('New slot purchased successfully!');
      setAmount('');
      queryClient.invalidateQueries({ queryKey: ['slotsData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
    },
    onError: (error: Error, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = (error as any)?.response?.data?.error || 'Failed to purchase slot.';
      showError(errorMessage);
    },
  });

  const handleBuySlot = () => {
    const investmentAmount = parseFloat(amount);
    
    if (!amount || isNaN(investmentAmount) || investmentAmount <= 0) {
      showError('Please enter a valid amount.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading slots...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <p className="text-destructive">Could not load your mining slots.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <Server className="w-5 h-5 text-primary" />
            <div>
              <h1 className="text-xl font-medium text-foreground">Mining Slots</h1>
              <p className="text-sm text-muted-foreground">
                {activeSlots.length} active slots
              </p>
            </div>
          </div>
          {inactiveSlots.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="h-8"
            >
              History ({inactiveSlots.length})
            </Button>
          )}
        </div>
      </header>

      {/* Live Earnings Display */}
      <div className="px-6 mb-4">
        <RealTimeEarnings />
      </div>

      {/* Buy New Slot */}
      <div className="px-6 mb-6">
        <div className="minimal-card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-foreground">Buy New Slot</h3>
            <span className="text-sm text-muted-foreground">
              {currentBalance.toFixed(2)} MNE available
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Amount (MNE)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 h-9"
              />
              <Button
                variant="outline"
                onClick={() => setAmount(currentBalance.toFixed(4))}
                className="h-9 px-3"
              >
                Max
              </Button>
            </div>

            <Button
              onClick={handleBuySlot}
              disabled={mutation.isPending || !canInvest}
              className="w-full h-9"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Purchasing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Buy Slot
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Active Slots Summary */}
      {activeSlots.length > 0 && (
        <div className="px-6 mb-4">
          <div className="minimal-card p-4 bg-yellow-500/5 border border-yellow-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-foreground">Total Active Earnings</span>
              </div>
              <div className="text-right">
                <div className="text-lg font-medium text-yellow-500">
                  {activeSlots.reduce((sum, slot) => {
                    const slotEarnings = calculateSlotEarnings(slot);
                    return sum + slotEarnings.totalReturn;
                  }, 0).toFixed(6)} MNE
                </div>
                <div className="text-xs text-muted-foreground">
                  {activeSlots.reduce((sum, slot) => {
                    return sum + (slot.principal * slot.effectiveWeeklyRate / (7 * 24 * 60 * 60));
                  }, 0).toFixed(8)} MNE/sec total
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Slots */}
      {activeSlots.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-3">Active Slots</h2>
          <div className="space-y-2">
            {activeSlots.map((slot: MiningSlot) => {
              const slotEarnings = calculateSlotEarnings(slot);
              const expectedReturn = slot.principal * 1.3; // 30% return
              const timeToComplete = formatTime(slotEarnings.remainingSeconds);
              
              return (
                <div key={slot.id} className="minimal-card">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-foreground">Slot #{slot.id.slice(-4)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {slot.principal.toFixed(2)} MNE • {timeToComplete} left
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary animate-pulse">
                        {slotEarnings.totalReturn.toFixed(6)} MNE
                      </div>
                      <div className="text-xs text-muted-foreground">
                        → {expectedReturn.toFixed(2)} MNE
                      </div>
                      <div className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                        <Zap className="w-3 h-3" />
                        {(slot.principal * slot.effectiveWeeklyRate / (7 * 24 * 60 * 60)).toFixed(8)} MNE/sec
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* History Section */}
      {showHistory && inactiveSlots.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-3">History</h2>
          <div className="space-y-2">
            {inactiveSlots.map((slot: MiningSlot) => (
              <div key={slot.id} className="minimal-card opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">Slot #{slot.id.slice(-4)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {slot.principal.toFixed(2)} MNE
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">Completed</div>
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
        <div className="px-6 mb-8">
          <div className="minimal-card text-center py-8">
            <Server className="w-6 h-6 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-medium text-foreground mb-2">No Slots Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start mining by purchasing your first slot
            </p>
            <Button
              onClick={() => setAmount('10')}
              className="h-9"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buy First Slot
            </Button>
          </div>
        </div>
      )}

      {/* Bottom spacing */}
      <div className="h-20" />
    </div>
  );
};