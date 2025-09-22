"use client";

import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Wallet } from 'lucide-react';
import { BalanceSkeleton } from './LoadingSkeleton';
import { AnimatedEarningsDisplay } from './AnimatedEarningsDisplay';
import { UserData } from '@/hooks/useUserData'; // Import UserData type

interface MainCardFrontProps {
  userData: UserData | undefined; // Use UserData type
  slotsData: any[] | undefined;
  displayEarnings: number; // This will now be the raw accrued earnings
  onClaim: () => void;
  isClaiming: boolean;
  onReinvest: () => void;
  isReinvesting: boolean;
}

export const MainCardFront = ({ userData, displayEarnings, onClaim, isClaiming, onReinvest, isReinvesting }: MainCardFrontProps) => {
  // BUG FIX: Removed unused slotsData parameter to fix TypeScript warning
  const { t } = useTranslation();

  return (
    <Card className="w-full h-full bg-white/90 backdrop-blur-sm border-blue-300 shadow-lg flex flex-col justify-between">
      <CardContent className="p-3 flex flex-col items-center justify-center gap-4 text-center">
        {/* Balance */}
        <div>
          <h2 className="text-sm font-medium text-gray-600">{t('balance')}</h2>
          <div className="flex items-center justify-center mt-1">
            <Wallet className="w-6 h-6 mr-2 text-blue-600" />
            {userData ? (
              <p className="text-2xl font-bold text-gray-800">{(userData.balance ?? 0).toFixed(4)} <span className="text-lg text-gray-600">CFM</span></p>
            ) : (
              <BalanceSkeleton />
            )}
          </div>
        </div>
        
        {/* Accrued Earnings */}
        <div>
          <h2 className="text-sm font-medium text-gray-600">{t('accruedEarnings')}</h2>
          <div className="flex items-center justify-center mt-1">
            <AnimatedEarningsDisplay earnings={displayEarnings} /> {/* Pass raw earnings */}
          </div>
          <p className="text-xs text-green-600 mt-1 font-medium">
            {t('weeklyRate')} • Live earnings
          </p>
        </div>

        {/* Mining Power */}
        <div>
          <h2 className="text-sm font-medium text-gray-600">{t('miningPower', { power: ((userData?.miningPower ?? 0) * 100).toFixed(2) })}</h2>
        </div>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2 p-2">
        <Button onClick={(e) => { e.stopPropagation(); onClaim(); }} disabled={isClaiming || displayEarnings < 0.000001} className="w-full bg-accent hover:bg-accent/90">
          {isClaiming ? <Loader2 className="w-5 h-5 animate-spin" /> : t('claim')}
        </Button>
        <Button onClick={(e) => { e.stopPropagation(); onReinvest(); }} disabled={isReinvesting} variant="outline" className="w-full border-purple-500 text-purple-400 hover:bg-purple-500/10 hover:text-purple-300">
          {isReinvesting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('reinvest')}
        </Button>
      </CardFooter>
    </Card>
  );
};