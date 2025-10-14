import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, User, Calendar, DollarSign } from 'lucide-react';

interface User {
  id: string;
  telegramId: string;
  firstName: string | null;
  username: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  isFrozen: boolean;
  isSuspicious: boolean;
  balance: number;
  totalInvested: number;
  createdAt: string;
  lastSeenAt: string;
  referralCount: number;
}

interface MobileUserCardProps {
  user: User;
  isSelected: boolean;
  onSelect: (userId: string, selected: boolean) => void;
  onUserAction: (userId: string, action: string) => void;
}

export const MobileUserCard = ({ user, isSelected, onSelect, onUserAction }: MobileUserCardProps) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const getStatusBadge = (user: User) => {
    if (user.isFrozen) return <Badge variant="destructive" className="text-xs">Frozen</Badge>;
    if (user.isSuspicious) return <Badge variant="destructive" className="text-xs">Suspicious</Badge>;
    if (user.isActive) return <Badge variant="default" className="text-xs">Active</Badge>;
    return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      'ADMIN': 'bg-red-600',
      'STAFF': 'bg-blue-600',
      'USER': 'bg-gray-600'
    };
    return (
      <Badge className={`${colors[role as keyof typeof colors] || 'bg-gray-600'} text-xs`}>
        {role}
      </Badge>
    );
  };

  const handleAction = (action: string) => {
    onUserAction(user.id, action);
    setShowActions(false);
  };

  return (
    <Card className={`bg-gray-800 border-gray-700 transition-all duration-200 ${
      isSelected ? 'ring-2 ring-purple-400 bg-purple-900/20' : 'hover:bg-gray-700/50'
    }`}>
      <CardContent className="p-4">
        {/* Header with checkbox and user info */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              className="rounded border-gray-600 bg-gray-800 mt-1"
              checked={isSelected}
              onChange={(e) => onSelect(user.id, e.target.checked)}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <User className="h-4 w-4 text-gray-400" />
                <div className="font-medium text-white text-sm truncate">
                  {user.firstName || user.username || `User ${user.telegramId}`}
                </div>
              </div>
              <div className="text-xs text-gray-400 truncate">
                @{user.username || 'N/A'} • ID: {user.telegramId}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {getRoleBadge(user.role)}
            {getStatusBadge(user)}
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <DollarSign className="h-3 w-3 text-yellow-400" />
              <span className="text-xs text-gray-400">Balance</span>
            </div>
            <div className="font-mono text-yellow-400 text-sm font-semibold">
              {user.balance.toFixed(4)} USD
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-1">
              <Calendar className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-gray-400">Invested</span>
            </div>
            <div className="text-sm text-gray-300 font-semibold">
              {user.totalInvested.toFixed(2)} USD
            </div>
          </div>
        </div>
        
        {/* Additional Info */}
        <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
          <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
          <span>{user.referralCount} referrals</span>
        </div>
        
        {/* Actions */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/admin/user/${user.id}`)}
            className="text-xs flex-1 mr-2"
          >
            View Details
          </Button>
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowActions(!showActions)}
              className="text-xs"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
            
            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleAction('freeze')}
                    className="w-full text-left px-3 py-2 text-xs text-white hover:bg-gray-700"
                  >
                    Freeze Account
                  </button>
                  <button
                    onClick={() => handleAction('unfreeze')}
                    className="w-full text-left px-3 py-2 text-xs text-white hover:bg-gray-700"
                  >
                    Unfreeze Account
                  </button>
                  <button
                    onClick={() => handleAction('ban')}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-gray-700"
                  >
                    Ban User
                  </button>
                  <button
                    onClick={() => handleAction('delete')}
                    className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-gray-700"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
