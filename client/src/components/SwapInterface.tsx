import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRightLeft, 
  TrendingUp, 
  DollarSign, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  History
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface ExchangeData {
  rate: number;
  rateId?: string;
}

interface SwapTransaction {
  id: string;
  cfmAmount: number;
  cfmtAmount: number;
  exchangeRate: number;
  createdAt: string;
}

interface SwapInterfaceProps {
  telegramId: string;
  cfmBalance: number;
  cfmtBalance: number;
  onSwapSuccess?: () => void;
}

export const SwapInterface: React.FC<SwapInterfaceProps> = ({
  telegramId,
  cfmBalance,
  cfmtBalance,
  onSwapSuccess
}) => {
  const [exchangeRate, setExchangeRate] = useState<ExchangeData | null>(null);
  const [swapAmount, setSwapAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapHistory, setSwapHistory] = useState<SwapTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchExchangeRate = async () => {
    try {
      const response = await fetch('/api/exchange/rate');
      if (response.ok) {
        const data = await response.json();
        setExchangeRate(data);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      toast.error('Failed to fetch exchange rate');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSwapHistory = async () => {
    try {
      const response = await fetch(`/api/exchange/${telegramId}/swap/history`);
      if (response.ok) {
        const data = await response.json();
        setSwapHistory(data);
      }
    } catch (error) {
      console.error('Error fetching swap history:', error);
    }
  };

  const performSwap = async () => {
    const amount = parseFloat(swapAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > cfmBalance) {
      toast.error('Insufficient CFM balance');
      return;
    }

    if (!exchangeRate) {
      toast.error('Exchange rate not available');
      return;
    }

    setIsSwapping(true);
    try {
      const response = await fetch(`/api/exchange/${telegramId}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully swapped ${result.cfmAmount.toFixed(4)} CFM to ${result.cfmtAmount.toFixed(4)} CFMT`);
        setSwapAmount('');
        fetchSwapHistory();
        onSwapSuccess?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Swap failed');
      }
    } catch (error) {
      console.error('Error performing swap:', error);
      toast.error('Swap failed');
    } finally {
      setIsSwapping(false);
    }
  };

  const calculateCFMT = () => {
    const amount = parseFloat(swapAmount);
    if (!exchangeRate || isNaN(amount)) return 0;
    return amount * exchangeRate.rate;
  };

  const maxAmount = Math.min(cfmBalance, 1000); // Reasonable limit

  useEffect(() => {
    fetchExchangeRate();
    fetchSwapHistory();
  }, [telegramId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Exchange Rate Display */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
            Current Exchange Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(exchangeRate?.rate ? exchangeRate.rate * 100 : 0).toFixed(3)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                1 CFM = {(exchangeRate?.rate || 0).toFixed(6)} CFMT
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <CheckCircle className="w-3 h-3 mr-1" />
              Live Rate
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Swap Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowRightLeft className="w-5 h-5 mr-2" />
            Swap CFM → CFMT
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* CFM Balance */}
          <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">CFM Balance</p>
              <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                {cfmBalance.toFixed(4)} CFM
              </p>
            </div>
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Amount to Swap (CFM)</label>
            <div className="relative">
              <Input
                type="number"
                step="0.0001"
                min="0.0001"
                max={maxAmount}
                value={swapAmount}
                onChange={(e) => setSwapAmount(e.target.value)}
                placeholder="0.0000"
                className="pr-20"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSwapAmount(maxAmount.toString())}
                  className="text-xs"
                >
                  Max
                </Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Max: {maxAmount.toFixed(4)} CFM
            </p>
          </div>

          {/* Conversion Preview */}
          <AnimatePresence>
            {swapAmount && parseFloat(swapAmount) > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600"
              >
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">You pay</p>
                    <p className="text-lg font-semibold text-red-600">
                      -{parseFloat(swapAmount || '0').toFixed(4)} CFM
                    </p>
                  </div>
                  <ArrowRightLeft className="w-5 h-5 text-gray-400 mx-4" />
                  <div className="text-center flex-1">
                    <p className="text-sm text-gray-600 dark:text-gray-400">You receive</p>
                    <p className="text-lg font-semibold text-green-600">
                      +{calculateCFMT().toFixed(4)} CFMT
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-center">
                  <p className="text-xs text-gray-500">
                    Rate: {(exchangeRate?.rate || 0).toFixed(6)} CFMT per CFM
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Swap Button */}
          <Button
            onClick={performSwap}
            disabled={isSwapping || !swapAmount || parseFloat(swapAmount) <= 0 || parseFloat(swapAmount) > cfmBalance}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isSwapping ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Swapping...
              </>
            ) : (
              <>
                <ArrowRightLeft className="w-4 h-4 mr-2" />
                Swap Now
              </>
            )}
          </Button>

          {/* Warning */}
          {parseFloat(swapAmount || '0') > 0 && parseFloat(swapAmount || '0') > cfmBalance && (
            <div className="flex items-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <p className="text-sm text-red-700 dark:text-red-300">
                Insufficient CFM balance
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CFMT Balance */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CFMT Balance</p>
              <p className="text-xl font-semibold text-gray-900 dark:text-white">
                {cfmtBalance.toFixed(4)} CFMT
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4 mr-2" />
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Swap History */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <History className="w-5 h-5 mr-2" />
                  Swap History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {swapHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No swap transactions yet</p>
                ) : (
                  <div className="space-y-2">
                    {swapHistory.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {transaction.cfmAmount.toFixed(4)} CFM → {transaction.cfmtAmount.toFixed(4)} CFMT
                          </p>
                          <p className="text-sm text-gray-500">
                            Rate: {(transaction.exchangeRate * 100).toFixed(3)}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">
                            {new Date(transaction.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
