"use client";

import { BuyTicketCard } from '@/components/features/BuyTicketCard';
import { LastDrawResults } from '@/components/features/LastDrawResults';
import { LotteryTicketCard } from '@/components/features/LotteryTicketCard';
import { Button } from '@/components/ui/button';
import { useCountdown } from '@/hooks/useCountdown';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import {
  AlertCircle,
  Clock,
  History,
  RefreshCw,
  Star,
  Ticket,
  Trophy
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BackButton } from './BackButton';

export const MinimalistLotteryPage = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { lottery, tickets, lastDraw, isLoading, error, refetch } = useLotteryData();
  const timeLeft = useCountdown(lottery?.drawDate || null);

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('lottery.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="p-4 bg-destructive/10 rounded-2xl w-fit mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t('lottery.failedToLoad')}</h2>
          <p className="text-muted-foreground mb-4">
            {t('lottery.loadError')}
          </p>
          <Button onClick={handleRetry} className="bg-primary hover:bg-primary/90">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('lottery.tryAgain')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/5">
      {/* Header */}
      <header className="px-3 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BackButton />
            <div className="p-1 bg-accent/10 rounded-md">
              <Ticket className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h1 className="text-lg font-medium text-foreground">{t('lottery.title')}</h1>
              <p className="text-xs text-muted-foreground">
                {tickets?.length || 0} tickets • {timeLeft.hours}h {timeLeft.minutes}m
              </p>
            </div>
          </div>

          <Link to="/lottery-history">
            <Button variant="outline" size="sm" className="border-border h-7 px-2">
              <History className="w-3 h-3 mr-1" />
              <span className="text-xs">{t('lottery.history')}</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Jackpot Card */}
      {lottery && (
        <div className="px-3 mb-3">
          <div className="minimal-card text-center relative overflow-hidden border border-accent/20 animate-in fade-in-0 slide-in-from-top-4 duration-700 shadow-xl">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-accent/10 to-accent/5 animate-pulse" />
            {/* Floating particles effect */}
            <div className="absolute inset-0 opacity-15">
              <div className="absolute top-3 left-3 w-1.5 h-1.5 bg-accent/30 rounded-full animate-ping" style={{ animationDelay: '0s' }} />
              <div className="absolute top-6 right-6 w-1 h-1 bg-accent/40 rounded-full animate-ping" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-4 left-6 w-1 h-1 bg-accent/30 rounded-full animate-ping" style={{ animationDelay: '2s' }} />
              <div className="absolute bottom-3 right-3 w-1.5 h-1.5 bg-accent/20 rounded-full animate-ping" style={{ animationDelay: '3s' }} />
            </div>

            <div className="relative z-10 p-3">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="p-2 bg-accent/20 rounded-lg shadow-md border border-accent/30 animate-bounce">
                  <Trophy className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">{t('lottery.currentJackpot')}</p>
                  <div className="text-2xl font-light text-accent drop-shadow-sm animate-pulse">
                    {lottery.jackpot.toFixed(0)} NON
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-2">
                <Clock className="w-3 h-3 animate-spin" />
                <span>{t('lottery.nextDrawIn')}</span>
              </div>

              <div className="text-xl font-mono text-foreground bg-background/80 rounded-md px-3 py-1.5 inline-block border border-border/50 shadow-md animate-pulse">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>

              {/* Progress indicator */}
              <div className="mt-3">
                <div className="w-full bg-muted/20 rounded-full h-1.5 border border-border/30">
                  <div
                    className="bg-gradient-to-r from-accent to-accent/80 h-1.5 rounded-full transition-all duration-1000 shadow-sm animate-pulse"
                    style={{
                      width: `${Math.max(0, Math.min(100, (timeLeft.totalSeconds / (24 * 60 * 60)) * 100))}%`
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {timeLeft.totalSeconds > 0 ? t('lottery.timeUntilDraw') : t('lottery.drawInProgress')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Draw Results */}
      {lastDraw && (
        <div className="px-3 mb-3">
          <div className="animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
            <LastDrawResults draw={lastDraw} />
          </div>
        </div>
      )}

      {/* Buy Ticket */}
      {user && (
        <div className="px-3 mb-3">
          <div className="animate-in fade-in-0 slide-in-from-right-4 duration-500 delay-300">
            <BuyTicketCard telegramId={user.telegramId} />
          </div>
        </div>
      )}

      {/* Your Tickets */}
      <div className="px-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1 bg-secondary/10 rounded-md">
              <Star className="w-3.5 h-3.5 text-secondary" />
            </div>
            <h2 className="text-sm font-medium text-foreground">{t('lottery.yourTickets')}</h2>
          </div>
          {tickets && tickets.length > 0 && (
            <div className="text-xs text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {tickets && tickets.length > 0 ? (
          <div className="space-y-2">
            {tickets
              .map((ticket, index) => (
                <div
                  key={ticket.id}
                  className="minimal-card hover:bg-muted/5 transition-all duration-500 hover:scale-[1.02] hover:shadow-lg animate-in fade-in-0 slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 bg-secondary/10 rounded-md">
                        <Ticket className="w-3 h-3 text-secondary" />
                      </div>
                      <span className="text-xs font-medium text-foreground">{t('lottery.ticketNumber')}{index + 1}</span>
                    </div>
                    {lastDraw?.winningNumbers && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">{t('lottery.matches')}</span>
                        <span className="text-xs text-accent font-semibold animate-pulse">
                          {ticket.numbers.split(',').filter(num =>
                            lastDraw.winningNumbers?.split(',').includes(num)
                          ).length}
                        </span>
                      </div>
                    )}
                  </div>
                  <LotteryTicketCard
                    ticket={ticket}
                    winningNumbers={lastDraw?.winningNumbers}
                  />
                </div>
              ))}
          </div>
        ) : (
          <div className="minimal-card text-center py-8 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-400">
            <div className="p-3 bg-muted/20 rounded-xl w-fit mx-auto mb-3 animate-bounce">
              <Ticket className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-sm font-medium text-foreground mb-1">{t('lottery.noTicketsYet')}</h3>
            <p className="text-xs text-muted-foreground">
              {t('lottery.buyFirstTicket')}
            </p>
          </div>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
};
