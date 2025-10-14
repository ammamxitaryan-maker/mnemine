import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';
import { format } from 'date-fns';
import { Lottery } from '@/hooks/useLotteryData';

interface LastDrawResultsProps {
  draw: Lottery;
}

export const LastDrawResults = ({ draw }: LastDrawResultsProps) => {
  const { t } = useTranslation();
  const winningNumbers = draw.winningNumbers?.split(',');

  if (!winningNumbers) {
    return null;
  }

  return (
    <Card className="bg-gray-900/80 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="text-accent" />
          {t('lottery.lastDrawResults', { date: format(new Date(draw.drawDate), 'MMM d') })}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <p className="text-gray-400">{t('lottery.winningNumbers')}</p>
        <div className="flex flex-wrap gap-2 justify-center">
          {winningNumbers.map((num, index) => (
            <div key={index} className="w-10 h-10 flex items-center justify-center bg-emerald text-white rounded-full font-bold text-lg">
              {num}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};