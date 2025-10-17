"use client";

import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useReferralData } from '@/hooks/useReferralData';
import { useReferralList } from '@/hooks/useReferralList';
import { useReferralStats } from '@/hooks/useReferralStats';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { showError, showSuccess } from '@/utils/toast';
import {
  Copy,
  DollarSign,
  Network,
  Share2,
  UserCheck,
  Users
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BackButton } from './BackButton';

export const MinimalistReferralsPage = () => {
  const { t, i18n } = useTranslation();
  const { user } = useTelegramAuth();

  // Debug: Log current language and test translation
  console.log('[REFERRALS] Current language:', i18n.language);
  console.log('[REFERRALS] Test translation:', t('referrals.title'));
  const { hapticLight } = useHapticFeedback();
  const { data: referralData, isLoading: referralDataLoading } = useReferralData(user?.telegramId);
  const { data: referralList, isLoading: referralListLoading } = useReferralList(user?.telegramId);
  const { data: referralStats, isLoading: referralStatsLoading } = useReferralStats(user?.telegramId);

  const isLoading = referralDataLoading || referralListLoading || referralStatsLoading;

  const copyReferralLink = async () => {
    if (referralData?.referralLink) {
      try {
        await navigator.clipboard.writeText(referralData.referralLink);
        showSuccess(t('referrals.linkCopied'));
        hapticLight();
      } catch (error) {
        showError(t('referrals.copyFailed'));
      }
    }
  };

  const shareReferralLink = async () => {
    if (referralData?.referralLink && navigator.share) {
      try {
        await navigator.share({
          title: t('referrals.shareTitle'),
          text: t('referrals.shareText'),
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
          <p className="text-muted-foreground">{t('referrals.loading')}</p>
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
            <h1 className="text-2xl font-light text-foreground">{t('referrals.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('referrals.subtitle')}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground/50">
                Language: {i18n.language}
              </p>
              {i18n.language !== 'hy' && (
                <button
                  onClick={() => i18n.changeLanguage('hy')}
                  className="text-xs text-emerald-500 hover:text-emerald-400 underline"
                >
                  Switch to Armenian
                </button>
              )}
            </div>
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
            <div className="text-xs text-muted-foreground">{t('referrals.totalEarnings')}</div>
          </div>

          <div className="minimal-card text-center">
            <div className="p-3 bg-primary/10 rounded-xl mb-3">
              <UserCheck className="w-6 h-6 text-primary mx-auto" />
            </div>
            <div className="text-2xl font-light text-primary mb-1">
              {referralList?.length || 0}
            </div>
            <div className="text-xs text-muted-foreground">{t('referrals.friendsInvited')}</div>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">{t('referrals.yourReferralLink')}</h2>
        <div className="minimal-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-secondary/10 rounded-xl">
              <Network className="w-5 h-5 text-secondary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground text-sm mb-1">
                {t('referrals.shareYourLink')}
              </h3>
              <p className="text-xs text-muted-foreground">
                {t('referrals.earnFromFriends')}
              </p>
            </div>
          </div>

          <div className="bg-muted/20 rounded-lg p-3 mb-4">
            <p className="text-xs text-muted-foreground break-all">
              {referralData?.referralLink || t('referrals.loading')}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {t('referrals.linkInstructions')}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyReferralLink}
              className="flex-1 minimal-btn py-2 flex items-center justify-center gap-2"
            >
              <Copy className="w-4 h-4" />
              {t('referrals.copy')}
            </button>
            <button
              onClick={shareReferralLink}
              className="flex-1 primary-btn py-2 flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {t('referrals.share')}
            </button>
          </div>
        </div>
      </div>

      {/* Referral List */}
      <div className="px-6 mb-6">
        <h2 className="text-lg font-medium text-foreground mb-4">{t('referrals.yourFriends')}</h2>
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
                        {friend.firstName || t('referrals.friend')}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {t('referrals.joined')} {new Date(friend.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-emerald-500">
                      ${friend.totalEarnings?.toFixed(2) || '0.00'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t('referrals.yourEarnings')}
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
            <h3 className="font-medium text-foreground mb-2">{t('referrals.noFriendsYet')}</h3>
            <p className="text-sm text-muted-foreground">
              {t('referrals.shareToInvite')}
            </p>
          </div>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
};
