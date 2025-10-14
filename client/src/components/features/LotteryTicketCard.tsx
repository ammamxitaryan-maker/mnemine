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
    <div className="bg-gray-800/80 rounded-lg p-3 flex items-center gap-4">
      <Ticket className="w-8 h-8 text-accent flex-shrink-0" />
      <div className="flex flex-wrap gap-2">
        {numbers.map((num, index) => {
          const isWinner = winningSet.has(Number(num));
          return (
            <div key={index} className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-white transition-colors shadow-md ${isWinner ? 'bg-emerald' : 'bg-gray-600'}`}>
              {num}
            </div>
          );
        })}
      </div>
    </div>
  );
};