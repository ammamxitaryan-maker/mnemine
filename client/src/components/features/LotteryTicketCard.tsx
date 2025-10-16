import { LotteryTicket } from '@/hooks/useLotteryData';
import { Ticket } from 'lucide-react';

interface LotteryTicketCardProps {
  ticket: LotteryTicket;
  winningNumbers?: string | null;
}

export const LotteryTicketCard = ({ ticket, winningNumbers }: LotteryTicketCardProps) => {
  const numbers = ticket.numbers.split(',');
  const winningSet = new Set(winningNumbers?.split(',').map(Number) ?? []);

  return (
    <div className="bg-gradient-to-r from-muted/10 to-muted/5 rounded-lg p-3 border border-border/30 hover:border-border/50 transition-all duration-300">
      <div className="flex flex-wrap gap-1.5 justify-center">
        {numbers.map((num, index) => {
          const isWinner = winningSet.has(Number(num));
          return (
            <div 
              key={index} 
              className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white transition-all duration-500 shadow-lg hover:scale-125 animate-in zoom-in-0 cursor-pointer ${
                isWinner 
                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 border-2 border-emerald-400 shadow-emerald-500/50 animate-pulse animate-bounce hover:shadow-emerald-500/70' 
                  : 'bg-gradient-to-br from-muted-foreground/80 to-muted-foreground border border-border/50 hover:bg-gradient-to-br hover:from-primary/60 hover:to-primary/80 hover:shadow-primary/30'
              }`}
              style={{ animationDelay: `${index * 75}ms` }}
              title={isWinner ? `Winning number: ${num}` : `Number: ${num}`}
            >
              {num}
            </div>
          );
        })}
      </div>
    </div>
  );
};