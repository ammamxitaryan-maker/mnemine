import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2, Wallet as WalletIcon, ArrowDownToLine, ArrowUpFromLine, History } from 'lucide-react'; // Added History icon
import { Button } from '@/components/ui/button';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useActivityData, Activity } from '@/hooks/useActivityData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityCard } from '@/components/ActivityCard';
import { useUserData, UserData } from '@/hooks/useUserData';
import { PageHeader } from '@/components/PageHeader';
import { EarningsChart } from '@/components/EarningsChart';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'; // Import Accordion components
import { CardSkeleton, BalanceSkeleton } from '@/components/LoadingSkeleton';

const Wallet = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: activities, isLoading: activityLoading, error: activityError } = useActivityData(user?.telegramId);
  const { data: userData, isLoading: userDataLoading, error: userDataError } = useUserData(user?.telegramId);
  const { t } = useTranslation();

  const isLoading = authLoading || activityLoading || userDataLoading;
  const error = activityError || userDataError;

  if (error) {
    console.error(`[Wallet] Error fetching data for user ${user?.telegramId}:`, error);
    return <p className="text-red-500 text-center p-4">Could not load wallet data.</p>;
  }

  return (
    <div className="flex flex-col text-gray-800 p-4">
      <PageHeader titleKey="wallet.title" titleClassName="text-base" />

      <Card className="bg-white/90 backdrop-blur-sm border-blue-300 shadow-lg mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-600 text-center text-base font-medium">Current Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-4">
            {isLoading ? (
              <BalanceSkeleton />
            ) : (
              <p className="text-3xl font-bold text-blue-600">
                {(userData as UserData)?.balance.toFixed(4) || '0.0000'} CFM
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/deposit">
              <Button className="w-full bg-emerald hover:bg-emerald/90 h-10 text-base">
                <ArrowDownToLine className="w-4 h-4 mr-2" />
                Deposit
              </Button>
            </Link>
            <Link to="/withdraw">
              <Button className="w-full bg-primary hover:bg-primary/90 h-10 text-base">
                <ArrowUpFromLine className="w-4 h-4 mr-2" />
                Withdraw
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 backdrop-blur-sm border-primary mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WalletIcon className="text-primary" />
            {t('balanceHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : activities && activities.length > 0 ? (
            <EarningsChart activity={activities} />
          ) : (
            <p className="text-center text-gray-500 py-10">{t('noRecentActivity')}</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900/80 backdrop-blur-sm border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="text-primary" /> {/* Changed icon to History */}
            {t('recentActivity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (activities && activities.length > 0) ? (
            <Accordion type="single" collapsible defaultValue="recent-activity" className="w-full">
              <AccordionItem value="recent-activity" className="border-b border-gray-700">
                <AccordionTrigger className="text-lg font-semibold text-white hover:no-underline py-4">
                  {t('wallet.activityAccordionTitle', { count: activities.length })}
                </AccordionTrigger>
                <AccordionContent className="pt-4 pb-2 space-y-3">
                  {activities.map((tx: Activity) => (
                    <ActivityCard key={tx.id} activity={tx} />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : (
            <p className="text-center text-gray-500 py-10">{t('noRecentActivity')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;