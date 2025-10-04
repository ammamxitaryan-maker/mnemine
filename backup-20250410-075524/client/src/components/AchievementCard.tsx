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
    <Card className={`bg-gray-900 border-primary text-white h-full flex items-center justify-between p-4 transition-all duration-300 ${!isCompleted && 'opacity-60'} ${isCompleted && !isClaimed ? 'ring-2 ring-gold/30 shadow-lg shadow-gold/20' : ''}`}>
      <div className="flex items-center gap-3">
        <Trophy className={`w-6 h-6 ${isCompleted ? "text-gold animate-pulse-subtle" : "text-gray-500"}`} />
        <div>
          <p className="font-bold text-white text-sm">{title}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-gold font-bold text-sm">{reward.toFixed(2)} CFM</p>
        <p className="text-xs text-gray-400">
          {isClaimed ? "Claimed" : isCompleted ? "Ready" : "Locked"}
        </p>
      </div>
    </Card>
  );

  const Back = (
    <Card className="bg-gray-900 border-primary h-full flex flex-col justify-center p-4">
      <div className="text-center mb-4">
        <Info className="w-8 h-8 mb-2 text-accent mx-auto" />
        <p className="font-bold text-white text-sm mb-1">Game Milestones</p>
        <p className="text-xs text-gray-300">Complete challenges to earn rewards!</p>
      </div>
      <div className="space-y-2">
        {isClaimed ? (
          <Button className="w-full bg-emerald-600 text-white font-semibold py-2 text-sm" disabled>
            <CheckCircle className="w-4 h-4 mr-2" />
            Claimed
          </Button>
        ) : isCompleted ? (
          <Button
            className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-2 text-sm animate-pulse-subtle"
            onClick={(e) => {
              e.stopPropagation();
              onClaim(id);
            }}
            disabled={isClaiming}
          >
            {isClaiming ? 'Claiming...' : 'Claim Reward'}
          </Button>
        ) : (
          <Button className="w-full bg-gray-700 text-gray-300 font-semibold py-2 text-sm" variant="outline" disabled>
            <Lock className="w-4 h-4 mr-2" />
            Locked
          </Button>
        )}
      </div>
    </Card>
  );

  const accordionContent = (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Progress</span>
        <span className="text-sm font-semibold text-gold">
          {isCompleted ? "100%" : "0%"}
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full transition-all duration-500 ${
            isCompleted ? 'bg-gold' : 'bg-gray-600'
          }`}
          style={{ width: isCompleted ? '100%' : '0%' }}
        />
      </div>
      <div className="text-xs text-gray-400">
        {isCompleted 
          ? "Achievement completed! Claim your reward." 
          : "Complete the requirements to unlock this achievement."
        }
      </div>
    </div>
  );

  return (
    <FlippableCard 
      id={id} 
      frontContent={Front} 
      backContent={Back}
      enableAccordion={true}
      accordionContent={accordionContent}
    />
  );
};