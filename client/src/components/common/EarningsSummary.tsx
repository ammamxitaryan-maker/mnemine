import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, TrendingUp, CheckCircle, Loader2 } from 'lucide-react';
import { useEarnings } from '@/hooks/useEarnings';
import { showSuccess, showError } from '@/utils/toast';

interface EarningsSummaryProps {
  telegramId?: string;
}

const EarningsSummary: React.FC<EarningsSummaryProps> = ({ telegramId }) => {
  const { t } = useTranslation();
  const { earnings, isLoading, claimEarnings, isClaiming, claimResult } = useEarnings(telegramId);

  const handleClaimEarnings = async () => {
    if (!telegramId) return;

    try {
      await claimEarnings({});
      if (claimResult?.success) {
        showSuccess(`Successfully claimed ${claimResult.claimedAmount.toFixed(2)} MNE!`);
      } else {
        showError(claimResult?.message || 'Failed to claim earnings');
      }
    } catch (error) {
      showError('Error claiming earnings');
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-900/80 border-primary text-white">
        <CardContent className="p-4 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading earnings...</span>
        </CardContent>
      </Card>
    );
  }

  const totalEarnings = earnings?.totalAccruedEarnings || 0;
  const hasEarningsToClaim = earnings?.hasEarningsToClaim || false;

  return (
    <Card className="bg-gray-900/80 border-primary text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center">
          <Coins className="w-5 h-5 mr-2 text-emerald-400" />
          {t('earnings.title', 'Accumulated Earnings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total accumulated earnings */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 border border-emerald-700/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-emerald-400" />
              <span className="text-sm text-emerald-300">
                {t('earnings.totalAccumulated', 'Total Accumulated:')}
              </span>
            </div>
            <span className="text-2xl font-bold text-emerald-400">
              {totalEarnings.toFixed(4)} MNE
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {t('earnings.description', 'Earnings from all active slots')}
          </p>
        </div>

        {/* Claim button */}
        {hasEarningsToClaim ? (
          <Button
            onClick={handleClaimEarnings}
            disabled={isClaiming}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3"
          >
            {isClaiming ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {t('earnings.claiming', 'Claiming...')}
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {t('earnings.claimAll', 'Claim All Earnings')} ({totalEarnings.toFixed(2)} MNE)
              </>
            )}
          </Button>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-center">
            <Coins className="w-8 h-8 mx-auto text-gray-500 mb-2" />
            <p className="text-gray-400 text-sm">
              {t('earnings.noEarnings', 'No earnings to claim yet')}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t('earnings.waitMessage', 'Earnings will accumulate and be available for claim')}
            </p>
          </div>
        )}

        {/* Last updated info */}
        <div className="text-xs text-gray-500 text-center">
          {t('earnings.lastUpdated', 'Last updated:')} {earnings?.lastUpdated ? new Date(earnings.lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
      </CardContent>
    </Card>
  );
};

export default EarningsSummary;
