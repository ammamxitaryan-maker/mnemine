import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LotteryTicketCard } from './LotteryTicketCard';
import { LotteryDrawWithTickets } from '@/hooks/useLotteryHistory';
import { Award } from 'lucide-react';

interface LotteryHistoryCardProps {
  draw: LotteryDrawWithTickets;
}

export const LotteryHistoryCard = ({ draw }: LotteryHistoryCardProps) => {
  const { t } = useTranslation();
  const winningNumbers = draw.winningNumbers?.split(',');

  return (
    <Card className="bg-gray-900/80 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg">
          <span>{t('lottery.drawOf', { date: format(new Date(draw.drawDate), 'MMM d, yyyy') })}</span>
          <span className="text-yellow-400 font-bold">{draw.jackpot.toFixed(0)} MNE</span>
        </CardTitle>
        <CardDescription className="text-gray-400">{t('lottery.winningNumbers')}</CardDescription>
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          {winningNumbers?.map((num, index) => (
            <div key={index} className="w-9 h-9 flex items-center justify-center bg-green-600 text-white rounded-full font-bold">
              {num}
            </div>
          ))}
        </div>
      </CardHeader>
      {draw.tickets.length > 0 && (
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-t border-gray-700">
              <AccordionTrigger className="px-6 py-3 text-purple-400 hover:no-underline">
                {t('lottery.yourTicketsForDraw', { count: draw.tickets.length })}
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-4 space-y-3">
                {draw.tickets.map(ticket => (
                  <LotteryTicketCard key={ticket.id} ticket={ticket} winningNumbers={draw.winningNumbers} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      )}
    </Card>
  );
};
