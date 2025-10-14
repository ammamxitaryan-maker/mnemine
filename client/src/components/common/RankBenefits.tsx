import { useTranslation } from 'react-i18next';
import { CheckCircle } from 'lucide-react';
import { RANKED_REFERRAL_COMMISSIONS_L1, RANKED_REFERRAL_COMMISSIONS_L2, RANKED_REFERRAL_COMMISSIONS_L3, RANK_SLOT_RATE_BONUS_PERCENTAGE, REFERRAL_COMMISSIONS } from '@/shared/constants';

interface RankBenefitsProps {
  rank: string | null;
}

export const RankBenefits = ({ rank }: RankBenefitsProps) => {
  const { t } = useTranslation();

  if (!rank) {
    return null; // Don't show anything if the user has no rank
  }

  // For simplicity, assuming all ranks have the same benefits for now as per backend constants
  // In a more complex app, RANK_BENEFITS would be a map based on rank string
  const benefits = {
    referralCommissionL1: RANKED_REFERRAL_COMMISSIONS_L1,
    referralCommissionL2: RANKED_REFERRAL_COMMISSIONS_L2, // Corrected typo
    referralCommissionL3: RANKED_REFERRAL_COMMISSIONS_L3,
    slotRateBonus: RANK_SLOT_RATE_BONUS_PERCENTAGE,
  };

  return (
    <div className="space-y-3 text-sm text-left">
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-white">{t('boostedReferralCommissions')}</p>
          <p className="text-gray-400">
            {t('commissionsDetail', { 
              l1: (benefits.referralCommissionL1 * 100), 
              l2: (benefits.referralCommissionL2 * 100), 
              l3: (benefits.referralCommissionL3 * 100),
              base_l1: (REFERRAL_COMMISSIONS[0] * 100),
              base_l2: (REFERRAL_COMMISSIONS[1] * 100),
              base_l3: (REFERRAL_COMMISSIONS[2] * 100)
            })}
          </p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-white">{t('increasedMiningPower')}</p>
          <p className="text-gray-400">{t('miningPowerDetail', { bonus: (benefits.slotRateBonus * 100) })}</p>
        </div>
      </div>
    </div>
  );
};