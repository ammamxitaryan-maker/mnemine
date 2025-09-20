import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Lock, Trophy, Info } from 'lucide-react';
import { Achievement } from '@/hooks/useAchievements';
import { FlippableCard } from './FlippableCard';

interface AchievementCardProps {
  achievement: Achievement;
  onClaim: (achievementId: string) => void;
  isClaiming: boolean;
}

export const AchievementCard = ({ achievement, onClaim, isClaiming }: AchievementCardProps) => {
  const { id, title, description, reward, isCompleted, isClaimed } = achievement;

  const Front = (
    <Card className={`bg-gray-900/80 backdrop-blur-sm border-accent text-white h-full flex flex-col justify-between ${!isCompleted && 'opacity-60'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className={isCompleted ? "text-gold" : "text-gray-500"} />
          {title}
        </CardTitle>
        <CardDescription className="text-gray-400">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-lg font-semibold">Reward: <span className="text-gold">{reward.toFixed(2)} CFM</span></p>
      </CardContent>
      <CardFooter>
        {isClaimed ? (
          <Button className="w-full bg-emerald" disabled>
            <CheckCircle className="w-5 h-5 mr-2" />
            Claimed
          </Button>
        ) : isCompleted ? (
          <Button
            className="w-full bg-accent hover:bg-accent/90"
            onClick={(e) => {
              e.stopPropagation();
              onClaim(id);
            }}
            disabled={isClaiming}
          >
            {isClaiming ? 'Claiming...' : 'Claim Reward'}
          </Button>
        ) : (
          <Button className="w-full" variant="outline" disabled>
            <Lock className="w-5 h-5 mr-2" />
            Locked
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  const Back = (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-accent h-full flex flex-col items-center justify-center text-center">
      <CardContent className="p-4">
        <Info className="w-8 h-8 mb-2 text-accent mx-auto" />
        <p className="font-semibold text-white">Game Milestones</p>
        <p className="text-sm text-gray-400 mt-1">Achievements are awarded for reaching significant milestones. Claim them for extra rewards!</p>
      </CardContent>
    </Card>
  );

  return <FlippableCard id={id} frontContent={Front} backContent={Back} />;
};