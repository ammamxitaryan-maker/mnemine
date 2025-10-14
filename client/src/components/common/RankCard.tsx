"use client";

import { useTranslation } from 'react-i18next';
import { BRONZE_INVESTOR_THRESHOLD, GOLD_MAGNATE_THRESHOLD, PLATINUM_GOD_THRESHOLD } from '@/shared/constants';
import { UserStats } from '@/hooks/useStatsData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RankBenefits } from './RankBenefits';
import { Award, Shield, ShieldCheck, Gem, ShieldOff } from 'lucide-react';

interface RankCardProps {
  stats: UserStats;
}

const rankTiers = [
  { name: 'Bronze Investor', threshold: BRONZE_INVESTOR_THRESHOLD, icon: Shield, color: 'text-yellow-600' },
  { name: 'Gold Magnate', threshold: GOLD_MAGNATE_THRESHOLD, icon: ShieldCheck, color: 'text-gold' },
  { name: 'Platinum God', threshold: PLATINUM_GOD_THRESHOLD, icon: Gem, color: 'text-cyan' },
];

export const RankCard = ({ stats }: RankCardProps) => {
  const { t } = useTranslation();
  const { totalInvested } = stats;

  let currentRank: typeof rankTiers[0] | null = null;
  let nextRank: typeof rankTiers[0] | null = rankTiers[0];
  let progress = 0;
  let lowerBound = 0;

  for (let i = 0; i < rankTiers.length; i++) {
    if (totalInvested >= rankTiers[i].threshold) {
      currentRank = rankTiers[i];
      lowerBound = rankTiers[i].threshold;
      if (i + 1 < rankTiers.length) {
        nextRank = rankTiers[i + 1];
      } else {
        nextRank = null; // Max rank
      }
    } else {
      nextRank = rankTiers[i];
      break;
    }
  }

  if (nextRank) {
    const range = nextRank.threshold - lowerBound;
    const investedInRange = totalInvested - lowerBound;
    progress = (investedInRange / range) * 100;
  } else {
    progress = 100;
  }

  const CurrentIcon = currentRank ? currentRank.icon : ShieldOff;
  const currentIconColor = currentRank ? currentRank.color : 'text-gray-600';

  return (
    <Card className="w-full bg-gray-900/80 border-primary">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-100">
          <Award className="w-5 h-5 text-accent" />
          {t('yourRank')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <CurrentIcon className={`w-20 h-20 mx-auto ${currentIconColor}`} />
          <p className="text-xl font-bold mt-2">{stats.rank || t('rankProgress.noRank')}</p>
        </div>

        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs font-medium text-gray-200">
            <span>{currentRank?.name || t('rankProgress.noRank')}</span>
            <span className="text-white">{nextRank ? nextRank.name : t('rankProgress.maxRank')}</span>
          </div>
          <Progress value={progress} className="w-full h-2 bg-gray-700 [&>*]:bg-gradient-to-r from-secondary to-cyan" />
          <div className="text-center text-xs text-gray-300 mt-1">
            {nextRank ? t('rankProgress.investMore', { amount: (nextRank.threshold - totalInvested).toFixed(2), rankName: nextRank.name }) : t('rankProgress.maxRank')}
          </div>
        </div>

        {stats.rank && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-t border-gray-700">
              <AccordionTrigger className="text-secondary hover:no-underline">
                {t('rankBenefits')}
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <RankBenefits rank={stats.rank} />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};