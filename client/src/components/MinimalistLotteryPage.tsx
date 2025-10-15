"use client";

import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { 
  Ticket, 
  Clock, 
  Trophy, 
  Loader2,
  History,
  Star,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useLotteryData } from '@/hooks/useLotteryData';
import { useCountdown } from '@/hooks/useCountdown';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { BuyTicketCard } from '@/components/features/BuyTicketCard';
import { LotteryTicketCard } from '@/components/features/LotteryTicketCard';
import { LastDrawResults } from '@/components/features/LastDrawResults';
import { Button } from '@/components/ui/button';
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
          <p className="text-muted-foreground">Loading lottery...</p>
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
          <h2 className="text-xl font-semibold text-foreground mb-2">Failed to Load Lottery</h2>
          <p className="text-muted-foreground mb-4">
            Could not load lottery data. Please check your connection and try again.
          </p>
          <Button onClick={handleRetry} className="bg-primary hover:bg-primary/90">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div className="p-2 bg-accent/10 rounded-xl">
              <Ticket className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-light text-foreground">Lottery</h1>
              <p className="text-sm text-muted-foreground">
                {tickets?.length || 0} tickets • Next draw in {timeLeft.hours}h {timeLeft.minutes}m
              </p>
            </div>
          </div>
          
          <Link to="/lottery-history">
            <Button variant="outline" size="sm" className="border-border">
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </Link>
        </div>
      </header>

      {/* Jackpot Card */}
      {lottery && (
        <div className="px-6 mb-6">
          <div className="minimal-card text-center relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-accent/10 to-accent/5 animate-pulse" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-accent/20 rounded-2xl shadow-lg">
                  <Trophy className="w-8 h-8 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Jackpot</p>
                  <div className="text-4xl font-light text-accent drop-shadow-sm">
                    {lottery.jackpot.toFixed(2)} USD
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                <Clock className="w-4 h-4" />
                <span>Next draw in</span>
              </div>
              
              <div className="text-2xl font-mono text-foreground bg-background/50 rounded-lg px-4 py-2 inline-block">
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
              </div>
              
              {/* Progress indicator */}
              <div className="mt-4">
                <div className="w-full bg-muted/20 rounded-full h-2">
                  <div 
                    className="bg-accent h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${Math.max(0, Math.min(100, (timeLeft.totalSeconds / (24 * 60 * 60)) * 100))}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {timeLeft.totalSeconds > 0 ? 'Time until next draw' : 'Draw in progress...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Draw Results */}
      {lastDraw && (
        <div className="px-6 mb-6">
          <LastDrawResults draw={lastDraw} />
        </div>
      )}

      {/* Buy Ticket */}
      {user && (
        <div className="px-6 mb-6">
          <BuyTicketCard telegramId={user.telegramId} />
        </div>
      )}

      {/* Your Tickets */}
      <div className="px-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-secondary/10 rounded-xl">
              <Star className="w-5 h-5 text-secondary" />
            </div>
            <h2 className="text-lg font-medium text-foreground">Your Tickets</h2>
          </div>
          {tickets && tickets.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {tickets && tickets.length > 0 ? (
          <div className="space-y-3">
            {tickets.map((ticket, index) => (
              <div key={ticket.id} className="minimal-card hover:bg-muted/5 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Ticket #{index + 1}</span>
                  {lastDraw?.winningNumbers && (
                    <span className="text-xs text-accent font-medium">
                      {ticket.numbers.split(',').filter(num => 
                        lastDraw.winningNumbers?.split(',').includes(num)
                      ).length} matches
                    </span>
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
          <div className="minimal-card text-center py-12">
            <div className="p-4 bg-muted/20 rounded-2xl w-fit mx-auto mb-4">
              <Ticket className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No Tickets Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Buy your first ticket to participate in the lottery
            </p>
            {user && (
              <div className="max-w-sm mx-auto">
                <BuyTicketCard telegramId={user.telegramId} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-20" />
    </div>
  );
};
