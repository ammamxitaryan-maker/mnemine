import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Loader2, Ticket, History } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useCountdown } from '@/hooks/useCountdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BuyTicketCard } from '@/components/BuyTicketCard';
import { LotteryTicketCard } from '@/components/LotteryTicketCard';
import { LastDrawResults } from '@/components/LastDrawResults';
import { useTelegramAuth } from '@/hooks/useTelegramAuth'; // Import useTelegramAuth

const Lottery = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth(); // Get user from auth hook
  const { lottery, tickets, lastDraw, isLoading, error } = useLotteryData();
  const timeLeft = useCountdown(lottery?.drawDate || null);

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
      <PageHeader titleKey="lottery.title" />

      {isLoading ? (
        <div className="flex justify-center pt-6">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center text-sm">Could not load lottery data.</p>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link to="/lottery-history">
              <Button variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent/80 text-xs py-1">
                <History className="w-3 h-3 mr-1" />
                {t('lottery.history.link')}
              </Button>
            </Link>
          </div>

          {lottery && (
            <Card className="bg-gray-900/80 border-primary text-center">
              <CardHeader className="pb-1">
                <CardTitle className="text-gray-400 text-sm font-medium">{t('lottery.currentJackpot')}</CardTitle>
              </CardHeader>
              <CardContent className="p-3">
                <p className="text-2xl font-bold text-gold animate-pulse-subtle">
                  {lottery.jackpot.toFixed(2)} <span className="text-lg">USD</span>
                </p>
                <p className="text-gray-400 mt-1 text-xs">{t('lottery.drawsIn')}</p>
                <p className="text-lg font-mono text-accent">
                  {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </p>
              </CardContent>
            </Card>
          )}

          {lastDraw && <LastDrawResults draw={lastDraw} />}

          {user && <BuyTicketCard telegramId={user.telegramId} />} {/* Pass telegramId here */}

          <Card className="bg-gray-900/80 border-primary">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Ticket className="text-accent w-4 h-4" />
                {t('lottery.yourTickets')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3">
              {tickets && tickets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tickets.map(ticket => (
                    <LotteryTicketCard key={ticket.id} ticket={ticket} winningNumbers={lastDraw?.winningNumbers} />
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-3 text-sm">{t('lottery.noTickets')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      </div>
    </div>
  );
};

export default Lottery;
