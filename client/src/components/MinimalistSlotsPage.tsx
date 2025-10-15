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
import { showSuccess, showError, showLoading, dismissToast } from '@/utils/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RealTimeEarnings } from './RealTimeEarnings';
import { EarningsDetails } from './EarningsDetails';
import { BackButton } from './BackButton';
import { calculateSlotEarnings, formatTime } from '@/utils/earningsCalculator';

const buyNewSlot = async ({ telegramId, amount }: { telegramId: string, amount: number }) => {
  const { data } = await api.post(`/user/${telegramId}/slots/buy`, { amount });
  return data;
};

export const MinimalistSlotsPage = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { data: slotsData, isLoading: slotsLoading, error } = useSlotsData(user?.telegramId);
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');

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
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Failed to purchase slot.';
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
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="p-2 bg-primary/10 rounded-xl">
            <Server className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-foreground">Mining Slots</h1>
            <p className="text-sm text-muted-foreground">
              {activeSlots.length} active • {inactiveSlots.length} completed
            </p>
          </div>
        </div>
      </header>

      {/* Real-time Earnings */}
      {activeSlots.length > 0 && (
        <div className="px-6 mb-6">
          <RealTimeEarnings telegramId={user?.telegramId || ''} />
        </div>
      )}

      {/* Earnings Details */}
      {activeSlots.length > 0 && (
        <div className="px-6 mb-6">
          <EarningsDetails telegramId={user?.telegramId || ''} />
        </div>
      )}

      {/* Buy New Slot */}
      <div className="px-6 mb-6">
        <div className="minimal-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary/10 rounded-xl">
              <Plus className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Buy New Slot</h3>
              <p className="text-sm text-muted-foreground">
                Available: {currentBalance.toFixed(2)} MNE
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-3">
              <Input
                type="number"
                placeholder="Amount (MNE)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 bg-muted/20 border-border"
              />
              <Button
                variant="outline"
                onClick={() => setAmount(currentBalance.toFixed(4))}
                className="px-4"
              >
                Max
              </Button>
            </div>

            <Button
              onClick={handleBuySlot}
              disabled={mutation.isPending || !canInvest}
              className="w-full primary-btn"
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

      {/* Active Slots */}
      {activeSlots.length > 0 && (
        <div className="px-6 mb-6">
          <h2 className="text-lg font-medium text-foreground mb-4">Active Slots</h2>
          <div className="space-y-3">
            {activeSlots.map((slot: MiningSlot) => {
              const slotEarnings = calculateSlotEarnings(slot);
              const expectedReturn = slot.principal * 1.3; // 30% return
              const timeToComplete = formatTime(slotEarnings.remainingSeconds);
              
              return (
                <div key={slot.id} className="minimal-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-xl">
                        <Zap className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">Slot #{slot.id.slice(-4)}</h3>
                        <p className="text-sm text-muted-foreground">
                          {slot.principal.toFixed(2)} MNE invested
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-primary">
                        +{slotEarnings.perSecondRate.toFixed(6)} MNE/s
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {slotEarnings.dailyReturn.toFixed(4)} MNE/day
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <div className="text-sm font-medium text-accent">
                        {expectedReturn.toFixed(2)} MNE
                      </div>
                      <div className="text-xs text-muted-foreground">Expected Return</div>
                    </div>
                    <div className="text-center p-2 bg-muted/20 rounded-lg">
                      <div className="text-sm font-medium text-primary">
                        {timeToComplete}
                      </div>
                      <div className="text-xs text-muted-foreground">Time Left</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Expires: {new Date(slot.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                      <span className="text-primary text-xs">Active</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inactive Slots */}
      {inactiveSlots.length > 0 && (
        <div className="px-6 mb-8">
          <h2 className="text-lg font-medium text-foreground mb-4">Completed Slots</h2>
          <div className="space-y-3">
            {inactiveSlots.slice(0, 3).map((slot: MiningSlot) => (
              <div key={slot.id} className="minimal-card opacity-60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/20 rounded-xl">
                      <Server className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">Slot #{slot.id.slice(-4)}</h3>
                      <p className="text-sm text-muted-foreground">
                        {slot.principal.toFixed(2)} MNE
                      </p>
                    </div>
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
            {inactiveSlots.length > 3 && (
              <div className="text-center text-sm text-muted-foreground py-2">
                +{inactiveSlots.length - 3} more completed slots
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {activeSlots.length === 0 && inactiveSlots.length === 0 && (
        <div className="px-6 mb-8">
          <div className="minimal-card text-center py-12">
            <div className="p-4 bg-muted/20 rounded-2xl w-fit mx-auto mb-4">
              <Server className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No Slots Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start mining by purchasing your first slot
            </p>
            <Button
              onClick={() => setAmount('10')}
              className="primary-btn"
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