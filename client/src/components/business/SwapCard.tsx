import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeftRight, ChevronDown, ChevronUp, Info, TrendingUp, DollarSign } from 'lucide-react';
import { FlippableCard } from '@/components/common/FlippableCard';
import { useSwapLogic } from '@/hooks/useSwapLogic';
// swap-interface.css removed - no longer needed

interface SwapCardProps {
  telegramId: string;
  USDBalance: number;
  variant?: 'card' | 'simple';
  showBackContent?: boolean;
  showAccordion?: boolean;
}

export const SwapCard = ({ 
  telegramId, 
  USDBalance, 
  variant = 'card',
  showBackContent = true,
  showAccordion = true 
}: SwapCardProps) => {
  const { t } = useTranslation();
  const {
    amount,
    direction,
    setAmount,
    setDirection,
    rateData,
    rateLoading,
    swapLoading,
    previewAmount,
    handleSwap,
    handleAmountChange,
    isSwapDisabled
  } = useSwapLogic({ telegramId, USDBalance });

  // Swap Card Front Content (Full Swap Interface)
  const SwapFront = () => (
    <Card className="w-full h-full min-h-[20rem] max-h-[24rem] bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 shadow-2xl backdrop-blur-sm relative overflow-y-auto">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-400/20 rounded-full">
              <ArrowLeftRight className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-bold text-white">{t('swap.title')}</CardTitle>
              {rateData && (
                <CardDescription className="text-gray-300 text-xs mt-0.5">
                  1 USD = <span className="text-yellow-400 font-mono font-semibold">{rateData.rate.toFixed(4)}</span> MNE
                </CardDescription>
              )}
            </div>
          </div>
          <div className="w-6 h-6 bg-slate-700/50 rounded-full flex items-center justify-center">
              <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 space-y-3">
          {/* Exchange Rate Display */}
          <div className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border border-yellow-700/50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-yellow-300">{t('swap.currentRate')}:</span>
              {rateLoading ? (
                <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
              ) : rateData ? (
                <div className="text-right">
                  <div className="text-yellow-400 font-mono font-bold text-sm">
                    1 USD = {rateData.rate.toFixed(4)} MNE
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
                variant={direction === 'USD-to-MNE' ? 'default' : 'outline'}
                className={`${
                  direction === 'USD-to-MNE'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold py-2 rounded-lg text-xs'
                    : 'border-2 border-slate-600 text-gray-300 hover:bg-slate-700/50 hover:text-white font-semibold py-2 rounded-lg transition-all duration-200 text-xs'
                }`}
                onClick={() => setDirection('USD-to-MNE')}
                disabled={swapLoading}
              >
                {t('swap.MNEoMNE')}
              </Button>
              <Button
                type="button"
                variant={direction === 'MNE-to-USD' ? 'default' : 'outline'}
                className={`${
                  direction === 'MNE-to-USD'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold py-2 rounded-lg text-xs'
                    : 'border-2 border-slate-600 text-gray-300 hover:bg-slate-700/50 hover:text-white font-semibold py-2 rounded-lg transition-all duration-200 text-xs'
                }`}
                onClick={() => setDirection('MNE-to-USD')}
                disabled={swapLoading}
              >
                {t('swap.MNEToUSD')}
              </Button>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="swapAmount" className="text-gray-200 text-xs font-semibold">
              {t('swap.amount')} ({direction === 'USD-to-MNE' ? 'USD' : 'MNE'})
            </Label>
            <div className="relative">
              <Input
                id="swapAmount"
                type="number"
                step="0.01"
                min="0.001"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount (min 0.001)"
                className="bg-slate-700/50 border-slate-600 text-white pr-16 h-10 text-sm rounded-lg focus:border-purple-500 focus:ring-purple-500/20"
                disabled={swapLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xs font-semibold">
                {direction === 'USD-to-MNE' ? 'USD' : 'MNE'}
              </div>
            </div>
            {direction === 'USD-to-MNE' && (
              <p className="text-xs text-gray-400">
                {t('swap.available', { amount: USDBalance.toFixed(2) })}
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
                  {previewAmount} {direction === 'USD-to-MNE' ? 'MNE' : 'USD'}
                </span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <Button
            onClick={handleSwap}
            disabled={isSwapDisabled}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white font-semibold h-10 text-sm rounded-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {swapLoading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> {t('swap.swapping')}</>
            ) : (
              <>
                <ArrowLeftRight className="w-5 h-5 mr-2" />
                {t('swap.swapButton', { currency: direction === 'USD-to-MNE' ? 'MNE' : 'USD' })}
              </>
            )}
          </Button>

          {/* Info Note */}
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-4">
            <p className="text-sm text-blue-300">
              <strong>{t('swap.note')}</strong> {t('swap.noteText', { currency: direction === 'USD-to-MNE' ? 'USD' : 'MNE' })}
            </p>
          </div>
        </CardContent>
    </Card>
  );

  // Swap Card Back Content (Advanced Features)
  const SwapBack = () => (
    <Card className="w-full h-full min-h-[20rem] max-h-[24rem] bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 shadow-2xl backdrop-blur-sm relative overflow-y-auto">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-bold flex items-center justify-center gap-2">
          <div className="p-1.5 bg-blue-400/20 rounded-full">
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          Advanced Swap
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-2 space-y-4">
        <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-300">Your Balance:</span>
            <span className="text-sm font-bold text-emerald-400">{USDBalance.toFixed(2)} USD</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-emerald-300">Est. MNE Value:</span>
            <span className="text-sm font-bold text-emerald-400">
              {rateData ? (USDBalance * rateData.rate).toFixed(4) : '0.0000'} MNE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border border-purple-700/50 rounded-lg p-3 text-center">
            <DollarSign className="w-5 h-5 text-purple-400 mx-auto mb-1" />
            <p className="text-xs text-purple-300">USD to MNE</p>
          </div>
          <div className="bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border border-cyan-700/50 rounded-lg p-3 text-center">
            <ArrowLeftRight className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <p className="text-xs text-cyan-300">MNE to USD</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border border-blue-700/50 rounded-xl p-3">
          <p className="text-xs text-blue-300 text-center">
            <strong>Pro Tip:</strong> Use limit orders for better rates
          </p>
        </div>
      </CardContent>
    </Card>
  );

  // Swap Card Accordion Content
  const accordionContent = (
    <div className="space-y-3">
      {/* Market Info */}
      <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 border border-gray-700/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-300">Market Status</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-emerald-400 font-semibold">Active</span>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );

  // Simple variant for dashboard use
  if (variant === 'simple') {
    return (
      <div className="swap-interface">
        <div className="swap-interface__header">
          <h3 className="swap-interface__title">Currency Swap (USD ⇄ MNE)</h3>
          {rateLoading ? (
            <div className="w-30 h-5 bg-gray-300 rounded animate-pulse" />
          ) : rateData ? (
            <div className="swap-interface__rate">
              <span className="swap-interface__rate-label">Current Rate:</span>
              <span className="swap-interface__rate-value">{rateData.rate.toFixed(4)}</span>
            </div>
          ) : (
            <div className="swap-interface__rate-error">Rate unavailable</div>
          )}
        </div>

        <div className="swap-interface__form">
          <div className="swap-interface__direction">
            <label className="swap-interface__direction-label">Direction:</label>
            <select 
              value={direction} 
              onChange={(e) => setDirection(e.target.value as 'USD-to-MNE' | 'MNE-to-USD')}
              className="swap-interface__direction-select"
              disabled={swapLoading}
            >
              <option value="USD-to-MNE">USD → MNE</option>
              <option value="MNE-to-USD">MNE → USD</option>
            </select>
          </div>

          <div className="swap-interface__amount">
            <label className="swap-interface__amount-label">Amount:</label>
            <div className="swap-interface__amount-input-group">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="Enter amount (min 0.001)"
                className="swap-interface__amount-input"
                disabled={swapLoading}
                min="0.001"
                step="0.01"
              />
              <span className="swap-interface__amount-currency">
                {direction === 'USD-to-MNE' ? 'USD' : 'MNE'}
              </span>
            </div>
          </div>

          {previewAmount && rateData && (
            <div className="swap-interface__preview">
              <div className="swap-interface__preview-label">You will receive:</div>
              <div className="swap-interface__preview-amount">
                {previewAmount} {direction === 'USD-to-MNE' ? 'MNE' : 'USD'}
              </div>
            </div>
          )}

          <button
            onClick={handleSwap}
            disabled={isSwapDisabled}
            className="swap-interface__button"
          >
            {swapLoading ? 'Swapping...' : (direction === 'USD-to-MNE' ? 'Swap to MNE' : 'Swap to USD')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <FlippableCard
      id="swap-card"
      frontContent={<SwapFront />}
      backContent={showBackContent ? <SwapBack /> : undefined}
      enableAccordion={showAccordion}
      accordionContent={showAccordion ? accordionContent : undefined}
      showFlipIndicator={true}
    />
  );
};


