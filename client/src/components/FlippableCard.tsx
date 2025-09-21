"use client";

import { usePersistentState } from '@/hooks/usePersistentState';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';

interface FlippableCardProps {
  id: string;
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  className?: string;
}

export const FlippableCard = ({ id, frontContent, backContent, className }: FlippableCardProps) => {
  const [isFlipped, setIsFlipped] = usePersistentState(`flippable-card-${id}`, false);
  const [isFlipping, setIsFlipping] = useState(false);

  const handleClick = useCallback(() => {
    if (isFlipping) return; // Prevent multiple clicks during animation
    
    setIsFlipping(true);
    setIsFlipped(!isFlipped);
    
    // Reset flipping state after animation completes
    setTimeout(() => {
      setIsFlipping(false);
    }, 800);
  }, [isFlipped, setIsFlipped, isFlipping]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return (
    <motion.div
      className={cn(
        "w-full h-full [perspective:1000px] cursor-pointer",
        "group relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-white/90 via-blue-50/80 to-indigo-50/90",
        "dark:from-slate-800/90 dark:via-blue-900/20 dark:to-indigo-900/30",
        "shadow-2xl hover:shadow-3xl border border-white/20 dark:border-gray-700/30",
        "backdrop-blur-xl",
        className
      )}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label={`Flip card ${isFlipped ? 'to front' : 'to back'}`}
      whileHover={{ 
        scale: 1.02, 
        y: -8,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20 
      }}
    >
      {/* Enhanced Flip indicator */}
      <motion.div 
        className={cn(
          "absolute top-4 right-4 z-10 transition-all duration-300",
          "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium",
          "bg-white/90 dark:bg-gray-800/90 text-blue-600 dark:text-blue-400",
          "border border-blue-200/50 dark:border-blue-700/50 backdrop-blur-sm",
          "shadow-lg",
          "opacity-0 group-hover:opacity-100",
          isFlipping && "opacity-100 scale-110"
        )}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div 
          className={cn(
            "w-2 h-2 rounded-full transition-colors duration-300",
            isFlipped ? "bg-orange-400" : "bg-green-400",
            isFlipping && "animate-pulse"
          )}
          animate={isFlipping ? { scale: [1, 1.2, 1] } : {}}
          transition={{ repeat: isFlipping ? Infinity : 0, duration: 0.5 }}
        />
        <span className="hidden sm:inline font-medium">
          {isFlipped ? 'Flip to Front' : 'Flip to Back'}
        </span>
        <span className="sm:hidden text-lg">
          {isFlipped ? '↩' : '↪'}
        </span>
      </motion.div>

      {/* Enhanced Progress indicator during flip */}
      {isFlipping && (
        <motion.div 
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/5 dark:bg-white/5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="w-12 h-12 border-3 border-blue-500/30 border-t-blue-500 rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>
      )}

      <motion.div
        className={cn(
          "relative w-full h-full [transform-style:preserve-3d] will-change-transform"
        )}
        animate={{ 
          rotateY: isFlipped ? 180 : 0 
        }}
        transition={{ 
          duration: 0.8, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        style={{ 
          backfaceVisibility: 'hidden'
        }}
      >
        {/* Front */}
        <motion.div 
          className="absolute w-full h-full [backface-visibility:hidden] rounded-2xl overflow-hidden"
          initial={{ opacity: 1 }}
          animate={{ opacity: isFlipped ? 0 : 1 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-white/95 via-blue-50/90 to-indigo-50/95 dark:from-slate-800/95 dark:via-blue-900/20 dark:to-indigo-900/25 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            {frontContent}
          </div>
        </motion.div>
        
        {/* Back */}
        <motion.div 
          className="absolute w-full h-full [transform:rotateY(180deg)] [backface-visibility:hidden] rounded-2xl overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: isFlipped ? 1 : 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full h-full bg-gradient-to-br from-white/95 via-indigo-50/90 to-purple-50/95 dark:from-slate-800/95 dark:via-indigo-900/20 dark:to-purple-900/25 backdrop-blur-xl border border-white/20 dark:border-gray-700/30">
            {backContent}
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced glow effects */}
      <motion.div 
        className={cn(
          "absolute inset-0 rounded-2xl transition-opacity duration-500",
          "bg-gradient-to-br from-blue-400/15 via-purple-400/10 to-indigo-400/15",
          "opacity-0 group-hover:opacity-100"
        )}
        animate={{
          background: isFlipped 
            ? "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.10) 50%, rgba(59, 130, 246, 0.15) 100%)"
            : "linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.10) 50%, rgba(99, 102, 241, 0.15) 100%)"
        }}
        transition={{ duration: 0.5 }}
      />
      
      {/* Subtle border glow */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
        "bg-gradient-to-r from-blue-500/20 via-transparent to-indigo-500/20",
        "border border-blue-400/30 dark:border-blue-600/30"
      )} />
    </motion.div>
  );
};