import { Loader2, Award } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useAchievements, Achievement } from '@/hooks/useAchievements'; // Импортируем Achievement
import { AchievementCard } from '@/components/AchievementCard';
import { PageHeader } from '@/components/PageHeader';

const Achievements = () => {
  const { user } = useTelegramAuth();
  const { achievements, isLoading, error, claim, isClaiming } = useAchievements();

  const handleClaim = (achievementId: string) => {
    if (user) {
      claim({ telegramId: user.telegramId, achievementId });
    }
  };

  return (
    <div className="flex flex-col text-white p-4">
      <PageHeader titleKey="achievements.title" />

      {isLoading ? (
        <div className="flex justify-center pt-10">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-400">
          <Award className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">Could not load achievements.</p>
          <p className="text-sm mt-1">Please try again later.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {achievements && achievements.length > 0 ? (
            achievements.map((ach: Achievement) => (
              <AchievementCard
                key={ach.id}
                achievement={ach}
                onClaim={handleClaim}
                isClaiming={isClaiming}
              />
            ))
          ) : (
            <div className="text-center py-10 text-gray-500">
              <Award className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">No Achievements Available</p>
              <p className="text-sm mt-1">Check back later for new challenges!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Achievements;