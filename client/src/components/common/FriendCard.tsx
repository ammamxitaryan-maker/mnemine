import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface ReferredUser {
  id: string;
  firstName: string | null;
  username: string | null;
  avatarUrl: string | null;
  isOnline: boolean;
  createdAt: string;
  totalInvested: number;
  totalEarnings: number;
}

interface FriendCardProps {
  friend: ReferredUser;
}

export const FriendCard = ({ friend }: FriendCardProps) => {
  const { t } = useTranslation();
  const displayName = friend.firstName || friend.username || t('referrals.anonymous');
  const fallbackInitial = displayName?.charAt(0).toUpperCase() || 'A';
  const joinedAgo = formatDistanceToNow(new Date(friend.createdAt), { addSuffix: true });

  return (
    <div className="flex items-center p-3 bg-gray-800 rounded-lg">
      <div className="relative">
        <Avatar className="h-10 w-10 mr-4">
          {friend.avatarUrl && <AvatarImage src={friend.avatarUrl} alt={displayName || 'Friend'} />}
          <AvatarFallback className="bg-gray-700 text-gray-400">
            {fallbackInitial ? fallbackInitial : <User className="w-5 h-5" />}
          </AvatarFallback>
        </Avatar>
        {friend.isOnline && (
          <div className="absolute bottom-0 right-4 w-3 h-3 bg-green-500 border-2 border-gray-800 rounded-full" />
        )}
      </div>
      <div className="flex-grow">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-white">{displayName}</p>
        </div>
        <p className="text-sm text-gray-400">{t('friendCard.joined', { time: joinedAgo })}</p>
      </div>
      <div className="flex flex-col items-end text-right">
        <div className="flex items-center gap-1 text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="font-bold">{friend.totalInvested.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500">{t('friendCard.invested')}</p>
      </div>
    </div>
  );
};