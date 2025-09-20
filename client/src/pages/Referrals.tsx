import { useTranslation } from 'react-i18next';
import { Loader2, Users, DollarSign, UserCheck, Network } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useReferralData } from '@/hooks/useReferralData';
import { useReferralList } from '@/hooks/useReferralList';
import { useReferralStats } from '@/hooks/useReferralStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReferralLink } from '@/components/ReferralLink';
import { FriendCard } from '@/components/FriendCard';
import { PageHeader } from '@/components/PageHeader';
import { StatCard } from '@/components/StatCard';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Import Accordion components
import { REFERRAL_SIGNUP_BONUS } from 'shared';

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
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="referrals.title" />

      {isLoading ? (
        <div className="flex justify-center pt-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <StatCard
              icon={DollarSign}
              label={t('referrals.totalEarnings')}
              value={referralStats?.totalReferralEarnings.toFixed(2) ?? '0.00'}
              isLoading={isLoading}
              unit="CFM"
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
                value={`L1: ${referralStats?.referralsByLevel.l1 ?? 0} | L2: ${referralStats?.referralsByLevel.l2 ?? 0} | L3: ${referralStats?.referralsByLevel.l3 ?? 0}`}
                isLoading={isLoading}
                colorClass="text-secondary"
              />
            </div>
          </div>

          <Card className="bg-gray-900/80 backdrop-blur-sm border-primary">
            <CardHeader>
              <CardTitle>{t('referrals.yourLink')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400 mb-2">{t('referrals.shareDescription')}</p>
              <p className="text-sm text-secondary mb-4">{t('referrals.bonusInfo', { bonus: REFERRAL_SIGNUP_BONUS })}</p>
              {referralData?.referralCode && <ReferralLink referralCode={referralData.referralCode} />}
            </CardContent>
          </Card>

          <Card className="bg-gray-900/80 backdrop-blur-sm border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="text-primary" />
                {t('referrals.yourFriends')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {referralListLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (referralList && referralList.length > 0) ? (
                <Accordion type="single" collapsible defaultValue="friends-list" className="w-full">
                  <AccordionItem value="friends-list" className="border-b border-gray-700">
                    <AccordionTrigger className="text-lg font-semibold text-white hover:no-underline py-4">
                      {t('referrals.friendsJoined', { count: referralList.length })}
                    </AccordionTrigger>
                    <AccordionContent className="pt-4 pb-2 space-y-3">
                      {referralList.map(friend => (
                        <FriendCard key={friend.id} friend={friend} />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4" />
                  <p className="text-lg">{t('referrals.noFriends')}</p>
                  <p className="text-sm mt-1">{t('referrals.shareDescription')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Referrals;