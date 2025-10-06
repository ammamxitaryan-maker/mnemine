"use client";

import { usePersistentState } from '@/hooks/usePersistentState';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

interface FlippableCardProps {
  id: string;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  className?: string;
  enableAccordion?: boolean;
  accordionContent?: React.ReactNode;
  enableDoubleClick?: boolean;
  enableHoverFlip?: boolean;
  autoFlipDelay?: number;
  showFlipIndicator?: boolean;
}

export const FlippableCard = ({ 
  id, 
  frontContent, 
  backContent, 
  className, 
  enableAccordion = false,
  accordionContent,
  enableDoubleClick = false,
  enableHoverFlip = false,
  autoFlipDelay,
  showFlipIndicator = false
}: FlippableCardProps) => {
  const [isFlipped, setIsFlipped] = usePersistentState(`flippable-card-${id}`, false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  // Auto-flip functionality
  useEffect(() => {
    if (autoFlipDelay && autoFlipDelay > 0) {
      const timer = setTimeout(() => {
        setIsFlipped(!isFlipped);
      }, autoFlipDelay);
      return () => clearTimeout(timer);
    }
  }, [autoFlipDelay, isFlipped, setIsFlipped]);

  // Double-click detection
  useEffect(() => {
    if (enableDoubleClick && clickCount > 0) {
      const timer = setTimeout(() => {
        if (clickCount === 2) {
          setIsFlipped(!isFlipped);
        }
        setClickCount(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [clickCount, enableDoubleClick, isFlipped, setIsFlipped, setClickCount]);

  // Reset card states when component unmounts or page changes
  useEffect(() => {
    return () => {
      // Reset states when component unmounts
      setIsExpanded(false);
      setIsFlipped(false);
      setIsHovered(false);
      setClickCount(0);
    };
  }, [setIsExpanded, setIsFlipped, setIsHovered, setClickCount]);

  // Reset states when the card ID changes (page navigation)
  useEffect(() => {
    setIsExpanded(false);
    setIsFlipped(false);
    setIsHovered(false);
    setClickCount(0);
  }, [id, setIsExpanded, setIsFlipped, setIsHovered, setClickCount]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (enableDoubleClick) {
      setClickCount(prev => prev + 1);
      return;
    }
    
    if (enableAccordion) {
      if (!isExpanded) {
        // First click: expand accordion
        setIsExpanded(true);
      } else if (!isFlipped) {
        // Second click: flip to back
        setIsFlipped(true);
      } else {
        // Third click: return to front
        setIsFlipped(false);
        setIsExpanded(false);
      }
    } else {
      // Just flip normally
      setIsFlipped(!isFlipped);
    }
  };

  const handleMouseEnter = () => {
    if (enableHoverFlip) {
      setIsHovered(true);
      setIsFlipped(true);
    }
  };

  const handleMouseLeave = () => {
    if (enableHoverFlip) {
      setIsHovered(false);
      setIsFlipped(false);
    }
  };

  return (
    <div className={cn("w-full relative isolate", className)}>
      {/* Enhanced Flip indicator */}
      {showFlipIndicator && (
        <div className="absolute top-4 right-4 z-30">
          <div className={cn(
            "w-3 h-3 rounded-full transition-all duration-300 shadow-lg",
            isFlipped ? "bg-purple-400 shadow-purple-400/50" : "bg-slate-500 shadow-slate-500/50"
          )} />
        </div>
      )}
      
        {/* Card Container - Optimized Height for Better Visibility */}
        <div
          className={cn(
            "w-full h-40 sm:h-44 [perspective:1000px] cursor-pointer transition-all duration-300 relative z-10",
            enableAccordion && isExpanded && "h-48 sm:h-52",
            enableHoverFlip && "hover:scale-[1.02]"
          )}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-700 ease-in-out [transform-style:preserve-3d]",
            isFlipped ? '[transform:rotateY(180deg)]' : '',
            enableHoverFlip && isHovered && "shadow-2xl shadow-purple-500/20"
          )}
        >
          {/* Front */}
          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] z-10">
            {frontContent}
          </div>
          {/* Back */}
          <div className="absolute inset-0 w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden] z-10">
            {backContent}
          </div>
        </div>
      </div>
      
      {/* Enhanced Accordion Content - Separate Layer */}
      {enableAccordion && isExpanded && accordionContent && (
        <div className={cn(
          "w-full transition-all duration-500 ease-in-out overflow-hidden relative z-20 mt-4",
          isExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="relative bg-gradient-to-br from-slate-800/95 to-slate-900/95 border border-slate-700/60 rounded-xl backdrop-blur-sm shadow-2xl">
            {accordionContent}
          </div>
        </div>
      )}
    </div>
  );
};