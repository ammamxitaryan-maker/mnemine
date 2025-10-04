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
      <Card className="bg-gray-900 border-primary h-full">
        <CardContent className="p-3 flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-900 border-primary shimmer-effect h-full">
      <CardContent className="p-3 flex items-center justify-between h-full">
        <div className="flex items-center gap-3">
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
          <div>
            <p className="font-bold text-white text-sm">{title}</p>
            <p className="text-xs text-gray-400">{statusText}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm text-purple-400">
            {timerText}
          </div>
          <p className="text-xs text-gray-400">
            {canClaim ? "Ready" : "Wait"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const BonusBack = ({ 
  icon: Icon, 
  title, 
  description, 
  borderColorClass = 'border-purple-500',
  canClaim,
  onClaim,
  isClaiming,
  buttonText,
  buttonClassName
}: { 
  icon: React.ElementType, 
  title: string, 
  description: string, 
  borderColorClass?: string,
  canClaim?: boolean,
  onClaim?: (e: React.MouseEvent) => void,
  isClaiming?: boolean,
  buttonText?: string | React.ReactNode,
  buttonClassName?: string
}) => {
  return (
    <Card className={`bg-gray-900 ${borderColorClass} h-full`}>
      <CardContent className="p-3 flex flex-col justify-center h-full">
        <div className="text-center mb-3">
          <Icon className="w-6 h-6 mb-1 text-purple-400 mx-auto" />
          <p className="font-semibold text-white text-sm">{title}</p>
          <p className="text-xs text-gray-400">{description}</p>
        </div>
        {canClaim ? (
          <Button 
            onClick={onClaim}
            disabled={isClaiming}
            className={`${buttonClassName} font-bold text-sm py-2`}
          >
            {isClaiming ? <Loader2 className="w-4 h-4 animate-spin" /> : buttonText}
          </Button>
        ) : (
          <Button className="w-full bg-gray-700 text-gray-300 font-semibold py-2 text-sm" disabled>
            Not Available
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const BonusCard = (props: BonusCardProps) => {
  const { id, backContent, ...frontProps } = props;
  
  const accordionContent = (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-400">Status</span>
        <span className={`text-sm font-semibold ${frontProps.canClaim ? 'text-emerald-400' : 'text-gray-400'}`}>
          {frontProps.canClaim ? "Ready to Claim" : "Not Available"}
        </span>
      </div>
      <div className="text-xs text-gray-400">
        {frontProps.statusText}
      </div>
      {frontProps.timerText && (
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Next Available</span>
          <span className="text-sm font-mono text-purple-400">
            {frontProps.timerText}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="w-full">
      <FlippableCard
        id={id}
        frontContent={<BonusFront {...frontProps} />}
        backContent={
          <BonusBack 
            {...backContent} 
            canClaim={frontProps.canClaim}
            onClaim={frontProps.onClaim}
            isClaiming={frontProps.isClaiming}
            buttonText={frontProps.buttonText}
            buttonClassName={frontProps.buttonClassName}
          />
        }
        enableAccordion={true}
        accordionContent={accordionContent}
      />
    </div>
  );
};