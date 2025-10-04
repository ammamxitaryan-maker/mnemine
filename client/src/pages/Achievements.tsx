import { Loader2, Award } from 'lucide-react';
import { useTelegramAuth } from '@/hooks/useTelegramAuth';
import { useAchievements, Achievement } from '@/hooks/useAchievements'; // Импортируем Achievement
import { AchievementCard } from '@/components/AchievementCard';
import { PageHeader } from '@/components/PageHeader';
import { useEffect } from 'react';

const Achievements = () => {
  const { user } = useTelegramAuth();
  const { achievements, isLoading, error, claim, isClaiming } = useAchievements();

  // Reset all card states when component unmounts (page exit)
  useEffect(() => {
    return () => {
      // Clear any persistent states for achievement cards
      if (achievements) {
        achievements.forEach(achievement => {
          localStorage.removeItem(`flippable-card-${achievement.id}`);
        });
      }
    };
  }, [achievements]);

  const handleClaim = (achievementId: string) => {
    if (user) {
      claim({ telegramId: user.telegramId, achievementId });
    }
  };

  return (
    <div className="page-container flex flex-col text-white min-h-screen">
      <div className="w-full max-w-md mx-auto px-2 py-2">
        <PageHeader titleKey="achievements.title" />

        {isLoading ? (
          <div className="flex justify-center pt-6">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-6 text-red-400">
            <Award className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <p className="text-sm">Could not load achievements.</p>
            <p className="text-xs mt-1">Please try again later.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {achievements && achievements.length > 0 ? (
              achievements.map((ach: Achievement) => (
                <div key={ach.id} className="w-full">
                  <AchievementCard
                    achievement={ach}
                    onClaim={handleClaim}
                    isClaiming={isClaiming}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Award className="w-12 h-12 mx-auto mb-2 text-gray-500" />
                <p className="text-sm">No Achievements Available</p>
                <p className="text-xs mt-1">Check back later for new challenges!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Achievements;