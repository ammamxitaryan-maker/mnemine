import { cn } from '@/lib/utils';

interface GradientSpinnerProps {
  className?: string;
}

export const GradientSpinner = ({ className }: GradientSpinnerProps) => {
  return (
    <div className={cn("relative w-24 h-24", className)}>
      <div className="absolute inset-0 rounded-full gradient-spinner" />
      <div className="absolute inset-2 bg-background rounded-full" />
    </div>
  );
};