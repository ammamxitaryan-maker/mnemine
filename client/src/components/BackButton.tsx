"use client";

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  className?: string;
  fallbackPath?: string;
}

export const BackButton = ({ className = '', fallbackPath = '/' }: BackButtonProps) => {
  const navigate = useNavigate();
  const { hapticLight } = useHapticFeedback();

  const handleBack = () => {
    hapticLight();
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={`p-2 hover:bg-muted/50 transition-colors ${className}`}
      aria-label="Go back"
    >
      <ArrowLeft className="w-5 h-5 text-foreground" />
    </Button>
  );
};
