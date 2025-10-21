import { PageHeader } from '@/components/PageHeader';
import { SmoothSlotEarnings } from '@/components/SmoothSlotEarnings';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData } from '@/hooks/useUserData';
import { api } from '@/lib/api';
import { dismissToast, showError, showLoading, showSuccess } from '@/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, Clock, Loader2, PlusCircle, TrendingUp, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface InvestmentSlot {
  id: string;
  principal: number;
  currentEarnings: number;
  currentBalance: number;
  isCompleted: boolean;
  isActive: boolean;
  progress: number;
  timeLeft: number;
  startTime: string;
  expiresAt: string;
  status: 'active' | 'completed' | 'inactive';
}

interface InvestmentSlotsResponse {
  userId: string;
  slots: InvestmentSlot[];
  lastUpdated: string;
}

const createInvestmentSlot = async ({ telegramId, amount }: { telegramId: string, amount: number }) => {
  const { data } = await api.post(`/user/${telegramId}/invest`, { amount });
  return data;
};

const claimSlot = async ({ telegramId, slotId }: { telegramId: string, slotId: string }) => {
  const { data } = await api.post(`/user/${telegramId}/claim/${slotId}`, { telegramId });
  return data;
};

const InvestmentSlots = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const [slotsData, setSlotsData] = useState<InvestmentSlotsResponse | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const isLoading = authLoading || userDataLoading;

  // Fetch investment slots
  const fetchInvestmentSlots = async () => {
    if (!user?.telegramId) return;

    setIsLoadingSlots(true);
    try {
      const response = await api.get(`/user/${user.telegramId}/myslots`);
      setSlotsData(response.data);
    } catch (error) {
      console.error('Error fetching investment slots:', error);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (user?.telegramId) {
      fetchInvestmentSlots();
      // Update every 3 seconds for real-time effect
      const interval = setInterval(fetchInvestmentSlots, 3000);
      return () => clearInterval(interval);
    }
  }, [user?.telegramId]);

  const createSlotMutation = useMutation({
    mutationFn: createInvestmentSlot,
    onMutate: async () => {
      const toastId = showLoading('Creating investment slot...');
      return { toastId };
    },
    onSuccess: async (_data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess('Investment slot created successfully!');
      setAmount('');

      console.log('[InvestmentSlots] Investment successful, starting data refresh...');

      // Calculate expected new balance
      const investmentAmount = parseFloat(amount);
      const expectedNewBalance = Math.max(0, currentBalance - investmentAmount);

      // Dispatch balance update event immediately
      window.dispatchEvent(new CustomEvent('balanceUpdated', {
        detail: {
          telegramId: user?.telegramId,
          newBalance: expectedNewBalance,
          previousBalance: currentBalance,
          changeAmount: -investmentAmount,
          action: 'SLOT_INVESTMENT',
          timestamp: new Date().toISOString(),
          currency: 'NON'
        }
      }));

      // Dispatch user data refresh event
      window.dispatchEvent(new CustomEvent('userDataRefresh', {
        detail: { telegramId: user?.telegramId }
      }));

      // Force immediate UI refresh by invalidating all relevant queries
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['mainBalance', user?.telegramId] });
      queryClient.invalidateQueries({ queryKey: ['slotsData', user?.telegramId] });

      // Refresh investment slots data immediately
      fetchInvestmentSlots();

      // Multiple refresh attempts to ensure data is updated
      const refreshAttempts = [500, 1000, 2000, 3000];

      refreshAttempts.forEach((delay, index) => {
        setTimeout(async () => {
          try {
            console.log(`[InvestmentSlots] Refresh attempt ${index + 1} after ${delay}ms`);

            // Force refetch with cache bypass
            const response = await api.get(`/user/${user?.telegramId}/data?bypassCache=true&t=${Date.now()}`);
            console.log(`[InvestmentSlots] Refresh attempt ${index + 1} - Fresh data:`, {
              balance: response.data.balance,
              availableBalance: response.data.availableBalance,
              timestamp: new Date().toISOString()
            });

            // Force another UI update with fresh data
            queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
            queryClient.invalidateQueries({ queryKey: ['mainBalance', user?.telegramId] });
            queryClient.invalidateQueries({ queryKey: ['slotsData', user?.telegramId] });

            // Dispatch another refresh event
            window.dispatchEvent(new CustomEvent('userDataUpdated', {
              detail: { telegramId: user?.telegramId }
            }));

            // Refresh slots data
            fetchInvestmentSlots();

          } catch (error) {
            console.error(`[InvestmentSlots] Error in refresh attempt ${index + 1}:`, error);
          }
        }, delay);
      });
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Failed to create investment slot.';
      showError(errorMessage);
    },
  });

  const claimSlotMutation = useMutation({
    mutationFn: claimSlot,
    onMutate: async () => {
      const toastId = showLoading('Claiming slot...');
      return { toastId };
    },
    onSuccess: (data, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      showSuccess(data.message || 'Slot claimed successfully!');
      fetchInvestmentSlots();
      queryClient.invalidateQueries({ queryKey: ['userData', user?.telegramId] });
    },
    onError: (error: any, _variables, context) => {
      if (context?.toastId) dismissToast(context.toastId);
      const errorMessage = error.response?.data?.error || 'Failed to claim slot.';
      showError(errorMessage);
    },
  });

  const handleCreateSlot = () => {
    const investmentAmount = parseFloat(amount);

    if (!amount || isNaN(investmentAmount)) {
      showError('Please enter a valid number.');
      return;
    }

    if (investmentAmount <= 0) {
      showError('Amount must be greater than zero.');
      return;
    }

    if (investmentAmount > currentBalance) {
      showError(`Insufficient balance. You have ${currentBalance.toFixed(2)} NON available.`);
      return;
    }

    if (!user) {
      showError('User not authenticated.');
      return;
    }

    createSlotMutation.mutate({ telegramId: user.telegramId, amount: investmentAmount });
  };

  const handleClaimSlot = (slotId: string) => {
    if (!user) return;
    claimSlotMutation.mutate({ telegramId: user.telegramId, slotId });
  };

  const currentBalance = userData?.availableBalance ?? 0;
  const canInvest = parseFloat(amount) > 0 && parseFloat(amount) <= currentBalance;

  const activeSlots = slotsData?.slots.filter(slot => slot.status === 'active') ?? [];
  const completedSlots = slotsData?.slots.filter(slot => slot.status === 'completed') ?? [];
  const totalEarnings = slotsData?.slots.reduce((sum, slot) => sum + slot.currentEarnings, 0) ?? 0;

  const formatTimeLeft = (timeLeftMs: number) => {
    const days = Math.floor(timeLeftMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeftMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="Investment Slots" />

        {/* Total Earnings Display */}
        {totalEarnings > 0 && (
          <Card className="bg-gradient-to-r from-emerald-900/40 to-emerald-800/20 border-emerald-700/50 mb-3">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-sm">
                <Zap className="w-4 h-4 mr-2 text-emerald-400" />
                <span>Total Earnings</span>
                <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </CardTitle>
              <CardDescription className="text-emerald-300 text-xs">
                Real-time earnings from all investment slots
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-400 animate-pulse">
                  +{totalEarnings.toFixed(4)} NON
                </div>
                <div className="text-sm text-emerald-300 mt-1">
                  From {activeSlots.length} active slot{activeSlots.length > 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Investment Form */}
        <Card className="bg-gray-900/80 border-primary mb-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Create Investment Slot</CardTitle>
            <CardDescription className="text-gray-400 mb-2 text-xs">
              30% return over 7 days - Server-calculated earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-3">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="Amount to invest"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-gray-800 border-gray-700 text-base h-10 flex-grow"
              />
              <Button variant="outline" onClick={() => setAmount(currentBalance.toFixed(4))} className="text-xs">Max</Button>
            </div>
            <div className="flex justify-around text-xs text-gray-300">
              <span>7 days term</span>
              <span>30% profit</span>
            </div>
          </CardContent>
          <CardFooter className="p-3">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-sm py-3"
              onClick={handleCreateSlot}
              disabled={createSlotMutation.isPending || !canInvest}
            >
              {createSlotMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                <>
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Invest NON
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {isLoading ? (
          <div className="flex justify-center pt-6">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <>
            {/* Active Slots */}
            {activeSlots.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Active Investments
                </h3>
                <div className="space-y-3">
                  {activeSlots.map((slot) => (
                    <Card key={slot.id} className="bg-gray-900/80 border-primary">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xl font-bold text-purple-400">{slot.principal.toFixed(2)} NON</p>
                            <p className="text-sm text-gray-400">Investment</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-emerald-400">
                              {slot.currentBalance.toFixed(4)} NON
                            </p>
                            <p className="text-xs text-gray-400">Current Total</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-2 text-emerald-400" />
                              <span className="text-sm text-emerald-300">Live Earnings:</span>
                              <div className="ml-2 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            </div>
                            <span className="text-lg font-bold text-emerald-400">
                              <SmoothSlotEarnings earnings={slot.currentEarnings} />
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-gray-300">Progress:</span>
                          <span className="text-emerald-400 font-semibold">{slot.progress.toFixed(1)}%</span>
                        </div>

                        <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                          <div
                            className="bg-emerald-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(slot.progress, 100)}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-300">Time left:</span>
                          <span className="text-accent font-mono">{formatTimeLeft(slot.timeLeft)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Slots */}
            {completedSlots.length > 0 && (
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-gold" />
                  Completed Investments
                </h3>
                <div className="space-y-3">
                  {completedSlots.map((slot) => (
                    <Card key={slot.id} className="bg-gray-900/80 border-gold/50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="text-xl font-bold text-purple-400">{slot.principal.toFixed(2)} NON</p>
                            <p className="text-sm text-gray-400">Investment</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gold">
                              {slot.currentBalance.toFixed(4)} NON
                            </p>
                            <p className="text-xs text-gray-400">Final Total</p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-gold/20 to-yellow-500/10 border border-gold/50 rounded-lg p-3 mb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <CheckCircle className="w-4 h-4 mr-2 text-gold" />
                              <span className="text-sm text-gold">Earnings:</span>
                            </div>
                            <span className="text-lg font-bold text-gold">
                              <SmoothSlotEarnings earnings={slot.currentEarnings} />
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">30% return achieved!</p>
                        </div>

                        <Badge className="bg-gold text-black mb-3">COMPLETED</Badge>

                        {slot.isActive && (
                          <Button
                            onClick={() => handleClaimSlot(slot.id)}
                            disabled={claimSlotMutation.isPending}
                            className="w-full bg-gold hover:bg-gold/90 text-black font-semibold"
                          >
                            {claimSlotMutation.isPending ? (
                              <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                                Claiming...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Claim {slot.currentBalance.toFixed(4)} NON
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {activeSlots.length === 0 && completedSlots.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p className="text-sm">No investment slots yet</p>
                <p className="text-xs text-gray-400 mt-1">Create your first investment to start earning 30% returns!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InvestmentSlots;
