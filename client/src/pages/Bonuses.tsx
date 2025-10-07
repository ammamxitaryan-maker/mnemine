"use client";

import { useTranslation } from 'react-i18next';
import { Loader2, Gift, PiggyBank, Trophy, TrendingUp, Users, CalendarCheck, Crown, DollarSign, Award } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { BonusCard } from '@/components/BonusCard';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useDailyBonus } from '@/hooks/useDailyBonus';
import { useDividendsBonus } from '@/hooks/useDividendsBonus';
import { useLeaderboardBonus } from '@/hooks/useLeaderboardBonus';
import { useInvestmentGrowthBonus } from '@/hooks/useInvestmentGrowthBonus';
import { useReferralStreakBonus } from '@/hooks/useReferralStreakBonus';
import { useCountdown } from '@/hooks/useCountdown';
import { useEffect } from 'react';
import { 
  DAILY_BONUS_AMOUNT, 
  LEADERBOARD_BONUS_AMOUNT, 
  INVESTMENT_GROWTH_BONUS_AMOUNT, 
  REFERRAL_3_IN_3_DAYS_BONUS 
} from '../../../shared/constants';

const Bonuses = () => {
  const { t } = useTranslation();
  const { loading: authLoading } = useTelegramAuth();

  // Hooks for each bonus type
  const dailyBonus = useDailyBonus();
  const dividendsBonus = useDividendsBonus();
  const leaderboardBonus = useLeaderboardBonus();
  const investmentGrowthBonus = useInvestmentGrowthBonus();
  const referralStreakBonus = useReferralStreakBonus();

  // Countdown timers
  const dailyBonusTimeLeft = useCountdown(dailyBonus.status?.nextClaimAt || null);
  const dividendsTimeLeft = useCountdown(dividendsBonus.status?.nextClaimAt || null);
  const leaderboardTimeLeft = useCountdown(leaderboardBonus.status?.nextClaimAt || null);
  const investmentGrowthTimeLeft = useCountdown(investmentGrowthBonus.status?.nextClaimAt || null);

  // Reset all card states when component unmounts (page exit)
  useEffect(() => {
    return () => {
      // Clear any persistent states for bonus cards
      const bonusIds = ['daily-bonus', 'dividends-bonus', 'leaderboard-bonus', 'investment-growth-bonus', 'referral-streak-bonus'];
      bonusIds.forEach(id => {
        localStorage.removeItem(`flippable-card-${id}`);
      });
    };
  }, []);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  const bonusCardsConfig = [
    {
      id: 'daily-bonus',
      hook: dailyBonus,
      icon: Gift,
      iconColorClass: 'text-gold',
      buttonClassName: 'bg-gold hover:bg-gold/90 text-black',
      title: t('dailyBonus'),
      getStatusText: () => dailyBonus.status?.canClaim ? t('rewardReady') : t('comeBack'),
      getButtonText: () => t('claimBonus', { amount: DAILY_BONUS_AMOUNT }),
      getTimerText: () => `${String(dailyBonusTimeLeft.hours).padStart(2, '0')}:${String(dailyBonusTimeLeft.minutes).padStart(2, '0')}:${String(dailyBonusTimeLeft.seconds).padStart(2, '0')}`,
      backContent: {
        icon: CalendarCheck,
        title: t('bonuses.dailyRewards'),
        description: "Check in every day to maximize your earnings!",
      },
    },
    {
      id: 'dividends-bonus',
      hook: dividendsBonus,
      icon: PiggyBank,
      iconColorClass: 'text-emerald',
      buttonClassName: 'bg-emerald hover:bg-emerald/90 text-white',
      title: t('bonuses.dividends'),
      getStatusText: () => dividendsBonus.status?.canClaim ? `Claim your estimated ${dividendsBonus.status.estimatedAmount} USD!` : `Next claim in:`,
      getButtonText: () => `Claim Dividends`,
      getTimerText: () => `${String(dividendsTimeLeft.hours).padStart(2, '0')}:${String(dividendsTimeLeft.minutes).padStart(2, '0')}:${String(dividendsTimeLeft.seconds).padStart(2, '0')}`,
      backContent: {
        icon: TrendingUp,
        title: t('bonuses.investmentDividends'),
        description: "Receive periodic dividends based on your total investments. The more you invest, the more you earn!",
      },
    },
    {
      id: 'leaderboard-bonus',
      hook: leaderboardBonus,
      icon: Trophy,
      iconColorClass: 'text-gold',
      buttonClassName: 'bg-gold hover:bg-gold/90 text-black',
      title: t('leaderboardBonus'),
      getStatusText: () => leaderboardBonus.status?.canClaim ? `Claim your ${LEADERBOARD_BONUS_AMOUNT} USD!` : (leaderboardBonus.status?.isInTop10 ? `Next claim in:` : `Reach Top 10 to claim`),
      getButtonText: () => `Claim ${LEADERBOARD_BONUS_AMOUNT} USD`,
      getTimerText: () => leaderboardBonus.status?.isInTop10 ? `${String(leaderboardTimeLeft.hours).padStart(2, '0')}:${String(leaderboardTimeLeft.minutes).padStart(2, '0')}:${String(leaderboardTimeLeft.seconds).padStart(2, '0')}` : <Crown className="w-6 h-6 text-gray-500" />,
      backContent: {
        icon: Crown,
        title: t('bonuses.topMinerRewards'),
        description: "Be among the top 10 on the leaderboard to claim a daily bonus!",
      },
    },
    {
      id: 'investment-growth-bonus',
      hook: investmentGrowthBonus,
      icon: TrendingUp,
      iconColorClass: 'text-cyan',
      buttonClassName: 'bg-cyan hover:bg-cyan/90 text-white',
      title: t('investmentGrowthBonus'),
      getStatusText: () => investmentGrowthBonus.status?.canClaim ? `Claim your ${INVESTMENT_GROWTH_BONUS_AMOUNT} USD!` : (investmentGrowthBonus.status?.hasRecentInvestmentActivity ? `Next claim in:` : `Invest more to claim`),
      getButtonText: () => `Claim ${INVESTMENT_GROWTH_BONUS_AMOUNT} USD`,
      getTimerText: () => investmentGrowthBonus.status?.hasRecentInvestmentActivity ? `${String(investmentGrowthTimeLeft.hours).padStart(2, '0')}:${String(investmentGrowthTimeLeft.minutes).padStart(2, '0')}:${String(investmentGrowthTimeLeft.seconds).padStart(2, '0')}` : <DollarSign className="w-6 h-6 text-gray-500" />,
      backContent: {
        icon: DollarSign,
        title: t('bonuses.growPortfolio'),
        description: "Make new investments (deposits, slots, boosters) to earn a weekly bonus!",
      },
    },
    {
      id: 'referral-streak-bonus',
      hook: referralStreakBonus,
      icon: Users,
      iconColorClass: 'text-secondary',
      buttonClassName: 'bg-secondary hover:bg-secondary/90 text-white',
      title: t('referralStreakBonus'),
      getStatusText: () => referralStreakBonus.status?.canClaim ? `Claim your ${REFERRAL_3_IN_3_DAYS_BONUS} USD!` : `Invite 3 friends in 3 days (${referralStreakBonus.status?.referralCountIn3Days ?? 0}/3)`,
      getButtonText: () => `Claim ${REFERRAL_3_IN_3_DAYS_BONUS} USD`,
      getTimerText: () => `${referralStreakBonus.status?.referralCountIn3Days ?? 0}/3`,
      backContent: {
        icon: Award,
        title: t('bonuses.referralStreaks'),
        description: "Invite 3 friends within a 3-day period to earn an extra bonus!",
      },
    },
  ];

  return (
    <div className="page-container flex flex-col text-white min-h-screen">
      <div className="w-full max-w-md mx-auto px-2 py-2">
        <PageHeader titleKey="bonuses.title" />

        <div className="space-y-3 pb-4">
          {bonusCardsConfig.map(config => (
            <div key={config.id} className="w-full">
              <BonusCard
                id={config.id}
                icon={config.icon}
                iconColorClass={config.iconColorClass}
                buttonClassName={config.buttonClassName}
                title={config.title}
                isLoading={config.hook.isLoading}
                isClaiming={config.hook.isClaiming}
                canClaim={config.hook.status?.canClaim ?? false}
                onClaim={(e) => { e.stopPropagation(); config.hook.claim(); }}
                statusText={config.getStatusText()}
                buttonText={config.getButtonText()}
                timerText={config.getTimerText()}
                backContent={config.backContent}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Bonuses;
