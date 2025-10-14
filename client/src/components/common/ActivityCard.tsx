import { Activity } from '@/hooks/useActivityData';
import { formatDistanceToNow } from 'date-fns';
import { 
  ArrowDownLeft, ArrowUpRight, Coins, Gift, Users, Zap, Server, PlusCircle, 
  ArrowDownToLine, ArrowUpFromLine, CalendarDays, PartyPopper, RefreshCw, 
  Trophy, TrendingUp, PiggyBank, ShieldAlert, Ticket, Award 
} from 'lucide-react';

interface ActivityCardProps {
  activity: Activity;
}

const getActivityIcon = (activity: Activity) => {
  const isCredit = activity.amount > 0;
  const iconProps = {
    className: `w-7 h-7 p-1.5 rounded-full ${isCredit ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`,
  };

  switch (activity.type) {
    case 'DEPOSIT':
      return <ArrowDownToLine {...iconProps} />;
    case 'WITHDRAWAL':
      return <ArrowUpFromLine {...iconProps} />;
    case 'CLAIM':
      return <Coins {...iconProps} />;
    case 'NEW_SLOT_PURCHASE':
      return <PlusCircle {...iconProps} />;
    case 'SLOT_EXTENSION':
      return <Server {...iconProps} />;
    case 'BOOSTER_PURCHASE':
      return <Zap {...iconProps} />;
    case 'REFERRAL_SIGNUP_BONUS':
    case 'REFERRAL_COMMISSION':
    case 'REFERRAL_DEPOSIT_BONUS':
    case 'REFERRAL_3_IN_3_DAYS_BONUS':
      return <Users {...iconProps} />;
    case 'TASK_REWARD':
      return <Gift {...iconProps} />;
    case 'DAILY_BONUS':
      return <CalendarDays {...iconProps} />;
    case 'WELCOME_BONUS':
      return <PartyPopper {...iconProps} />;
    case 'REINVESTMENT':
      return <RefreshCw {...iconProps} />;
    case 'LEADERBOARD_BONUS':
      return <Trophy {...iconProps} />;
    case 'INVESTMENT_GROWTH_BONUS':
      return <TrendingUp {...iconProps} />;
    case 'DIVIDEND_BONUS':
      return <PiggyBank {...iconProps} />;
    case 'BALANCE_ZEROED_PENALTY':
      return <ShieldAlert {...iconProps} />;
    case 'LOTTERY_TICKET_PURCHASE':
      return <Ticket {...iconProps} />;
    case 'LOTTERY_WIN':
      return <Award {...iconProps} />;
    default:
      return isCredit ? <ArrowDownLeft {...iconProps} /> : <ArrowUpRight {...iconProps} />;
  }
};

export const ActivityCard = ({ activity }: ActivityCardProps) => {
  const isCredit = activity.amount > 0;
  const formattedAmount = `${isCredit ? '+' : ''}${activity.amount.toFixed(4)}`;
  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true });

  return (
    <div className="flex items-center justify-between p-2 bg-gray-800 rounded-lg">
      <div className="flex items-center gap-3">
        {getActivityIcon(activity)}
        <div>
          <p className="font-semibold text-white text-sm">{activity.description}</p>
          <p className="text-xs text-gray-400">{timeAgo}</p>
        </div>
      </div>
      <p className={`font-mono text-base ${isCredit ? 'text-green-400' : 'text-red-400'}`}>
        {formattedAmount}
      </p>
    </div>
  );
};