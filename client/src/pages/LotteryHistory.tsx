import { useTranslation } from 'react-i18next';
import { Loader2, History } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useLotteryHistory } from '@/hooks/useLotteryHistory';
import { LotteryHistoryCard } from '@/components/LotteryHistoryCard';

const LotteryHistory = () => {
  const { t } = useTranslation();
  const { data: history, isLoading, error } = useLotteryHistory();

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
      <PageHeader titleKey="lottery.history.title" backTo="/lottery" />

      {isLoading ? (
        <div className="flex justify-center pt-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center">{t('lottery.history.error')}</p>
      ) : (
        <div className="space-y-4">
          {history && history.length > 0 ? (
            history.map(draw => <LotteryHistoryCard key={draw.id} draw={draw} />)
          ) : (
            <div className="text-center py-20 text-gray-500">
              <History className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">{t('lottery.history.noHistory')}</p>
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

export default LotteryHistory;