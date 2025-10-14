import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { UserStats } from '@/hooks/useStatsData';
import { UserData } from '@/hooks/useUserData';
import { 
  WITHDRAWAL_MIN_BALANCE_REQUIREMENT,
  WITHDRAWAL_REFERRAL_REQUIREMENT,
  WITHDRAWAL_SLOT_REQUIREMENT,
  FIRST_100_WITHDRAWALS_LIMIT
} from '@/shared/constants';

interface WithdrawalChecklistProps {
  userData: UserData | undefined;
  userStats: UserStats | undefined;
}

const ChecklistItem = ({ isMet, text }: { isMet: boolean; text: string }) => (
  <div className={`flex items-center gap-3 ${isMet ? 'text-green-400' : 'text-red-400'}`}>
    {isMet ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <XCircle className="w-5 h-5 flex-shrink-0" />}
    <span className="text-sm text-gray-300">{text}</span>
  </div>
);

export const WithdrawalChecklist = ({ userData, userStats }: WithdrawalChecklistProps) => {
  const { t } = useTranslation();

  if (!userData || !userStats) {
    return null;
  }

  const totalWithdrawalsMade = userStats.totalSystemWithdrawals;
  const showAdvancedRequirements = totalWithdrawalsMade >= FIRST_100_WITHDRAWALS_LIMIT;

  const checks = [
    {
      isMet: !userStats.isSuspicious,
      text: t('withdraw.checklist.notSuspicious'),
    },
    {
      isMet: userStats.isEligible,
      text: t('withdraw.checklist.isEligible'),
    },
    {
      isMet: userData.balance >= WITHDRAWAL_MIN_BALANCE_REQUIREMENT,
      text: t('withdraw.checklist.minBalance', { amount: WITHDRAWAL_MIN_BALANCE_REQUIREMENT.toFixed(2) }),
    },
  ];

  if (showAdvancedRequirements) {
    checks.push(
      {
        isMet: (userStats.activeReferralCount ?? 0) >= WITHDRAWAL_REFERRAL_REQUIREMENT,
        text: t('withdraw.checklist.minReferrals', { required: WITHDRAWAL_REFERRAL_REQUIREMENT, current: userStats.activeReferralCount ?? 0 }),
      },
      {
        isMet: (userStats.slotsOwned ?? 0) >= WITHDRAWAL_SLOT_REQUIREMENT,
        text: t('withdraw.checklist.minSlots', { required: WITHDRAWAL_SLOT_REQUIREMENT, current: userStats.slotsOwned ?? 0 }),
      }
    );
  }

  return (
    <Card className="bg-gray-900/80 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Info className="w-5 h-5 text-purple-400" />
          {t('withdraw.checklist.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {checks.map((check, index) => (
          <ChecklistItem key={index} isMet={check.isMet} text={check.text} />
        ))}
        {showAdvancedRequirements && (
            <p className="text-xs text-gray-500 pt-2">{t('withdraw.requirements.disclaimer', { limit: FIRST_100_WITHDRAWALS_LIMIT })}</p>
        )}
      </CardContent>
    </Card>
  );
};