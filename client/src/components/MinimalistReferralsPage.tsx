"use client";

import { useTranslation } from 'react-i18next';
import { 
  Users, 
  DollarSign, 
  UserCheck, 
  Network, 
  Copy, 
  Share2,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useReferralData } from '@/hooks/useReferralData';
import { useReferralList } from '@/hooks/useReferralList';
import { useReferralStats } from '@/hooks/useReferralStats';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { BackButton } from './BackButton';
import { showSuccess, showError } from '@/utils/toast';

export const MinimalistReferralsPage = () => {
  const { t } = useTranslation();
  const { user } = useTelegramAuth();
  const { hapticLight } = useHapticFeedback();
  const { data: referralData, isLoading: referralDataLoading } = useReferralData(user?.telegramId);
  const { data: referralList, isLoading: referralListLoading } = useReferralList(user?.telegramId);
  const { data: referralStats, isLoading: referralStatsLoading } = useReferralStats(user?.telegramId);

  const isLoading = referralDataLoading || referralListLoading || referralStatsLoading;

  const copyReferralLink = async () => {
    if (referralData?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralData.referralLink);
        showSuccess('Ուղեգրային հղումը պատճենվեց!');
        hapticLight();
      } catch (error) {
        showError('Չհաջողվեց պատճենել հղումը');
      }
    }
  };

  const shareReferralLink = async () => {
    if (referralData?.referralLink && navigator.share) {
      try {
        await navigator.share({
          title: 'Միացեք FastMine-ին',
          text: 'Միացեք FastMine-ին և սկսեք վաստակել!',
          url: referralData.referralLink,
        });
        hapticLight();
      } catch (error) {
        // Fallback to copy
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading referrals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <div className="p-2 bg-emerald-500/10 rounded-xl">
            <Users className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-2xl font-light text-foreground">Referrals</h1>
            <p className="text-sm text-muted-foreground">
              Invite friends and earn together
            </p>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-6 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="minimal-card text-center">
            <div className="p-3 bg-emerald-500/10 rounded-xl mb-3">
              <DollarSign className="w-6 h-6 text-emerald-500 mx-auto" />
            </div>
            <div className="text-2xl font-light text-emerald-500 mb-1">
              ${referralStats?.totalReferralEarnings.toFixed(2) || '0.00'}
            </div>
            <div className="text-xs text-muted-foreground">Total Earnings</div>
          </div>
          
          <div className="minimal-card text-center">
            <div className="p-3 bg-primary/10 rounded-xl mb-3">
              <UserCheck className="w-6 h-6 text-primary mx-auto" />
            </div>
            <div className="text-2xl font-light text-primary mb-1">
              {referralList?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">Friends Invited</div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Your Referral Link</h2>
        <div className="minimal-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary/10 rounded-xl">
              <Network className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground text-sm mb-1">
                Share Your Link
              </h3>
              <p className="text-xs text-muted-foreground">
                Earn 10% from your friends' investments
              </p>
            </div>
          </div>
          
          <div className="bg-muted/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground break-all">
              {referralData?.referralLink || 'Loading...'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={copyReferralLink}
              className="flex-1 minimal-btn py-2 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              Copy
            </button>
            <button
              onClick={shareReferralLink}
              className="flex-1 primary-btn py-2 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Referral List */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">Your Friends</h2>
        {referralList && referralList.length > 0 ? (
          <div className="space-y-3">
            {referralList.map((friend) => (
              <div key={friend.id} className="minimal-card">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <UserCheck className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground text-sm">
                        {friend.firstName || 'Friend'}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(friend.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-emerald-500">
                      ${friend.totalEarnings?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Your earnings
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="minimal-card text-center py-8">
            <div className="p-4 bg-muted/20 rounded-xl mb-4 w-fit mx-auto">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-2">No friends yet</h3>
            <p className="text-sm text-muted-foreground">
              Share your referral link to invite friends and start earning!
            </p>
          </div>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
};
