import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Info } from 'lucide-react';
import { FlippableCard } from './FlippableCard';

interface BonusCardProps {
  id: string;
  icon: React.ElementType;
  title: string;
  statusText: string;
  buttonText?: string | React.ReactNode;
  timerText?: string | React.ReactNode;
  canClaim: boolean;
  onClaim: (e: React.MouseEvent) => void;
  isClaiming: boolean;
  isLoading: boolean;
  iconColorClass?: string;
  buttonClassName?: string;
  backContent: {
    icon: React.ElementType;
    title: string;
    description: string;
  };
}

const BonusFront = ({
  icon: Icon,
  title,
  statusText,
  buttonText,
  timerText,
  canClaim,
  onClaim,
  isClaiming,
  isLoading,
  iconColorClass = 'text-yellow-400',
  buttonClassName = 'bg-yellow-500 hover:bg-yellow-600 text-black',
}: Omit<BonusCardProps, 'id' | 'backContent'>) => {
  if (isLoading) {
    return (
      <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700 h-full">
        <CardContent className="p-3 flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900/80 backdrop-blur-sm border-gray-700 shimmer-effect h-full">
      <CardContent className="p-3 flex items-center justify-between h-full">
        <div className="flex items-center gap-3">
          <Icon className={`w-7 h-7 ${iconColorClass}`} />
          <div>
            <p className="font-bold text-white">{title}</p>
            <p className="text-xs text-gray-400">{statusText}</p>
          </div>
        </div>
        {canClaim ? (
          <Button
            onClick={onClaim}
            disabled={isClaiming}
            className={`${buttonClassName} font-bold`}
          >
            {isClaiming ? <Loader2 className="w-5 h-5 animate-spin" /> : buttonText}
          </Button>
        ) : (
          <div className="font-mono text-lg text-purple-400 flex items-center justify-center">
            {timerText}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const BonusBack = ({ icon: Icon, title, description, borderColorClass = 'border-purple-500' }: { icon: React.ElementType, title: string, description: string, borderColorClass?: string }) => {
  return (
    <Card className={`bg-gray-900/80 backdrop-blur-sm ${borderColorClass} h-full`}>
      <CardContent className="p-3 flex flex-col items-center justify-center text-center h-full">
        <Icon className="w-7 h-7 mb-1 text-purple-400" />
        <p className="font-semibold text-white text-sm">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </CardContent>
    </Card>
  );
};

export const BonusCard = (props: BonusCardProps) => {
  const { id, backContent, ...frontProps } = props;
  return (
    <div className="h-[60px]">
      <FlippableCard
        id={id}
        frontContent={<BonusFront {...frontProps} />}
        backContent={<BonusBack {...backContent} />}
      />
    </div>
  );
};