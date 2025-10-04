import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeftRight, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { useSwapCfmToCfmt, useSwapCfmtToCfm, useExchangeRate } from '@/hooks/useSwap';
import { showSuccess, showError } from '@/utils/toast';

interface SwapCardProps {
  telegramId: string;
  cfmBalance: number;
}

export const SwapCard = ({ telegramId, cfmBalance }: SwapCardProps) => {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [amount, setAmount] = useState('');
  const [direction, setDirection] = useState<'cfm-to-cfmt' | 'cfmt-to-cfm'>('cfm-to-cfmt');
  
  const swapCfmToCfmtMutation = useSwapCfmToCfmt(telegramId);
  const swapCfmtToCfmMutation = useSwapCfmtToCfm(telegramId);
  const { data: rateData, isLoading: rateLoading } = useExchangeRate(telegramId);

  const swapLoading = swapCfmToCfmtMutation.isPending || swapCfmtToCfmMutation.isPending;

  const handleSwap = async () => {
    const swapAmount = parseFloat(amount);
    
    if (isNaN(swapAmount) || swapAmount <= 0) {
      showError(t('swap.invalidAmount'));
      return;
    }

    if (swapAmount < 1) {
      showError(t('swap.minAmount'));
      return;
    }

    try {
      if (direction === 'cfm-to-cfmt') {
        if (swapAmount > cfmBalance) {
          showError(t('swap.insufficientBalance'));
          return;
        }
        const result = await swapCfmToCfmtMutation.mutateAsync(swapAmount);
        showSuccess(t('swap.successMessage', { 
          amount1: swapAmount.toFixed(2), 
          currency1: 'CFM',
          amount2: result.cfmtAmount.toFixed(2), 
          currency2: 'CFMT'
        }));
      } else {
        const result = await swapCfmtToCfmMutation.mutateAsync(swapAmount);
        showSuccess(t('swap.successMessage', { 
          amount1: swapAmount.toFixed(2), 
          currency1: 'CFMT',
          amount2: result.cfmAmount.toFixed(2), 
          currency2: 'CFM'
        }));
      }
      
      setAmount('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || t('swap.error');
      showError(errorMessage);
    }
  };

  const calculatePreview = () => {
    if (!amount || !rateData) return null;
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return null;

    if (direction === 'cfm-to-cfmt') {
      return (numAmount * rateData.rate).toFixed(4);
    } else {
      return (numAmount / rateData.rate).toFixed(4);
    }
  };

  const previewAmount = calculatePreview();

  return (
    <Card className="w-full bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 hover:border-purple-500/60 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-slate-900/30 backdrop-blur-sm relative overflow-hidden">
      <CardHeader 
        className="cursor-pointer select-none py-3 px-4 hover:bg-slate-700/20 transition-colors duration-200 rounded-t-lg"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-400/20 rounded-full">
              <ArrowLeftRight className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-white">{t('swap.title')}</CardTitle>
              {!isExpanded && rateData && (
                <CardDescription className="text-gray-300 text-xs mt-0.5">
                  1 CFM = <span className="text-yellow-400 font-mono font-semibold">{rateData.rate.toFixed(4)}</span> CFMT
                </CardDescription>
              )}
            </div>
          </div>
          <div className="p-1.5 hover:bg-slate-700/30 rounded-full transition-colors duration-200">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3 px-4 pb-4 animate-in slide-in-from-top duration-300">
          {/* Exchange Rate Display */}
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-yellow-300">{t('swap.currentRate')}:</span>
              {rateLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
              ) : rateData ? (
                <div className="text-right">
                  <div className="text-yellow-400 font-mono font-bold text-sm">
                    1 CFM = {rateData.rate.toFixed(4)} CFMT
                  </div>
                  <div className="text-xs text-gray-400">
                    {t('swap.rateVariation', { percent: (rateData.variation * 100).toFixed(2) })}
                  </div>
                </div>
              ) : (
                <span className="text-red-400 text-xs">{t('swap.error')}</span>
              )}
            </div>
          </div>

          {/* Direction Selector */}
          <div className="space-y-2">
            <Label className="text-gray-200 text-xs font-semibold">{t('swap.direction')}</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={direction === 'cfm-to-cfmt' ? 'default' : 'outline'}
                className={`${
                  direction === 'cfm-to-cfmt'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold py-2 rounded-lg text-xs'
                    : 'border-2 border-slate-600 text-gray-300 hover:bg-slate-700/50 hover:text-white font-semibold py-2 rounded-lg transition-all duration-200 text-xs'
                }`}
                onClick={() => setDirection('cfm-to-cfmt')}
                disabled={swapLoading}
              >
                {t('swap.cfmToCfmt')}
              </Button>
              <Button
                type="button"
                variant={direction === 'cfmt-to-cfm' ? 'default' : 'outline'}
                className={`${
                  direction === 'cfmt-to-cfm'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold py-2 rounded-lg text-xs'
                    : 'border-2 border-slate-600 text-gray-300 hover:bg-slate-700/50 hover:text-white font-semibold py-2 rounded-lg transition-all duration-200 text-xs'
                }`}
                onClick={() => setDirection('cfmt-to-cfm')}
                disabled={swapLoading}
              >
                {t('swap.cfmtToCfm')}
              </Button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="swapAmount" className="text-gray-200 text-xs font-semibold">
              {t('swap.amount')} ({direction === 'cfm-to-cfmt' ? 'CFM' : 'CFMT'})
            </Label>
            <div className="relative">
              <Input
                id="swapAmount"
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('swap.amountPlaceholder')}
                className="bg-slate-700/50 border-slate-600 text-white pr-16 h-10 text-sm rounded-lg focus:border-purple-500 focus:ring-purple-500/20"
                disabled={swapLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-semibold">
                {direction === 'cfm-to-cfmt' ? 'CFM' : 'CFMT'}
              </div>
            </div>
            {direction === 'cfm-to-cfmt' && (
              <p className="text-xs text-gray-400">
                {t('swap.available', { amount: cfmBalance.toFixed(2) })}
              </p>
            )}
          </div>

          {/* Preview */}
          {previewAmount && rateData && (
            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-lg p-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-emerald-300 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {t('swap.youWillReceive')}
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {previewAmount} {direction === 'cfm-to-cfmt' ? 'CFMT' : 'CFM'}
                </span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={swapLoading || !amount || parseFloat(amount) < 1}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold h-10 text-sm rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {swapLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('swap.swapping')}</>
            ) : (
              <>
                <ArrowLeftRight className="w-5 h-5 mr-2" />
                {t('swap.swapButton', { currency: direction === 'cfm-to-cfmt' ? 'CFMT' : 'CFM' })}
              </>
            )}
          </Button>

          {/* Info Note */}
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              <strong>{t('swap.note')}</strong> {t('swap.noteText', { currency: direction === 'cfm-to-cfmt' ? 'CFM' : 'CFMT' })}
            </p>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

