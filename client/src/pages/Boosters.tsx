import { BoosterCard } from '@/components/BoosterCard';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useUserData, UserData } from '@/hooks/useUserData';
import { useBoostersData, Booster } from '@/hooks/useBoostersData';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

const Boosters = () => {
  const { user, loading: authLoading } = useTelegramAuth();
  const { data: userData, isLoading: userDataLoading } = useUserData(user?.telegramId);
  const { data: availableBoosters, isLoading: boostersLoading, error: boostersError } = useBoostersData();

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        <Loader2 className="w-12 h-12 animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col text-white">
      <div className="page-content w-full max-w-md mx-auto">
      <PageHeader titleKey="boosters.title" />

      {userDataLoading ? (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : (
        <div className="text-center mb-8 space-y-2">
          <p className="text-gray-400">Your Balance</p>
          <p className="text-3xl font-bold text-gold">{userData?.balance.toFixed(4)} USD</p>
          <p className="text-gray-400">Current Mining Power</p>
          <p className="text-2xl font-bold text-secondary">{((userData?.miningPower ?? 0) * 100).toFixed(0)}% Weekly</p>
        </div>
      )}

      {boostersLoading ? (
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : boostersError ? (
        <p className="text-red-500 text-center">Could not load boosters.</p>
      ) : (
        <div className="space-y-4">
          {availableBoosters?.map((booster: Booster) => (
            <BoosterCard key={booster.id} booster={booster} currentBalance={userData?.balance} telegramId={user?.telegramId} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default Boosters;
