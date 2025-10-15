import { useTranslation } from 'react-i18next';
import { Loader2, Users, DollarSign, UserCheck, Network } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useReferralData } from '@/hooks/useReferralData';
import { useReferralList } from '@/hooks/useReferralList';
import { useReferralStats } from '@/hooks/useReferralStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReferralLink } from '@/components/business/ReferralLink';
import { FriendCard } from '@/components/common/FriendCard';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Import Accordion components
import { REFERRAL_SIGNUP_BONUS } from '@/shared/constants';

const Referrals = () => {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: referralData, isLoading: referralDataLoading, error: referralDataError } = useReferralData(user?.telegramId);
  const { data: referralList, isLoading: referralListLoading, error: referralListError } = useReferralList(user?.telegramId);
  const { data: referralStats, isLoading: referralStatsLoading, error: referralStatsError } = useReferralStats(user?.telegramId);

  const isLoading = authLoading || referralDataLoading || referralStatsLoading;
  const error = referralDataError || referralListError || referralStatsError;

  if (error) {
    console.error(`[Referrals] Error fetching data for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load referral data.</p>;
  }

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
      <PageHeader titleKey="referrals.title" />

      {isLoading ? (
        <div className="flex justify-center pt-6">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <StatCard
              icon={DollarSign}
              label={t('referrals.totalEarnings')}
              value={referralStats?.totalReferralEarnings.toFixed(2) ?? '0.00'}
              isLoading={isLoading}
              unit="USD"
              colorClass="text-emerald"
            />
            <StatCard
              icon={UserCheck}
              label={t('referrals.activeReferrals')}
              value={referralStats?.activeReferralsCount ?? 0}
              isLoading={isLoading}
              colorClass="text-cyan"
            />
            <div className="sm:col-span-2">
              <StatCard
                icon={Network}
                label={t('referrals.byLevel')}
                value={`L1: ${referralStats?.referralsByLevel.l1 ?? 0} | L2: ${referralStats?.referralsByLevel.l2 ?? 0}`}
                isLoading={isLoading}
                colorClass="text-secondary"
              />
            </div>
          </div>

          <Card className="bg-gray-900/80 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{t('referrals.yourLink')}</CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              <p className="text-gray-400 mb-2 text-xs">{t('referrals.shareDescription')}</p>
              <p className="text-xs text-secondary mb-3">{t('referrals.bonusInfo', { bonus: REFERRAL_SIGNUP_BONUS })}</p>
              {referralData?.referralCode && <ReferralLink referralCode={referralData.referralCode} />}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users className="text-secondary w-4 h-4" />
                {t('referrals.yourFriends')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {referralListLoading ? (
                <div className="flex justify-center py-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (referralList && referralList.length > 0) ? (
                <Accordion type="single" collapsible defaultValue="friends-list" className="w-full">
                  <AccordionItem value="friends-list" className="border-b border-gray-700">
                    <AccordionTrigger className="text-base font-semibold text-white hover:no-underline py-2">
                      {t('referrals.friendsJoined', { count: referralList.length })}
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-1 space-y-2">
                      {referralList.map(friend => (
                        <FriendCard key={friend.id} friend={friend} />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2" />
                  <p className="text-sm">{t('referrals.noFriends')}</p>
                  <p className="text-xs mt-1">{t('referrals.shareDescription')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default Referrals;
