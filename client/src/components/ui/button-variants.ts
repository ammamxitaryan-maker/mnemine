import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 touch-manipulation select-none active:scale-95 hover:scale-105",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 shadow-sm hover:shadow-md",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80 shadow-sm hover:shadow-md",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-accent/80 shadow-sm hover:shadow-md",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70 shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
        link: "text-primary underline-offset-4 hover:underline active:text-primary/80",
      },
      size: {
        default: "h-11 px-4 py-2 text-sm min-h-[44px] min-w-[44px]",
        sm: "h-10 px-3 py-1 text-xs min-h-[44px] min-w-[44px]",
        lg: "h-12 px-6 py-3 text-base min-h-[44px] min-w-[44px]",
        icon: "h-11 w-11 min-h-[44px] min-w-[44px]",
        // Mobile-optimized sizes with proper touch targets
        mobile: "h-11 px-4 py-2 text-sm min-h-[44px] min-w-[44px]",
        "mobile-sm": "h-10 px-3 py-1 text-xs min-h-[44px] min-w-[44px]",
        "mobile-lg": "h-12 px-6 py-3 text-base min-h-[44px] min-w-[44px]",
        // Admin panel specific sizes
        "admin-compact": "h-12 px-2 py-1 text-xs min-h-[48px] min-w-[48px] flex-col gap-1",
        "admin-grid": "h-16 px-2 py-2 text-xs min-h-[64px] min-w-[64px] flex-col gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "mobile", // Default to mobile-optimized size
    },
  }
);
