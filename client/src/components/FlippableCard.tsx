"use client";

import { usePersistentState } from '@/hooks/usePersistentState';
import { cn } from '@/lib/utils';

interface FlippableCardProps {
  id: string;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  className?: string;
}

export const FlippableCard = ({ id, frontContent, backContent, className }: FlippableCardProps) => {
  const [isFlipped, setIsFlipped] = usePersistentState(`flippable-card-${id}`, false);

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={cn("w-full h-full [perspective:1000px] cursor-pointer", className)}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label={`Flip card ${isFlipped ? 'to front' : 'to back'}`}
    >
      <div
        className={cn(
          "relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d] will-change-transform",
          isFlipped ? '[transform:rotateY(180deg)]' : ''
        )}
        style={{ 
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Front */}
        <div className="absolute w-full h-full [backface-visibility:hidden]">
          {frontContent}
        </div>
        {/* Back */}
        <div className="absolute w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden]">
          {backContent}
        </div>
      </div>
    </div>
  );
};