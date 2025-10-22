import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none active:scale-95 hover:scale-105 relative overflow-hidden group",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground hover:from-primary/90 hover:via-primary/90 hover:to-accent/90 active:from-primary/80 active:via-primary/80 active:to-accent/80 shadow-lg hover:shadow-xl hover:shadow-primary/25 active:shadow-md",
        destructive:
          "bg-gradient-to-r from-destructive via-red-600 to-red-700 text-destructive-foreground hover:from-destructive/90 hover:via-red-500 hover:to-red-600 active:from-destructive/80 active:via-red-400 active:to-red-500 shadow-lg hover:shadow-xl hover:shadow-destructive/25 active:shadow-md",
        outline:
          "border-2 border-input bg-background/80 backdrop-blur-sm hover:bg-accent/80 hover:text-accent-foreground active:bg-accent/60 shadow-md hover:shadow-lg border-opacity-50 hover:border-opacity-100",
        secondary:
          "bg-gradient-to-r from-secondary via-secondary to-muted text-secondary-foreground hover:from-secondary/80 hover:via-secondary/80 hover:to-muted/80 active:from-secondary/70 active:via-secondary/70 active:to-muted/70 shadow-md hover:shadow-lg",
        ghost: "hover:bg-accent/80 hover:text-accent-foreground active:bg-accent/60 backdrop-blur-sm transition-all duration-200",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80 hover:text-primary/80 transition-colors duration-200",
        gradient: "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white hover:from-purple-600 hover:via-pink-600 hover:to-red-600 active:from-purple-700 active:via-pink-700 active:to-red-700 shadow-lg hover:shadow-xl hover:shadow-purple/25 active:shadow-md",
        glass: "bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 hover:border-white/30 active:bg-white/15 shadow-lg hover:shadow-xl active:shadow-md",
        neon: "bg-transparent border-2 border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black active:bg-cyan-300 active:text-black shadow-lg hover:shadow-cyan-400/50 active:shadow-cyan-300/50 glow-cyan",
      },
      size: {
        default: "h-12 px-6 py-3 text-sm min-h-[48px] min-w-[48px] rounded-xl",
        sm: "h-10 px-4 py-2 text-xs min-h-[44px] min-w-[44px] rounded-lg",
        lg: "h-14 px-8 py-4 text-base min-h-[56px] min-w-[56px] rounded-2xl",
        icon: "h-12 w-12 min-h-[48px] min-w-[48px] rounded-xl",
        // Mobile-optimized sizes with proper touch targets
        mobile: "h-12 px-6 py-3 text-sm min-h-[48px] min-w-[48px] rounded-xl",
        "mobile-sm": "h-10 px-4 py-2 text-xs min-h-[44px] min-w-[44px] rounded-lg",
        "mobile-lg": "h-14 px-8 py-4 text-base min-h-[56px] min-w-[56px] rounded-2xl",
        // Admin panel specific sizes
        "admin-compact": "h-12 px-3 py-2 text-xs min-h-[48px] min-w-[48px] flex-col gap-1 rounded-xl",
        "admin-grid": "h-16 px-3 py-3 text-xs min-h-[64px] min-w-[64px] flex-col gap-1 rounded-2xl",
        // Modern sizes
        "xs": "h-8 px-3 py-1 text-xs min-h-[32px] min-w-[32px] rounded-lg",
        "xl": "h-16 px-10 py-5 text-lg min-h-[64px] min-w-[64px] rounded-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "mobile", // Default to mobile-optimized size
    },
  }
);
