import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react'; // Added History icon
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useActivityData, Activity } from '@/hooks/useActivityData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityCard } from '@/components/common/ActivityCard';
import { useUserData, UserData } from '@/hooks/useUserData';
import { useSlotsData } from '@/hooks/useSlotsData';
import { useExchangeRate } from '@/hooks/useSwap';
import { PageHeader } from '@/components/PageHeader';
import { EarningsChart } from '@/components/common/EarningsChart';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Import Accordion components

const Wallet = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: activities, isLoading: activityLoading, error: activityError } = useActivityData(user?.telegramId);
  const { data: userData, isLoading: userDataLoading, error: userDataError } = useUserData(user?.telegramId);
  const { data: slotsData, isLoading: slotsLoading } = useSlotsData(user?.telegramId);
  const { data: rateData } = useExchangeRate(user?.telegramId || '');
  const { t } = useTranslation();

  const isLoading = authLoading || activityLoading || userDataLoading || slotsLoading;
  const error = activityError || userDataError;

  // Calculate total available balance (wallet balance + accrued earnings)
  const totalBalance = (userData?.balance || 0) + (userData?.accruedEarnings || 0);
  const mneBalance = userData?.mneBalance || 0;
  const usdEquivalent = rateData && mneBalance ? mneBalance * rateData.rate : 0;

  if (error) {
    console.error(`[Wallet] Error fetching data for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load wallet data.</p>;
  }

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
        <PageHeader titleKey="wallet.title" titleClassName="text-base" />

      <Card className="bg-gray-900/80 border-primary mb-3">
        <CardHeader className="pb-1">
          <CardTitle className="text-gray-400 text-center text-sm font-medium">Current Balance</CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          <p className="text-2xl font-bold text-center text-purple-400 mb-2">
            {isLoading ? <Loader2 className="w-6 h-6 mx-auto animate-spin" /> : `${mneBalance.toFixed(2)} MNE`}
          </p>
          {/* USD Equivalent Display */}
          {usdEquivalent > 0 && (
            <p className="text-lg font-semibold text-center text-yellow-400 mb-3">
              {usdEquivalent.toFixed(4)} USD
            </p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Link to="/deposit">
              <Button className="w-full bg-emerald hover:bg-emerald/90 h-8 text-sm">
                <ArrowDownToLine className="w-3 h-3 mr-1" />
                Deposit
              </Button>
            </Link>
            <Link to="/withdraw">
              <Button className="w-full bg-primary hover:bg-primary/90 h-8 text-sm">
                <ArrowUpFromLine className="w-3 h-3 mr-1" />
                Withdraw
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 border-primary mb-3">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <WalletIcon className="text-secondary w-4 h-4" />
            {t('balanceHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {activityLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : activities && activities.length > 0 ? (
            <EarningsChart activity={activities} />
          ) : (
            <p className="text-center text-gray-500 py-6 text-sm">{t('noRecentActivity')}</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 border-primary">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="text-secondary w-4 h-4" />
            {t('recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (activities && activities.length > 0) ? (
            <Accordion type="single" collapsible defaultValue="recent-activity" className="w-full">
              <AccordionItem value="recent-activity" className="border-b border-gray-700">
                <AccordionTrigger className="text-base font-semibold text-white hover:no-underline py-2">
                  {t('wallet.activityAccordionTitle', { count: activities.length })}
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-1 space-y-2">
                  {activities.map((tx: Activity) => (
                    <ActivityCard key={tx.id} activity={tx} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <p className="text-center text-gray-500 py-6 text-sm">{t('noRecentActivity')}</p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default Wallet;
